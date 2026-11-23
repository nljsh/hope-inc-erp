const express = require('express');

const TARGET_MODULES = [
  'CUSTOMER',
  'PRODUCT',
  'HUMAN_RESOURCES',
  'SALES',
  'REPORTS',
];

function normalizeModuleKey(val) {
  return String(val || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function createRightsRouter({ pool, withAuditUser }) {
  const router = express.Router();

  function requireAdminOrSuperadmin(req, res, next) {
    const actorRole = String(
      req.user?.role_code || req.headers['x-actor-role'] || ''
    ).toUpperCase();
    const actorEmail =
      req.user?.email || req.headers['x-actor-email'] || 'system-admin';

    if (actorRole !== 'ADMIN' && actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        ok: false,
        error: 'Forbidden: admin or superadmin access is required',
      });
    }

    req.actor = {
      email: actorEmail,
      role_code: actorRole,
    };
    return next();
  }

  // GET /api/rights/matrix?userId=123
  router.get('/matrix', requireAdminOrSuperadmin, async (req, res) => {
    const userId = Number(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: 'Valid userId is required' });
    }

    try {
      const userRes = await pool.query(
        `
        SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked
        FROM app_user
        WHERE user_id = $1 AND COALESCE(is_deleted, false) = false
        `,
        [userId]
      );
      if (userRes.rowCount === 0) {
        return res.status(404).json({ ok: false, error: 'Target user not found' });
      }

      const { rows } = await pool.query(
        `
        SELECT
          m.module_id,
          m.module_code,
          m.module_name,
          m.sort_order,
          pr.right_id,
          pr.perm_key,
          pr.right_label,
          COALESCE(up.granted, false) AS granted,
          up.user_perm_id
        FROM module m
        LEFT JOIN permission_right pr
          ON pr.module_id = m.module_id
        LEFT JOIN user_permission up
          ON up.right_id = pr.right_id
         AND up.user_id = $1
         AND COALESCE(up.is_deleted, false) = false
        ORDER BY COALESCE(m.sort_order, 999) ASC, m.module_id ASC, pr.right_id ASC
        `,
        [userId]
      );

      const moduleMap = new Map();
      for (const row of rows) {
        const normCode = normalizeModuleKey(row.module_code || row.module_name);
        if (!moduleMap.has(row.module_id)) {
          moduleMap.set(row.module_id, {
            module_id: row.module_id,
            module_code: row.module_code,
            module_name: row.module_name,
            normalized_key: normCode,
            sort_order: row.sort_order,
            rights: [],
          });
        }
        if (row.right_id !== null) {
          moduleMap.get(row.module_id).rights.push({
            right_id: row.right_id,
            perm_key: row.perm_key,
            right_label: row.right_label,
            granted: Boolean(row.granted),
            user_perm_id: row.user_perm_id || null,
          });
        }
      }

      const modules = Array.from(moduleMap.values()).filter((m) =>
        TARGET_MODULES.includes(m.normalized_key)
      );

      return res.json({
        ok: true,
        user: userRes.rows[0],
        modules: modules.length > 0 ? modules : Array.from(moduleMap.values()),
      });
    } catch (err) {
      console.error('Failed to load rights matrix:', err);
      return res.status(500).json({ ok: false, error: 'Failed to load rights matrix' });
    }
  });

  // PUT /api/rights/users/:userId
  // Body: { rights: [{ right_id: 1, granted: true }, ...] }
  router.put('/users/:userId', requireAdminOrSuperadmin, async (req, res) => {
    const targetUserId = Number(req.params.userId);
    const incomingRights = Array.isArray(req.body?.rights) ? req.body.rights : null;

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid target userId' });
    }
    if (!incomingRights) {
      return res
        .status(400)
        .json({ ok: false, error: 'Request body must include a rights array' });
    }

    const normalizedUpdates = [];
    for (const item of incomingRights) {
      const rightId = Number(item?.right_id);
      if (!Number.isInteger(rightId) || rightId <= 0 || typeof item?.granted !== 'boolean') {
        return res.status(400).json({
          ok: false,
          error: 'Each right entry must have integer right_id and boolean granted',
        });
      }
      normalizedUpdates.push({ right_id: rightId, granted: item.granted });
    }

    try {
      const result = await withAuditUser(req.actor.email, async (client) => {
        const userCheck = await client.query(
          `SELECT user_id, email FROM app_user WHERE user_id = $1 AND COALESCE(is_deleted, false) = false`,
          [targetUserId]
        );
        if (userCheck.rowCount === 0) {
          return { status: 404, error: 'Target user not found' };
        }

        const changes = [];

        for (const upd of normalizedUpdates) {
          const rightMetaRes = await client.query(
            `
            SELECT pr.right_id, pr.perm_key, pr.right_label, m.module_code, m.module_name
            FROM permission_right pr
            JOIN module m ON m.module_id = pr.module_id
            WHERE pr.right_id = $1
            `,
            [upd.right_id]
          );
          if (rightMetaRes.rowCount === 0) {
            return { status: 400, error: `Unknown right_id: ${upd.right_id}` };
          }
          const rightMeta = rightMetaRes.rows[0];

          const prevRes = await client.query(
            `
            SELECT user_perm_id, granted, is_deleted
            FROM user_permission
            WHERE user_id = $1 AND right_id = $2
            FOR UPDATE
            `,
            [targetUserId, upd.right_id]
          );

          const prevRow = prevRes.rows[0] || null;
          const prevGranted = prevRow && !prevRow.is_deleted ? Boolean(prevRow.granted) : false;

          if (prevGranted === upd.granted && prevRow && !prevRow.is_deleted) {
            continue;
          }

          let savedRow;
          let auditAction;

          if (!prevRow) {
            const insRes = await client.query(
              `
              INSERT INTO user_permission (user_id, right_id, granted, is_deleted, stamp, updated_at)
              VALUES ($1, $2, $3, false, $4, NOW())
              RETURNING user_perm_id, user_id, right_id, granted, is_deleted, stamp, updated_at
              `,
              [targetUserId, upd.right_id, upd.granted, req.actor.email]
            );
            savedRow = insRes.rows[0];
            auditAction = 'INSERT';
          } else {
            const updRes = await client.query(
              `
              UPDATE user_permission
              SET granted = $2,
                  is_deleted = false,
                  stamp = $3,
                  updated_at = NOW()
              WHERE user_perm_id = $1
              RETURNING user_perm_id, user_id, right_id, granted, is_deleted, stamp, updated_at
              `,
              [prevRow.user_perm_id, upd.granted, req.actor.email]
            );
            savedRow = updRes.rows[0];
            auditAction = 'UPDATE';
          }

          const recordKey = String(savedRow.user_perm_id);
          const oldValues = prevRow
            ? {
                user_id: targetUserId,
                right_id: upd.right_id,
                perm_key: rightMeta.perm_key,
                module_code: rightMeta.module_code,
                granted: prevGranted,
                is_deleted: Boolean(prevRow.is_deleted),
              }
            : null;

          const newValues = {
            user_id: targetUserId,
            right_id: upd.right_id,
            perm_key: rightMeta.perm_key,
            module_code: rightMeta.module_code,
            granted: Boolean(savedRow.granted),
            is_deleted: false,
          };

          // Only insert into audit_log if a DB trigger hasn't already logged this record in the current tx
          const triggerLogCheck = await client.query(
            `
            SELECT 1
            FROM audit_log
            WHERE table_name = 'user_permission'
              AND record_key = $1
              AND action_at >= NOW() - INTERVAL '5 seconds'
            LIMIT 1
            `,
            [recordKey]
          );

          if (triggerLogCheck.rowCount === 0) {
            await client.query(
              `
              INSERT INTO audit_log (
                table_name,
                action,
                record_key,
                old_values,
                new_values,
                action_by,
                action_at
              )
              VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, NOW())
              `,
              [
                'user_permission',
                auditAction,
                recordKey,
                oldValues ? JSON.stringify(oldValues) : null,
                JSON.stringify(newValues),
                req.actor.email,
              ]
            );
          }

          changes.push({
            user_perm_id: savedRow.user_perm_id,
            right_id: upd.right_id,
            perm_key: rightMeta.perm_key,
            module_code: rightMeta.module_code,
            previous_granted: prevGranted,
            granted: Boolean(savedRow.granted),
            action: auditAction,
          });
        }

        return { status: 200, changes };
      });

      if (result.error) {
        return res.status(result.status).json({ ok: false, error: result.error });
      }
      return res.json({
        ok: true,
        userId: targetUserId,
        updatedCount: result.changes.length,
        changes: result.changes,
      });
    } catch (err) {
      console.error('Failed to save user rights:', err);
      return res.status(500).json({ ok: false, error: 'Failed to save user rights' });
    }
  });

  return router;
}

module.exports = { createRightsRouter, TARGET_MODULES };