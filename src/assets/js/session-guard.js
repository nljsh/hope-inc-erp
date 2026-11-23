// S1-DEV-04 & S2-DEV-02: Hope Enterprise — Workspace Session Guard & Module Navigation
import { supabaseClient } from '../../config/supabaseClient.js';

const MODULE_META = {
  overview: {
    title: 'Executive <em>Overview.</em>',
    panel: 'Active Audit Stream',
    desc: 'Live Supabase session active. Connected to the Hope Enterprise PostgreSQL schema with soft-delete views and append-only audit_log tracking.'
  },
  customers: {
    title: 'Customer <em>Lifecycles.</em>',
    panel: 'Customer Registry',
    desc: 'Bound to public.customer and customer_active (COD, 30D, 45D payment terms).'
  },
  products: {
    title: 'Product <em>Catalog.</em>',
    panel: 'Inventory & SKU Master',
    desc: 'Bound to public.product, product_active, and pricehist effective pricing.'
  },
  employees: {
    title: 'Employee <em>Registries.</em>',
    panel: 'Personnel & Role Directory',
    desc: 'Bound to public.employee, employee_active, department, job, and jobhistory.'
  },
  sales: {
    title: 'Sales <em>Ledgers.</em>',
    panel: 'Transaction & Invoice Ledger',
    desc: 'Bound to public.sales, salesdetail, and payment records.'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const operatorBadge = document.getElementById('operator-badge');
  const signoutBtn = document.getElementById('signout-btn');
  const navButtons = document.querySelectorAll('.sidebar-link');
  const moduleTitle = document.getElementById('module-title');
  const panelHeading = document.getElementById('panel-heading');
  const panelDescription = document.getElementById('panel-description');

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

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.module;
      const meta = MODULE_META[key] || MODULE_META.overview;

      navButtons.forEach((b) => b.classList.toggle('active', b === btn));
      moduleTitle.innerHTML = meta.title;
      panelHeading.textContent = meta.panel;
      panelDescription.textContent = meta.desc;
    });
  });

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
