const express = require('express');

const MODULES = [
  {
    key: 'Customer',
    label: 'Customer',
    moduleKey: 'customers',
    rights: ['customers.view', 'customers.add', 'customers.edit', 'customers.delete', 'customers.restore'],
  },
  {
    key: 'Product',
    label: 'Product',
    moduleKey: 'products',
    rights: [
      'products.view',
      'products.add',
      'products.edit',
      'products.delete',
      'products.restore',
      'prices.view',
      'prices.add',
      'prices.edit',
      'prices.delete',
    ],
  },
  {
    key: 'Human Resources',
    label: 'Human Resources',
    moduleKey: 'employees',
    rights: [
      'employees.view',
      'employees.add',
      'employees.edit',
      'employees.delete',
      'employees.restore',
      'jobhistory.view',
      'jobhistory.add',
      'jobhistory.edit',
      'jobhistory.delete',
    ],
  },
  {
    key: 'Sales',
    label: 'Sales',
    moduleKey: 'sales',
    rights: [
      'sales.view',
      'sales.add',
      'sales.edit',
      'sales.delete',
      'sales.restore',
      'payments.view',
      'payments.add',
    ],
  },
  {
    key: 'Reports',
    label: 'Reports',
    moduleKey: 'reports',
    rights: [
      'reports.product_master',
      'reports.active_employees',
      'reports.all_employees',
      'reports.employee_job_history',
      'reports.top_customers',
      'reports.top_products',
      'reports.top_sales',
    ],
  },
];

const ALL_RIGHTS = MODULES.flatMap((m) => m.rights);

function normalizeRightKey(key) {
  const k = String(key || '').trim().toLowerCase();
  const aliases = {
    'customer.view': 'customers.view',
    'customer.add': 'customers.add',
    'customer.edit': 'customers.edit',
    'customer.delete': 'customers.delete',
    'customer.restore': 'customers.restore',
    'product.view': 'products.view',
    'product.add': 'products.add',
    'product.edit': 'products.edit',
    'product.delete': 'products.delete',
    'product.restore': 'products.restore',
    'price.view': 'prices.view',
    'price.add': 'prices.add',
    'price.edit': 'prices.edit',
    'price.delete': 'prices.delete',
    'hr.view': 'employees.view',
    'hr.add': 'employees.add',
    'hr.edit': 'employees.edit',
    'hr.delete': 'employees.delete',
    'hr.restore': 'employees.restore',
    'payment.view': 'payments.view',
    'payment.add': 'payments.add',
    'report.product_master': 'reports.product_master',
    'report.active_employees': 'reports.active_employees',
    'report.all_employees': 'reports.all_employees',
    'report.employee_job_history': 'reports.employee_job_history',
    'report.top_customers': 'reports.top_customers',
    'report.top_products': 'reports.top_products',
    'report.top_sales': 'reports.top_sales',
  };
  return aliases[k] || k;
}

function splitFullName(fullName, fallbackFirst = 'Operator', fallbackLast = 'User') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: fallbackFirst, lastName: fallbackLast };
  if (parts.length === 1) return { firstName: parts[0], lastName: fallbackLast };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function formatUserRow(row) {
  const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
  return {
    user_id: row.user_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: fullName,
    role: row.role_code,
    role_code: row.role_code,
    status: row.account_status,
    account_status: row.account_status,
    blocked: Boolean(row.is_blocked),
    is_blocked: Boolean(row.is_blocked),
    created_at: row.created_at,
  };
}

