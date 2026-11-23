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

// S2-DEV-03: Customer soft delete and restore
export function isCustomerDeleted(customer = {}) {
  const status = String(customer.status || '').trim().toLowerCase();
  return Boolean(customer.deleted_at || customer.deletedAt || status === 'deleted' || status === 'inactive');
}

export function softDeleteCustomer(customer = {}, actorId = null) {
  const timestamp = new Date().toISOString();
  return {
    ...customer,
    status: 'Inactive',
    is_deleted: true,
    deleted_at: timestamp,
    deleted_by: actorId ?? customer.deleted_by ?? null,
    updated_at: timestamp
  };
}

export function restoreCustomer(customer = {}, actorId = null) {
  const timestamp = new Date().toISOString();
  return {
    ...customer,
    status: 'Active',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    restored_by: actorId ?? customer.restored_by ?? null,
    updated_at: timestamp
  };
}
