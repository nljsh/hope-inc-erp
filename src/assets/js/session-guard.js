// S1-DEV-04, S2-DEV-02 & S2-DEV-03: Hope Enterprise — Session Guard & Live ERP Data Views
import { supabaseClient } from '../../config/supabaseClient.js';

const MODULE_CONFIG = {
  overview: {
    title: 'Executive <em>Overview.</em>',
    panel: 'Active Audit Stream',
    tag: 'AUDIT_LOG',
    desc: 'Recent entries from public.audit_log (append-only soft-delete and change trail).',
    source: 'audit_log',
    columns: ['audit_id', 'table_name', 'action', 'record_key', 'action_by', 'action_at']
  },
  customers: {
    title: 'Customer <em>Lifecycles.</em>',
    panel: 'Customer Registry',
    tag: 'CUSTOMER_ACTIVE',
    desc: 'Active customer accounts from customer_active (COD, 30D, 45D payment terms).',
    source: 'customer_active',
    columns: ['custno', 'custname', 'payterm', 'address', 'stamp']
  },
  products: {
    title: 'Product <em>Catalog.</em>',
    panel: 'Inventory & SKU Master',
    tag: 'PRODUCT_ACTIVE',
    desc: 'Active SKUs from product_active.',
    source: 'product_active',
    columns: ['prodcode', 'description', 'unit', 'stamp']
  },
  employees: {
    title: 'Employee <em>Registries.</em>',
    panel: 'Personnel & Role Directory',
    tag: 'EMPLOYEE_ACTIVE',
    desc: 'Active personnel records from employee_active.',
    source: 'employee_active',
    columns: ['empno', 'lastname', 'firstname', 'gender', 'hiredate', 'sepdate']
  },
  sales: {
    title: 'Sales <em>Ledgers.</em>',
    panel: 'Transaction & Invoice Ledger',
    tag: 'SALES',
    desc: 'Sales transactions from public.sales.',
    source: 'sales',
    columns: ['transno', 'salesdate', 'custno', 'empno', 'stamp']
  }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderTable(container, rows, columns) {
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="ledger-empty-copy">No records returned for this view yet.</p>';
    return;
  }

  const ths = columns.map((col) => <th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid #23252C;color:#9CA3AF;font-size:0.75rem;text-transform:uppercase;"></th>).join('');
  const trs = rows.slice(0, 25).map((row) => {
    const tds = columns.map((col) => <td style="padding:0.55rem 0.75rem;border-bottom:1px solid #181A20;font-size:0.82rem;color:#E5E7EB;"></td>).join('');
    return <tr></tr>;
  }).join('');

  container.innerHTML = 
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr></tr></thead>
      <tbody></tbody>
    </table>
  ;
}

async function fetchCount(table) {
  if (!supabaseClient) return 'Local';
  const { count, error } = await supabaseClient
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return 'Pending';
  return count ?? 0;
}

async function loadModuleRows(moduleKey, container, descEl) {
  const cfg = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.overview;
  if (!supabaseClient) {
    descEl.textContent = ${cfg.desc} (Supabase client not initialized; showing local shell preview.);
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '<p class="ledger-empty-copy">Querying Supabase PostgreSQL...</p>';
  const { data, error } = await supabaseClient
    .from(cfg.source)
    .select('*')
    .limit(25);

  if (error) {
    descEl.textContent = ${cfg.desc} Note: ;
    container.innerHTML = '';
    return;
  }

  descEl.textContent = cfg.desc;
  renderTable(container, data, cfg.columns);
}

document.addEventListener('DOMContentLoaded', async () => {
  const operatorBadge = document.getElementById('operator-badge');
  const signoutBtn = document.getElementById('signout-btn');
  const navButtons = document.querySelectorAll('.sidebar-link');
  const moduleTitle = document.getElementById('module-title');
  const panelHeading = document.getElementById('panel-heading');
  const panelTag = document.getElementById('panel-tag');
  const panelDescription = document.getElementById('panel-description');
  const tableContainer = document.getElementById('data-table-container');

  let activeEmail = null;
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    activeEmail = data?.session?.user?.email || null;
  } else {
    const demoSession = sessionStorage.getItem('hope_erp_demo_user');
    if (demoSession) {
      activeEmail = JSON.parse(demoSession).email;
    }
  }

  if (!activeEmail) {
    window.location.href = '../../index.html';
    return;
  }

  if (operatorBadge) {
    operatorBadge.textContent = activeEmail.toUpperCase();
  }

  // Populate KPI cards
  const [custCount, prodCount, empCount, salesCount] = await Promise.all([
    fetchCount('customer_active'),
    fetchCount('product_active'),
    fetchCount('employee_active'),
    fetchCount('sales')
  ]);

  const kpiMap = {
    'kpi-customers': custCount,
    'kpi-products': prodCount,
    'kpi-employees': empCount,
    'kpi-sales': salesCount
  };
  Object.entries(kpiMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  });

  // Initial module load
  await loadModuleRows('overview', tableContainer, panelDescription);

  // Module switching
  navButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.module;
      const cfg = MODULE_CONFIG[key] || MODULE_CONFIG.overview;

      navButtons.forEach((b) => b.classList.toggle('active', b === btn));
      moduleTitle.innerHTML = cfg.title;
      panelHeading.textContent = cfg.panel;
      if (panelTag) panelTag.textContent = cfg.tag;
      await loadModuleRows(key, tableContainer, panelDescription);
    });
  });

  // Sign out handler
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      sessionStorage.removeItem('hope_erp_demo_user');
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      window.location.href = '../../index.html';
    });
  }
});