function createAdminRouter({ pool, withAuditUser }) {
  const router = express.Router();

  async function loadRightCatalogue(client = pool) {
    const res = await client.query(
      `SELECT pr.right_id, pr.module_id, pr.perm_key, pr.right_label, m.module_code, m.module_name
       FROM public.permission_right pr
       LEFT JOIN public.module m ON m.module_id = pr.module_id
       ORDER BY pr.right_id ASC`
    );

    const byKey = new Map();
    const byId = new Map();
    const allKeys = [];

    for (const row of res.rows) {
      const normalized = normalizeRightKey(row.perm_key);
      if (!byId.has(row.right_id)) {
        byId.set(row.right_id, { right_id: row.right_id, perm_key: row.perm_key, key: normalized });
      }
      if (!byKey.has(normalized)) {
        byKey.set(normalized, row.right_id);
        allKeys.push(normalized);
      }
      const rawLower = String(row.perm_key || '').trim().toLowerCase();
      if (rawLower && !byKey.has(rawLower)) {
        byKey.set(rawLower, row.right_id);
      }
    }

    return {
      byKey,
      byId,
      allKeys: allKeys.length ? allKeys : [...ALL_RIGHTS],
      dbRights: res.rows,
    };
  }

  async function getGrantedRightsForUser(userId, roleCode, catalogue, client = pool) {
    if (roleCode === 'superadmin') {
      return [...catalogue.allKeys];
    }

    const permsRes = await client.query(
      `SELECT up.right_id, pr.perm_key
       FROM public.user_permission up
       JOIN public.permission_right pr ON pr.right_id = up.right_id
       WHERE up.user_id = $1 AND up.granted = TRUE AND NOT up.is_deleted`,
      [userId]
    );

    const set = new Set();
    for (const row of permsRes.rows) {
      const mapped =
        catalogue.byId.get(row.right_id)?.key ||
        normalizeRightKey(row.perm_key);
      if (mapped) set.add(mapped);
    }
    return [...set];
  }

  async function resolveActor(req) {
    const email = String(req.headers['x-actor-email'] || req.query.actorEmail || '')
      .trim()
      .toLowerCase();
    if (!email) return null;

    const { rows } = await pool.query(
      `SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked, is_deleted
       FROM public.app_user
       WHERE LOWER(email) = LOWER($1) AND NOT is_deleted`,
      [email]
    );
    if (!rows.length) return null;
    const actor = rows[0];
    if (actor.is_blocked || actor.account_status === 'blocked' || actor.account_status !== 'active') {
      return null;
    }

    const catalogue = await loadRightCatalogue(pool);
    const rights = await getGrantedRightsForUser(actor.user_id, actor.role_code, catalogue, pool);

    return {
      ...actor,
      role: actor.role_code,
      full_name: `${actor.first_name || ''} ${actor.last_name || ''}`.trim(),
      rights,
      catalogue,
    };
  }

  function requireStaff(req, res, next) {
    resolveActor(req)
      .then((actor) => {
        if (!actor) {
          return res.status(401).json({ ok: false, error: 'Unauthorized or inactive account.' });
        }
        if (actor.role_code !== 'superadmin' && actor.role_code !== 'admin') {
          return res.status(403).json({ ok: false, error: 'Forbidden: Admin or Superadmin access required.' });
        }
        req.actor = actor;
        next();
      })
      .catch(next);
  }

  // S1-DEV-08: Effective role, rights, and allowed modules
  router.get('/session-permissions', async (req, res) => {
    try {
      const actor = await resolveActor(req);
      if (!actor) {
        return res.json({
          ok: true,
          authenticated: false,
          role: 'user',
          rights: [],
          allowedModules: ['overview'],
          canManageUsers: false,
          canApproveUsers: false,
          canAssignRights: false,
        });
      }

      const isStaff = actor.role_code === 'superadmin' || actor.role_code === 'admin';
      const allowedModules = ['overview'];
      for (const mod of MODULES) {
        if (actor.role_code === 'superadmin' || mod.rights.some((r) => actor.rights.includes(r))) {
          allowedModules.push(mod.moduleKey);
        }
      }

      return res.json({
        ok: true,
        authenticated: true,
        userId: actor.user_id,
        email: actor.email,
        fullName: actor.full_name,
        role: actor.role_code,
        rights: actor.rights,
        allowedModules,
        canManageUsers: isStaff,
        canApproveUsers: actor.role_code === 'superadmin',
        canAssignRights: isStaff,
      });
    } catch (err) {
      console.error('session-permissions error:', err);
      res.status(500).json({ ok: false, error: 'Failed to load permissions.' });
    }
  });

  async function countActiveSuperadmins(client = pool, excludeUserId = null) {
    const params = [];
    let sql = `
      SELECT COUNT(*)::int AS cnt
      FROM public.app_user
      WHERE role_code = 'superadmin'
        AND NOT is_deleted
        AND NOT is_blocked
        AND account_status = 'active'
    `;
    if (excludeUserId != null) {
      params.push(excludeUserId);
      sql += ` AND user_id <> $1`;
    }
    const { rows } = await client.query(sql, params);
    return rows[0]?.cnt ?? 0;
  }

  // S1-DEV-05: User list (Admin sees 'user' only; Superadmin accounts hidden from Admin)
  router.get('/users', requireStaff, async (req, res) => {
    try {
      const isSuperadmin = req.actor.role_code === 'superadmin';
      const sql = isSuperadmin
        ? `SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked, created_at
           FROM public.app_user
           WHERE NOT is_deleted
           ORDER BY user_id ASC`
        : `SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked, created_at
           FROM public.app_user
           WHERE NOT is_deleted AND role_code = 'user'
           ORDER BY user_id ASC`;

      const { rows } = await pool.query(sql);
      res.json({ ok: true, users: rows.map(formatUserRow), catalog: MODULES });
    } catch (err) {
      console.error('GET /users error:', err);
      res.status(500).json({ ok: false, error: 'Failed to fetch users.' });
    }
  });

  // S1-DEV-05 & S1-DEV-06: Edit / Approve / Designate Admin / Block-Unblock + Last-Superadmin Guard
  router.patch('/users/:id', requireStaff, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID.' });
    }

    try {
      const targetRes = await pool.query(
        `SELECT user_id, email, first_name, last_name, role_code, account_status, is_blocked
         FROM public.app_user WHERE user_id = $1 AND NOT is_deleted`,
        [targetId]
      );
      if (!targetRes.rows.length) {
        return res.status(404).json({ ok: false, error: 'User not found.' });
      }
      const target = targetRes.rows[0];

      if (req.actor.role_code !== 'superadmin' && target.role_code === 'superadmin') {
        return res.status(403).json({ ok: false, error: 'Admin cannot modify superadmin accounts.' });
      }

      let nextFirst = target.first_name;
      let nextLast = target.last_name;
      if (req.body.full_name != null && String(req.body.full_name).trim()) {
        const split = splitFullName(req.body.full_name, target.first_name, target.last_name);
        nextFirst = split.firstName;
        nextLast = split.lastName;
      } else {
        if (req.body.first_name != null && String(req.body.first_name).trim()) {
          nextFirst = String(req.body.first_name).trim();
        }
        if (req.body.last_name != null && String(req.body.last_name).trim()) {
          nextLast = String(req.body.last_name).trim();
        }
      }

      const nextRole =
        req.body.role != null || req.body.role_code != null
          ? String(req.body.role || req.body.role_code).trim().toLowerCase()
          : target.role_code;

      if (!['superadmin', 'admin', 'user'].includes(nextRole)) {
        return res.status(400).json({ ok: false, error: 'Invalid role.' });
      }
      if (req.actor.role_code !== 'superadmin' && nextRole !== 'user') {
        return res.status(403).json({ ok: false, error: 'Only Superadmin can approve or designate admins.' });
      }

      const rawBlocked =
        typeof req.body.blocked === 'boolean'
          ? req.body.blocked
          : typeof req.body.is_blocked === 'boolean'
          ? req.body.is_blocked
          : target.is_blocked;

      let nextBlocked = rawBlocked;
      let nextStatus =
        req.body.status != null || req.body.account_status != null
          ? String(req.body.status || req.body.account_status).trim().toLowerCase()
          : target.account_status;

      if (typeof req.body.blocked === 'boolean' || typeof req.body.is_blocked === 'boolean') {
        nextStatus = rawBlocked ? 'blocked' : target.account_status === 'blocked' ? 'active' : nextStatus;
      } else if (nextStatus === 'blocked') {
        nextBlocked = true;
      } else if (nextStatus === 'active') {
        nextBlocked = false;
      }

      const wasActiveSuperadmin =
        target.role_code === 'superadmin' && !target.is_blocked && target.account_status === 'active';
      const willStayActiveSuperadmin =
        nextRole === 'superadmin' && !nextBlocked && nextStatus === 'active';

      if (wasActiveSuperadmin && !willStayActiveSuperadmin) {
        const remaining = await countActiveSuperadmins(pool, target.user_id);
        if (remaining < 1) {
          return res.status(400).json({
            ok: false,
            error: 'Cannot remove, block, or disable the last remaining superadmin.',
          });
        }
      }

      const { rows } = await withAuditUser(req.actor.email, async (client) =>
        client.query(
          `UPDATE public.app_user
           SET first_name = $1, last_name = $2, role_code = $3, account_status = $4, is_blocked = $5
           WHERE user_id = $6
           RETURNING user_id, email, first_name, last_name, role_code, account_status, is_blocked, created_at`,
          [nextFirst, nextLast, nextRole, nextStatus, nextBlocked, targetId]
        )
      );

      res.json({ ok: true, user: formatUserRow(rows[0]) });
    } catch (err) {
      console.error('PATCH /users/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to update user.' });
    }
  });

  // S1-DEV-06 guard: soft-delete with last-superadmin protection
  router.delete('/users/:id', requireStaff, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID.' });
    }

    try {
      const targetRes = await pool.query(
        'SELECT user_id, role_code, account_status, is_blocked FROM public.app_user WHERE user_id = $1 AND NOT is_deleted',
        [targetId]
      );
      if (!targetRes.rows.length) {
        return res.status(404).json({ ok: false, error: 'User not found.' });
      }
      const target = targetRes.rows[0];
      if (req.actor.role_code !== 'superadmin' && target.role_code === 'superadmin') {
        return res.status(403).json({ ok: false, error: 'Admin cannot delete superadmin accounts.' });
      }
      if (target.role_code === 'superadmin') {
        const remaining = await countActiveSuperadmins(pool, target.user_id);
        if (remaining < 1) {
          return res.status(400).json({
            ok: false,
            error: 'Cannot remove the last remaining superadmin.',
          });
        }
      }

      await withAuditUser(req.actor.email, async (client) =>
        client.query('UPDATE public.app_user SET is_deleted = TRUE WHERE user_id = $1', [targetId])
      );
      res.json({ ok: true, deletedId: targetId });
    } catch (err) {
      console.error('DELETE /users/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete user.' });
    }
  });

  // S1-DEV-07: Get user's per-action rights
  router.get('/users/:id/rights', requireStaff, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID.' });
    }

    try {
      const uRes = await pool.query(
        'SELECT user_id, email, first_name, last_name, role_code FROM public.app_user WHERE user_id = $1 AND NOT is_deleted',
        [targetId]
      );
      if (!uRes.rows.length) {
        return res.status(404).json({ ok: false, error: 'User not found.' });
      }
      const target = uRes.rows[0];
      if (req.actor.role_code !== 'superadmin' && target.role_code === 'superadmin') {
        return res.status(403).json({ ok: false, error: 'Admin cannot view superadmin rights.' });
      }

      const catalogue = await loadRightCatalogue(pool);
      const rights = await getGrantedRightsForUser(target.user_id, target.role_code, catalogue, pool);

      res.json({
        ok: true,
        user: {
          user_id: target.user_id,
          email: target.email,
          full_name: `${target.first_name || ''} ${target.last_name || ''}`.trim(),
          role: target.role_code,
        },
        rights,
        modules: MODULES,
        catalogRights: catalogue.dbRights,
      });
    } catch (err) {
      console.error('GET /users/:id/rights error:', err);
      res.status(500).json({ ok: false, error: 'Failed to load user rights.' });
    }
  });

  // S1-DEV-07: Save per-action rights and log change in audit_log
  router.put('/users/:id/rights', requireStaff, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user ID.' });
    }

    const rawRequested = Array.isArray(req.body.rights) ? req.body.rights : [];

    try {
      const uRes = await pool.query(
        'SELECT user_id, email, first_name, last_name, role_code FROM public.app_user WHERE user_id = $1 AND NOT is_deleted',
        [targetId]
      );
      if (!uRes.rows.length) {
        return res.status(404).json({ ok: false, error: 'User not found.' });
      }
      const target = uRes.rows[0];
      if (req.actor.role_code !== 'superadmin' && target.role_code === 'superadmin') {
        return res.status(403).json({ ok: false, error: 'Admin cannot edit superadmin rights.' });
      }

      const catalogue = await loadRightCatalogue(pool);
      const oldRights = (
        await getGrantedRightsForUser(target.user_id, target.role_code, catalogue, pool)
      ).sort();

      const requestedNormalized = new Set(rawRequested.map(normalizeRightKey).filter(Boolean));
      const newRights = [...requestedNormalized].sort();

      await withAuditUser(req.actor.email, async (client) => {
        for (const [rightId, meta] of catalogue.byId.entries()) {
          const shouldGrant =
            requestedNormalized.has(meta.key) ||
            requestedNormalized.has(String(meta.perm_key || '').toLowerCase());

          const existing = await client.query(
            `SELECT user_perm_id
             FROM public.user_permission
             WHERE user_id = $1 AND right_id = $2
             ORDER BY user_perm_id ASC
             LIMIT 1`,
            [targetId, rightId]
          );

          if (existing.rows.length > 0) {
            await client.query(
              `UPDATE public.user_permission
               SET granted = $1, is_deleted = FALSE, stamp = $2, updated_at = NOW()
               WHERE user_perm_id = $3`,
              [shouldGrant, req.actor.email, existing.rows[0].user_perm_id]
            );
          } else {
            await client.query(
              `INSERT INTO public.user_permission (user_id, right_id, granted, is_deleted, stamp, updated_at)
               VALUES ($1, $2, $3, FALSE, $4, NOW())`,
              [targetId, rightId, shouldGrant, req.actor.email]
            );
          }
        }

        await client.query(
          `INSERT INTO public.audit_log (table_name, action, record_key, old_values, new_values, action_by)
           VALUES ('user_permission', 'EDIT', $1, $2::jsonb, $3::jsonb, $4)`,
          [
            String(targetId),
            JSON.stringify({ user_id: targetId, email: target.email, rights: oldRights }),
            JSON.stringify({ user_id: targetId, email: target.email, rights: newRights }),
            req.actor.email,
          ]
        );
      });

      res.json({ ok: true, userId: targetId, rights: newRights });
    } catch (err) {
      console.error('PUT /users/:id/rights error:', err);
      res.status(500).json({ ok: false, error: 'Failed to save user rights.' });
    }
  });

  return router;
}

module.exports = { createAdminRouter, MODULES, ALL_RIGHTS };