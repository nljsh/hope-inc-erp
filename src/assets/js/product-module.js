// S2-DEV-04: Product list with search and filter
export function canViewProducts(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('product.view') ||
    rights.includes('Product.View')
  );
}

export function filterProducts(products = [], { query = '', statusFilter = 'all', unitFilter = 'all' } = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedStatus = String(statusFilter || 'all').trim().toLowerCase();
  const normalizedUnit = String(unitFilter || 'all').trim().toLowerCase();

  return products.filter((item) => {
    const matchesStatus =
      normalizedStatus === 'all' ||
      String(item.status || 'active').toLowerCase() === normalizedStatus;

    if (!matchesStatus) return false;

    const itemUnit = String(item.unit || '').trim().toLowerCase();
    const matchesUnit = normalizedUnit === 'all' || itemUnit === normalizedUnit;

    if (!matchesUnit) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      item.id,
      item.code,
      item.sku,
      item.name,
      item.description,
      item.unit
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function renderProductRows(tbodyEl, products = []) {
  if (!tbodyEl) return;

  if (!products.length) {
    tbodyEl.innerHTML = 
      <tr>
        <td colspan="5" class="empty-state">No matching products found.</td>
      </tr>
    ;
    return;
  }

  tbodyEl.innerHTML = products
    .map(
      (p) => 
      <tr data-product-id="">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td class="product-price-cell" data-product-id="">-</td>
      </tr>
    
    )
    .join('');
}
