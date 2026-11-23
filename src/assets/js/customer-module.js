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
