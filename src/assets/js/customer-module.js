// S2-DEV-01: Customer list with search and filter (permission-checked)
export function canViewCustomers(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('customer.view') ||
    rights.includes('Customer.View')
  );
}

export function filterCustomers(customers = [], { query = '', statusFilter = 'all' } = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedStatus = String(statusFilter || 'all').trim().toLowerCase();

  return customers.filter((item) => {
    const matchesStatus =
      normalizedStatus === 'all' ||
      String(item.status || 'active').toLowerCase() === normalizedStatus;

    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      item.id,
      item.code,
      item.name,
      item.email,
      item.phone,
      item.pay_terms,
      item.payTerms
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function renderCustomerRows(tbodyEl, customers = []) {
  if (!tbodyEl) return;

  if (!customers.length) {
    tbodyEl.innerHTML = 
      <tr>
        <td colspan="5" class="empty-state">No matching customers found.</td>
      </tr>
    ;
    return;
  }

  tbodyEl.innerHTML = customers
    .map(
      (c) => 
      <tr data-customer-id="">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    
    )
    .join('');
}

// S2-DEV-02: Customer create and edit form
export function validateCustomerForm(values = {}) {
  const errors = {};
  const name = String(values.name || '').trim();
  const email = String(values.email || '').trim();
  const phone = String(values.phone || '').trim();
  const payTerms = String(values.pay_terms ?? values.payTerms ?? '').trim();

  if (!name) {
    errors.name = 'Customer name is required.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!email && !phone) {
    errors.contact = 'Provide at least an email address or phone number.';
  }

  if (!payTerms) {
    errors.pay_terms = 'Payment terms are required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function buildCustomerPayload(values = {}, existingCustomer = null) {
  return {
    id: existingCustomer?.id ?? values.id ?? undefined,
    code: String(values.code ?? existingCustomer?.code ?? '').trim(),
    name: String(values.name || '').trim(),
    email: String(values.email || '').trim(),
    phone: String(values.phone || '').trim(),
    pay_terms: String(values.pay_terms ?? values.payTerms ?? '').trim(),
    status: String(values.status ?? existingCustomer?.status ?? 'Active').trim()
  };
}

export function populateCustomerForm(formEl, customer = {}) {
  if (!formEl) return;

  const setField = (selector, value) => {
    const el = formEl.querySelector(selector);
    if (el) el.value = value ?? '';
  };

  setField('[name="code"]', customer.code ?? '');
  setField('[name="name"]', customer.name ?? '');
  setField('[name="email"]', customer.email ?? '');
  setField('[name="phone"]', customer.phone ?? '');
  setField('[name="pay_terms"]', customer.pay_terms ?? customer.payTerms ?? '');
  setField('[name="status"]', customer.status ?? 'Active');
}
