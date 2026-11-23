import { supabaseClient } from '../../config/supabaseClient.js';

const MODULE_CONFIG = {
  overview: {
    title: 'Executive <em>Overview.</em>',
    panel: 'Active Audit Stream',
    tag: 'AUDIT_LOG',
    desc: 'Recent entries from public.audit_log (append-only soft-delete and change trail).',
    source: 'audit_log',
    columns: ['audit_id', 'table_name', 'action', 'record_key', 'action_by', 'action_at'],
  },
  customers: {
    title: 'Customer <em>Lifecycles.</em>',
    panel: 'Customer Registry',
    tag: 'CUSTOMER_ACTIVE',
    desc: 'Active customer accounts from customer_active (COD, 30D, 45D payment terms).',
    source: 'customer_active',
    columns: ['custno', 'custname', 'payterm', 'address', 'stamp'],
  },
  products: {
    title: 'Product <em>Catalog.</em>',
    panel: 'Inventory & SKU Master',
    tag: 'PRODUCT_ACTIVE',
    desc: 'Active SKUs from product_active.',
    source: 'product_active',
    columns: ['prodcode', 'description', 'unit', 'stamp'],
  },
  employees: {
    title: 'Employee <em>Registries.</em>',
    panel: 'Personnel & Role Directory',
    tag: 'EMPLOYEE_ACTIVE',
    desc: 'Active personnel records from employee_active.',
    source: 'employee_active',
    columns: ['empno', 'lastname', 'firstname', 'gender', 'hiredate', 'sepdate'],
  },
  sales: {
    title: 'Sales <em>Ledgers.</em>',
    panel: 'Transaction & Invoice Ledger',
    tag: 'SALES',
    desc: 'Sales transactions from public.sales.',
    source: 'sales',
    columns: ['transno', 'salesdate', 'custno', 'empno', 'stamp'],
  },
  reports: {
    title: 'Operational <em>Reports.</em>',
    panel: 'Reporting & Export Ledger',
    tag: 'REPORTS',
    desc: 'Module reporting view gated by Reports module rights.',
    source: 'audit_log',
    columns: ['audit_id', 'table_name', 'action', 'record_key', 'action_by', 'action_at'],
  },
  users: {
    title: 'User <em>Management.</em>',
    panel: 'Operators, Approvals & Module Rights',
    tag: 'USER_MANAGEMENT',
    desc: 'Manage operators, approve pending accounts, designate admins, block/unblock users, and assign per-action rights.',
    source: null,
    columns: [],
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeRole(role) {
  return String(role || 'user').trim().toLowerCase();
}

function canViewStampForRole(role) {
  return normalizeRole(role) === 'superadmin';
}

function getColumnsForRole(columns, role) {
  const list = Array.isArray(columns) ? columns : [];
  if (canViewStampForRole(role)) {
    return list;
  }
  return list.filter((col) => String(col).toLowerCase() !== 'stamp');
}

function renderTable(container, rows, columns, role = 'user') {
  if (!container) return;
  const visibleColumns = getColumnsForRole(columns, role);

  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="ledger-empty-copy">No records returned for this view yet.</p>';
    return;
  }

  const ths = visibleColumns
    .map(
      (col) =>
        `<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">${escapeHtml(col)}</th>`
    )
    .join('');

  const trs = rows
    .slice(0, 25)
    .map((row) => {
      const tds = visibleColumns
        .map(
          (col) =>
            `<td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">${escapeHtml(row[col])}</td>`
        )
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>
  `;
}

async function fetchCount(table) {
  if (!supabaseClient) return '--';
  const { count, error } = await supabaseClient.from(table).select('*', { count: 'exact', head: true });
  if (error) return '0';
  return count ?? 0;
}

document.addEventListener('DOMContentLoaded', async () => {
  const operatorBadge = document.getElementById('operator-badge');
  const signoutBtn = document.getElementById('signout-btn');
  const sidebarNav = document.querySelector('.sidebar-nav');
  const moduleTitle = document.getElementById('module-title');
  const panelHeading = document.getElementById('panel-heading');
  const panelTag = document.getElementById('panel-tag');
  const panelDescription = document.getElementById('panel-description');
  const tableContainer = document.getElementById('data-table-container');

  let activeEmail = null;
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    activeEmail = data?.session?.user?.email || null;
  }

  if (!activeEmail) {
    window.location.href = '../../index.html';
    return;
  }

  // Fetch effective role, rights, and allowed modules from server (S1-DEV-08)
  let permState = {
    role: 'user',
    rights: [],
    allowedModules: ['overview'],
    canManageUsers: false,
    canApproveUsers: false,
    canAssignRights: false,
  };

  try {
    const res = await fetch('/api/admin/session-permissions', {
      headers: { 'x-actor-email': activeEmail },
    });
    if (res.ok) {
      permState = await res.json();
    }
  } catch (_) {}

  const currentRole = normalizeRole(permState.role);
  window.currentUser = {
    email: activeEmail,
    role: currentRole,
    role_code: currentRole,
    rights: permState.rights || [],
    allowedModules: permState.allowedModules || ['overview'],
  };
  try {
    sessionStorage.setItem('role_code', currentRole);
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('hope:session-ready', { detail: window.currentUser }));

  if (operatorBadge) {
    operatorBadge.textContent = `${activeEmail.toUpperCase()} · ${currentRole.toUpperCase()}`;
  }

  // Add Users & Reports nav buttons if allowed
  if (sidebarNav) {
    if (permState.allowedModules.includes('reports') && !sidebarNav.querySelector('[data-module="reports"]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sidebar-link';
      btn.dataset.module = 'reports';
      btn.textContent = 'Reports Ledger';
      sidebarNav.appendChild(btn);
    }
    if (permState.canManageUsers && !sidebarNav.querySelector('[data-module="users"]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sidebar-link';
      btn.dataset.module = 'users';
      btn.textContent = 'User Management';
      sidebarNav.appendChild(btn);
    }
  }

  // Filter sidebar buttons and KPI tiles by allowedModules (S1-DEV-08)
  const allNavButtons = Array.from(document.querySelectorAll('.sidebar-link'));
  allNavButtons.forEach((btn) => {
    const mod = btn.dataset.module;
    if (mod === 'users') {
      btn.style.display = permState.canManageUsers ? '' : 'none';
    } else if (mod && mod !== 'overview') {
      btn.style.display = permState.allowedModules.includes(mod) ? '' : 'none';
    }
  });

  const kpiTileByModule = {
    customers: document.getElementById('kpi-customers')?.closest('.kpi-card'),
    products: document.getElementById('kpi-products')?.closest('.kpi-card'),
    employees: document.getElementById('kpi-employees')?.closest('.kpi-card'),
    sales: document.getElementById('kpi-sales')?.closest('.kpi-card'),
  };
  Object.entries(kpiTileByModule).forEach(([mod, card]) => {
    if (card) card.style.display = permState.allowedModules.includes(mod) ? '' : 'none';
  });

  // Rights Dialog Modal (S1-DEV-07)
  function openRightsDialog(user, currentRights, modulesCatalog) {
    document.getElementById('rights-modal-overlay')?.remove();
    const selected = new Set(currentRights || []);

    const overlay = document.createElement('div');
    overlay.id = 'rights-modal-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;';

    const modal = document.createElement('div');
    modal.style.cssText =
      'width:100%;max-width:720px;max-height:88vh;overflow:auto;background:#14161C;border:1px solid #2A2D37;border-radius:12px;padding:1.25rem;color:#F3F4F6;';

    const moduleSectionsHtml = (modulesCatalog || [])
      .map((mod) => {
        const allChecked = mod.rights.every((r) => selected.has(r));
        const checkboxes = mod.rights
          .map((rightCode) => {
            const checked = selected.has(rightCode) ? 'checked' : '';
            return `
              <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.8rem;color:#E5E7EB;background:#1B1E26;padding:0.4rem 0.6rem;border-radius:6px;border:1px solid #252832;">
                <input type="checkbox" class="right-cb" data-module="${escapeHtml(mod.key)}" value="${escapeHtml(rightCode)}" ${checked} />
                <span>${escapeHtml(rightCode)}</span>
              </label>
            `;
          })
          .join('');

        return `
          <div class="rights-module-box" data-module-box="${escapeHtml(mod.key)}" style="border:1px solid #252832;border-radius:8px;padding:0.85rem;margin-bottom:0.85rem;background:#111318;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.65rem;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;gap:0.5rem;font-weight:600;font-size:0.9rem;color:#F9FAFB;">
                <input type="checkbox" class="mod-toggle-cb" data-module="${escapeHtml(mod.key)}" ${allChecked ? 'checked' : ''} />
                <span>${escapeHtml(mod.label)}</span>
              </label>
              <div style="display:flex;gap:0.4rem;">
                <button type="button" class="btn-mod-all" data-module="${escapeHtml(mod.key)}" style="padding:0.25rem 0.55rem;font-size:0.75rem;border-radius:5px;border:1px solid #374151;background:#1F2937;color:#F9FAFB;cursor:pointer;">All</button>
                <button type="button" class="btn-mod-none" data-module="${escapeHtml(mod.key)}" style="padding:0.25rem 0.55rem;font-size:0.75rem;border-radius:5px;border:1px solid #374151;background:#1F2937;color:#F9FAFB;cursor:pointer;">None</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.45rem;">
              ${checkboxes}
            </div>
          </div>
        `;
      })
      .join('');

    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.9rem;">
        <div>
          <h3 style="margin:0;font-size:1.05rem;">Module Rights — ${escapeHtml(user.full_name)} (${escapeHtml(user.email)})</h3>
          <p style="margin:0.2rem 0 0;font-size:0.78rem;color:#9CA3AF;">Role: ${escapeHtml(user.role)}. Changes are recorded in audit_log.</p>
        </div>
        <button type="button" id="rights-close-btn" style="background:none;border:1px solid #374151;color:#E5E7EB;border-radius:6px;padding:0.3rem 0.65rem;cursor:pointer;">Close</button>
      </div>
      <div id="rights-modal-msg" style="font-size:0.8rem;margin-bottom:0.65rem;color:#FCA5A5;"></div>
      <div>${moduleSectionsHtml}</div>
      <div style="display:flex;justify-content:flex-end;gap:0.6rem;margin-top:1rem;">
        <button type="button" id="rights-cancel-btn" style="padding:0.5rem 0.9rem;border-radius:6px;border:1px solid #374151;background:transparent;color:#E5E7EB;cursor:pointer;">Cancel</button>
        <button type="button" id="rights-save-btn" class="btn-primary" style="padding:0.5rem 1rem;">Save Rights</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function syncModuleCheckbox(modKey) {
      const modCbs = Array.from(modal.querySelectorAll(`.right-cb[data-module="${modKey}"]`));
      const modToggle = modal.querySelector(`.mod-toggle-cb[data-module="${modKey}"]`);
      if (modToggle && modCbs.length) {
        modToggle.checked = modCbs.every((cb) => cb.checked);
      }
    }

    modal.querySelectorAll('.mod-toggle-cb').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const modKey = toggle.dataset.module;
        modal.querySelectorAll(`.right-cb[data-module="${modKey}"]`).forEach((cb) => {
          cb.checked = toggle.checked;
        });
      });
    });

    modal.querySelectorAll('.btn-mod-all').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modKey = btn.dataset.module;
        modal.querySelectorAll(`.right-cb[data-module="${modKey}"]`).forEach((cb) => {
          cb.checked = true;
        });
        syncModuleCheckbox(modKey);
      });
    });

    modal.querySelectorAll('.btn-mod-none').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modKey = btn.dataset.module;
        modal.querySelectorAll(`.right-cb[data-module="${modKey}"]`).forEach((cb) => {
          cb.checked = false;
        });
        syncModuleCheckbox(modKey);
      });
    });

    modal.querySelectorAll('.right-cb').forEach((cb) => {
      cb.addEventListener('change', () => syncModuleCheckbox(cb.dataset.module));
    });

    const closeModal = () => overlay.remove();
    modal.querySelector('#rights-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#rights-cancel-btn').addEventListener('click', closeModal);

    modal.querySelector('#rights-save-btn').addEventListener('click', async () => {
      const checkedRights = Array.from(modal.querySelectorAll('.right-cb:checked')).map((cb) => cb.value);
      const msgEl = modal.querySelector('#rights-modal-msg');
      msgEl.style.color = '#9CA3AF';
      msgEl.textContent = 'Saving rights and writing audit log...';

      const resp = await fetch(`/api/admin/users/${user.user_id}/rights`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-email': activeEmail,
        },
        body: JSON.stringify({ rights: checkedRights }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        msgEl.style.color = '#FCA5A5';
        msgEl.textContent = data.error || 'Failed to update rights.';
        return;
      }

      closeModal();
      panelDescription.textContent = `Updated rights for ${user.email} (${checkedRights.length} assigned) and logged to audit_log.`;
    });
  }

  // User Management View (S1-DEV-05 & S1-DEV-06)
  async function renderUserManagement() {
    if (!permState.canManageUsers) {
      panelDescription.textContent = 'Access denied: User Management requires Admin or Superadmin role.';
      tableContainer.innerHTML = '';
      return;
    }

    tableContainer.innerHTML = '<p class="ledger-empty-copy">Loading operators...</p>';
    const resp = await fetch('/api/admin/users', {
      headers: { 'x-actor-email': activeEmail },
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      tableContainer.innerHTML = `<p class="ledger-empty-copy">${escapeHtml(data.error || 'Unable to load users.')}</p>`;
      return;
    }

    const users = data.users || [];
    const catalog = data.catalog || [];
    const isSuperadmin = currentRole === 'superadmin';

    const roleLabels = {
      superadmin: 'Make Superadmin',
      admin: 'Make Admin',
      user: 'Make User',
    };

    const rowsHtml = users
      .map((u) => {
        const isBlocked = Boolean(u.blocked || u.status === 'blocked');
        const isPending = u.status === 'pending';

        const approveBtn =
          isSuperadmin && isPending
            ? `<button type="button" class="um-approve-btn" data-id="${u.user_id}" style="padding:0.25rem 0.5rem;font-size:0.75rem;border-radius:5px;border:1px solid #065F46;background:#064E3B;color:#A7F3D0;cursor:pointer;">Approve</button>`
            : '';

        const roleBtn = isSuperadmin
          ? ['superadmin', 'admin', 'user']
              .filter((r) => r !== u.role)
              .map(
                (targetRole) =>
                  `<button type="button" class="um-role-btn" data-id="${u.user_id}" data-role="${targetRole}" style="padding:0.25rem 0.5rem;font-size:0.75rem;border-radius:5px;border:1px solid #374151;background:#1F2937;color:#F9FAFB;cursor:pointer;">${roleLabels[targetRole]}</button>`
              )
              .join('')
          : '';

        const blockBtn = `<button type="button" class="um-block-btn" data-id="${u.user_id}" data-blocked="${isBlocked ? '1' : '0'}" style="padding:0.25rem 0.5rem;font-size:0.75rem;border-radius:5px;border:1px solid #374151;background:#1F2937;color:#F9FAFB;cursor:pointer;">${isBlocked ? 'Unblock' : 'Block'}</button>`;

        const editBtn = `<button type="button" class="um-edit-btn" data-id="${u.user_id}" data-name="${escapeHtml(u.full_name)}" style="padding:0.25rem 0.5rem;font-size:0.75rem;border-radius:5px;border:1px solid #374151;background:#1F2937;color:#F9FAFB;cursor:pointer;">Edit</button>`;

        const rightsBtn = `<button type="button" class="um-rights-btn" data-id="${u.user_id}" style="padding:0.25rem 0.5rem;font-size:0.75rem;border-radius:5px;border:1px solid #4B5563;background:#262B36;color:#E5E7EB;cursor:pointer;">Rights</button>`;

        return `
          <tr>
            <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">${escapeHtml(u.full_name)}</td>
            <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">${escapeHtml(u.email)}</td>
            <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">${escapeHtml(u.role)}</td>
            <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">${escapeHtml(u.status)}</td>
            <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;">
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                ${approveBtn}
                ${roleBtn}
                ${blockBtn}
                ${editBtn}
                ${rightsBtn}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tableContainer.innerHTML = `
      <div id="um-feedback" style="font-size:0.8rem;margin-bottom:0.75rem;color:#6EE7B7;"></div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">Name</th>
            <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">Email</th>
            <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">Role</th>
            <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">Status</th>
            <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;">Actions</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || '<tr><td colspan="5" style="padding:0.75rem;color:#9CA3AF;">No users found.</td></tr>'}</tbody>
      </table>
    `;

    const feedbackEl = document.getElementById('um-feedback');
    function setUmMsg(msg, isErr = false) {
      if (!feedbackEl) return;
      feedbackEl.style.color = isErr ? '#FCA5A5' : '#6EE7B7';
      feedbackEl.textContent = msg;
    }

    tableContainer.querySelectorAll('.um-approve-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const r = await fetch(`/api/admin/users/${btn.dataset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-actor-email': activeEmail },
          body: JSON.stringify({ status: 'active', blocked: false }),
        });
        const d = await r.json();
        if (!r.ok || !d.ok) return setUmMsg(d.error || 'Approve failed.', true);
        await renderUserManagement();
        setUmMsg('Pending user approved.');
      });
    });

    tableContainer.querySelectorAll('.um-role-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextRole = btn.dataset.role;
        if (!nextRole) return;
        const r = await fetch(`/api/admin/users/${btn.dataset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-actor-email': activeEmail },
          body: JSON.stringify({ role: nextRole }),
        });
        const d = await r.json();
        if (!r.ok || !d.ok) return setUmMsg(d.error || 'Role update failed.', true);
        await renderUserManagement();
        setUmMsg(`Updated role to ${nextRole}.`);
      });
    });

    tableContainer.querySelectorAll('.um-block-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextBlocked = btn.dataset.blocked !== '1';
        const r = await fetch(`/api/admin/users/${btn.dataset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-actor-email': activeEmail },
          body: JSON.stringify({ blocked: nextBlocked }),
        });
        const d = await r.json();
        if (!r.ok || !d.ok) return setUmMsg(d.error || 'Block/unblock failed.', true);
        await renderUserManagement();
        setUmMsg(nextBlocked ? 'User blocked.' : 'User unblocked.');
      });
    });

    tableContainer.querySelectorAll('.um-edit-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const updatedName = window.prompt('Update operator full name:', btn.dataset.name || '');
        if (!updatedName || !updatedName.trim()) return;
        const r = await fetch(`/api/admin/users/${btn.dataset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-actor-email': activeEmail },
          body: JSON.stringify({ full_name: updatedName.trim() }),
        });
        const d = await r.json();
        if (!r.ok || !d.ok) return setUmMsg(d.error || 'Edit failed.', true);
        await renderUserManagement();
        setUmMsg('User updated.');
      });
    });

    tableContainer.querySelectorAll('.um-rights-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const r = await fetch(`/api/admin/users/${btn.dataset.id}/rights`, {
          headers: { 'x-actor-email': activeEmail },
        });
        const d = await r.json();
        if (!r.ok || !d.ok) return setUmMsg(d.error || 'Could not open rights dialog.', true);
        openRightsDialog(d.user, d.rights, d.modules || catalog);
      });
    });
  }

  async function loadModuleRows(moduleKey) {
    if (moduleKey === 'users') {
      await renderUserManagement();
      return;
    }

    const cfg = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.overview;

    // Do not query or render audit_log for standard user accounts
    if (moduleKey === 'overview' && currentRole === 'user') {
      if (panelHeading) panelHeading.textContent = 'Workspace Summary';
      if (panelTag) panelTag.textContent = 'USER_VIEW';
      panelDescription.textContent = 'Select a permitted module from the sidebar to view active records.';
      tableContainer.innerHTML = '';
      return;
    }

    if (!supabaseClient) {
      panelDescription.textContent = `${cfg.desc} (Supabase client not initialized.)`;
      tableContainer.innerHTML = '';
      return;
    }

    tableContainer.innerHTML = '<p class="ledger-empty-copy">Querying Supabase PostgreSQL...</p>';
    const { data, error } = await supabaseClient.from(cfg.source).select('*').limit(25);

    if (error) {
      panelDescription.textContent = `${cfg.desc} Note: ${error.message}`;
      tableContainer.innerHTML = '';
      return;
    }

    panelDescription.textContent = cfg.desc;
    renderTable(tableContainer, data, cfg.columns, currentRole);
  }

  // Populate KPI cards for visible modules
  const [custCount, prodCount, empCount, salesCount] = await Promise.all([
    fetchCount('customer_active'),
    fetchCount('product_active'),
    fetchCount('employee_active'),
    fetchCount('sales'),
  ]);

  const kpiMap = {
    'kpi-customers': custCount,
    'kpi-products': prodCount,
    'kpi-employees': empCount,
    'kpi-sales': salesCount,
  };
  Object.entries(kpiMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  });

  await loadModuleRows('overview');

  Array.from(document.querySelectorAll('.sidebar-link')).forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.module;
      const cfg = MODULE_CONFIG[key] || MODULE_CONFIG.overview;

      Array.from(document.querySelectorAll('.sidebar-link')).forEach((b) =>
        b.classList.toggle('active', b === btn)
      );
      if (moduleTitle) moduleTitle.innerHTML = cfg.title;
      if (panelHeading) panelHeading.textContent = cfg.panel;
      if (panelTag) panelTag.textContent = cfg.tag;
      await loadModuleRows(key);
    });
  });

  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      window.location.href = '../../index.html';
    });
  }
});