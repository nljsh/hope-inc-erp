// S1-DEV-04: Hope Enterprise — Workspace Session Guard & Module Navigation
import { supabaseClient } from '../../config/supabaseClient.js';

const MODULE_META = {
  overview: {
    title: 'Executive <em>Overview.</em>',
    panel: 'Active Audit Stream',
    desc: 'Session guard active. Once the Database Administrator completes the PostgreSQL schema and Row-Level Security policies in Supabase, live CRUD records will mount directly into this workspace.'
  },
  customers: {
    title: 'Customer <em>Lifecycles.</em>',
    panel: 'Customer Registry',
    desc: 'Ready to bind to the public.customers PostgreSQL table upon DB Admin schema completion.'
  },
  products: {
    title: 'Product <em>Catalog.</em>',
    panel: 'Inventory & SKU Master',
    desc: 'Ready to bind to the public.products PostgreSQL table upon DB Admin schema completion.'
  },
  employees: {
    title: 'Employee <em>Registries.</em>',
    panel: 'Personnel & Role Directory',
    desc: 'Ready to bind to the public.employees PostgreSQL table upon DB Admin schema completion.'
  },
  sales: {
    title: 'Sales <em>Ledgers.</em>',
    panel: 'Transaction & Invoice Ledger',
    desc: 'Ready to bind to the public.sales PostgreSQL table upon DB Admin schema completion.'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const operatorBadge = document.getElementById('operator-badge');
  const signoutBtn = document.getElementById('signout-btn');
  const navButtons = document.querySelectorAll('.sidebar-link');
  const moduleTitle = document.getElementById('module-title');
  const panelHeading = document.getElementById('panel-heading');
  const panelDescription = document.getElementById('panel-description');

  // Verify active session (Supabase Auth or pre-DB session fallback)
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

  // Module switching
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
