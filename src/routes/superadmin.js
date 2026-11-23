const express = require('express');

function createSuperadminRouter({ pool, withAuditUser }) {
  const router = express.Router();

  // Require an authenticated superadmin actor for S1-DEV-06 actions.
  // Replace or extend this with your session/JWT user lookup once auth middleware is wired.
  function requireSuperadmin(req, res, next) {
    const actorRole = String(req.user?.role_code || req.headers['x-actor-role'] || '').toUpperCase();
    const actorEmail = req.user?.email || req.headers['x-actor-email'] || null;

    if (actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        ok: false,
        error: 'Forbidden: superadmin access is required',
      });
    }

    req.actor = {
      email: actorEmail,
      role_code: 'SUPERADMIN',
    };
    return next();
  }

  // Helper: count active (non-deleted, non-blocked) superadmins with row locks
  async function countActiveSuperadmins(client, excludeUserId = null) {
    const params = [];
    let sql = `
      SELECT user_id
      FROM app_user
      WHERE UPPER(COALESCE(role_code, '')) = 'SUPERADMIN'
        AND COALESCE(is_deleted, false) = false
        AND COALESCE(is_blocked, false) = false
        AND UPPER(COALESCE(account_status, 'ACTIVE')) <> 'DISABLED'
      FOR UPDATE
    `;
    if (excludeUserId !== null) {
      params.push(excludeUserId);
      sql = `
        SELECT user_id
        FROM app_user
        WHERE UPPER(COALESCE(role_code, '')) = 'SUPERADMIN'
          AND COALESCE(is_deleted, false) = false
          AND COALESCE(is_blocked, false) = false
          AND UPPER(COALESCE(account_status, 'ACTIVE')) <> 'DISABLED'
          AND user_id <> $1
        FOR UPDATE
      `;
    }
    const { rows } = await client.query(sql, params);
    return rows.length;
  }

  // GET /api/superadmin/pending-users - List pending users awaiting approval
  router.get('/pending-users', requireSuperadmin, async (_req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked, empno, created_at
        FROM app_user
        WHERE COALESCE(is_deleted, false) = false
          AND UPPER(COALESCE(account_status, '')) = 'PENDING'
        ORDER BY created_at ASC, user_id ASC
      `);
      res.json({ ok: true, users: rows });
    } catch (err) {
      console.error('Failed to load pending users:', err);
      res.status(500).json({ ok: false, error: 'Failed to load pending users' });
    }
  });

  // POST /api/superadmin/users/:userId/approve - Approve a pending user
  router.post('/users/:userId/approve', requireSuperadmin, async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID' });
    }

    const nextRole = req.body?.role_code ? String(req.body.role_code).toUpperCase() : null;

    try {
      const updated = await withAuditUser(req.actor.email, async (client) => {
        const existingRes = await client.query(
          `SELECT * FROM app_user WHERE user_id = $1 AND COALESCE(is_deleted, false) = false FOR UPDATE`,
          [userId]
        );
        if (existingRes.rowCount === 0) {
          return { status: 404, error: 'User not found' };
        }

        const user = existingRes.rows[0];
        const targetRole = nextRole || String(user.role_code || 'USER').toUpperCase();

        const { rows } = await client.query(
          `
          UPDATE app_user
          SET account_status = 'ACTIVE',
              is_blocked = false,
              role_code = $2,
              stamp = $3
          WHERE user_id = $1
          RETURNING user_id, email, first_name, last_name, role_code, account_status, is_blocked, empno, stamp
          `,
          [userId, targetRole, req.actor.email || 'superadmin']
        );

        return { status: 200, user: rows[0] };
      });

      if (updated.error) {
        return res.status(updated.status).json({ ok: false, error: updated.error });
      }
      return res.json({ ok: true, user: updated.user });
    } catch (err) {
      console.error('Approve user failed:', err);
      return res.status(500).json({ ok: false, error: 'Failed to approve user' });
    }
  });

  // PATCH /api/superadmin/users/:userId/role - Designate admin or change role (with last-superadmin guard)
  router.patch('/users/:userId/role', requireSuperadmin, async (req, res) => {
    const userId = Number(req.params.userId);
    const nextRole = String(req.body?.role_code || '').toUpperCase();

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID' });
    }
    if (!['SUPERADMIN', 'ADMIN', 'USER'].includes(nextRole)) {
      return res.status(400).json({ ok: false, error: 'Invalid role_code' });
    }

    try {
      const result = await withAuditUser(req.actor.email, async (client) => {
        const existingRes = await client.query(
          `SELECT * FROM app_user WHERE user_id = $1 AND COALESCE(is_deleted, false) = false FOR UPDATE`,
          [userId]
        );
        if (existingRes.rowCount === 0) {
          return { status: 404, error: 'User not found' };
        }

        const user = existingRes.rows[0];
        const currentlySuperadmin = String(user.role_code || '').toUpperCase() === 'SUPERADMIN';
        const isActiveSuperadmin =
          currentlySuperadmin &&
          !user.is_blocked &&
          String(user.account_status || 'ACTIVE').toUpperCase() !== 'DISABLED';

        if (isActiveSuperadmin && nextRole !== 'SUPERADMIN') {
          const remainingOthers = await countActiveSuperadmins(client, userId);
          if (remainingOthers === 0) {
            return {
              status: 409,
              error: 'Cannot remove or demote the last remaining active superadmin',
            };
          }
        }

        const { rows } = await client.query(
          `
          UPDATE app_user
          SET role_code = $2,
              stamp = $3
          WHERE user_id = $1
          RETURNING user_id, email, first_name, last_name, role_code, account_status, is_blocked, empno, stamp
          `,
          [userId, nextRole, req.actor.email || 'superadmin']
        );

        return { status: 200, user: rows[0] };
      });

      if (result.error) {
        return res.status(result.status).json({ ok: false, error: result.error });
      }
      return res.json({ ok: true, user: result.user });
    } catch (err) {
      console.error('Role update failed:', err);
      return res.status(500).json({ ok: false, error: 'Failed to update user role' });
    }
  });

  // PATCH /api/superadmin/users/:userId/status - Block/disable/soft-delete guard for last superadmin
  router.patch('/users/:userId/status', requireSuperadmin, async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID' });
    }

    const hasBlocked = typeof req.body?.is_blocked === 'boolean';
    const hasDeleted = typeof req.body?.is_deleted === 'boolean';
    const nextStatus = req.body?.account_status ? String(req.body.account_status).toUpperCase() : null;

    const willDisable =
      (hasBlocked && req.body.is_blocked === true) ||
      (hasDeleted && req.body.is_deleted === true) ||
      nextStatus === 'DISABLED' ||
      nextStatus === 'INACTIVE' ||
      nextStatus === 'BLOCKED';

    try {
      const result = await withAuditUser(req.actor.email, async (client) => {
        const existingRes = await client.query(
          `SELECT * FROM app_user WHERE user_id = $1 FOR UPDATE`,
          [userId]
        );
        if (existingRes.rowCount === 0) {
          return { status: 404, error: 'User not found' };
        }

        const user = existingRes.rows[0];
        const isActiveSuperadmin =
          String(user.role_code || '').toUpperCase() === 'SUPERADMIN' &&
          !user.is_deleted &&
          !user.is_blocked &&
          String(user.account_status || 'ACTIVE').toUpperCase() !== 'DISABLED';

        if (isActiveSuperadmin && willDisable) {
          const remainingOthers = await countActiveSuperadmins(client, userId);
          if (remainingOthers === 0) {
            return {
              status: 409,
              error: 'Cannot disable, block, or remove the last remaining active superadmin',
            };
          }
        }

        const finalBlocked = hasBlocked ? req.body.is_blocked : user.is_blocked;
        const finalDeleted = hasDeleted ? req.body.is_deleted : user.is_deleted;
        const finalStatus = nextStatus || user.account_status;

        const { rows } = await client.query(
          `
          UPDATE app_user
          SET is_blocked = $2,
              is_deleted = $3,
              account_status = $4,
              stamp = $5
          WHERE user_id = $1
          RETURNING user_id, email, first_name, last_name, role_code, account_status, is_blocked, is_deleted, empno, stamp
          `,
          [userId, finalBlocked, finalDeleted, finalStatus, req.actor.email || 'superadmin']
        );

        return { status: 200, user: rows[0] };
      });

      if (result.error) {
        return res.status(result.status).json({ ok: false, error: result.error });
      }
      return res.json({ ok: true, user: result.user });
    } catch (err) {
      console.error('Status update failed:', err);
      return res.status(500).json({ ok: false, error: 'Failed to update user status' });
    }
  });

  return router;
}

module.exports = { createSuperadminRouter };