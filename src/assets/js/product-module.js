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

// S2-DEV-05: Product create and edit form
export function validateProductForm(values = {}) {
  const errors = {};
  const name = String(values.name || '').trim();
  const code = String(values.code ?? values.sku ?? '').trim();
  const unit = String(values.unit || '').trim();

  if (!name) {
    errors.name = 'Product name is required.';
  }

  if (!code) {
    errors.code = 'Product code or SKU is required.';
  }

  if (!unit) {
    errors.unit = 'Unit of measure is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function buildProductPayload(values = {}, existingProduct = null) {
  return {
    id: existingProduct?.id ?? values.id ?? undefined,
    code: String(values.code ?? values.sku ?? existingProduct?.code ?? '').trim(),
    name: String(values.name || '').trim(),
    description: String(values.description ?? existingProduct?.description ?? '').trim(),
    unit: String(values.unit ?? existingProduct?.unit ?? '').trim(),
    status: String(values.status ?? existingProduct?.status ?? 'Active').trim()
  };
}

export function populateProductForm(formEl, product = {}) {
  if (!formEl) return;

  const setField = (selector, value) => {
    const el = formEl.querySelector(selector);
    if (el) el.value = value ?? '';
  };

  setField('[name="code"]', product.code ?? product.sku ?? '');
  setField('[name="name"]', product.name ?? '');
  setField('[name="description"]', product.description ?? '');
  setField('[name="unit"]', product.unit ?? '');
  setField('[name="status"]', product.status ?? 'Active');
}

// S2-DEV-06: Product soft delete and restore
export function isProductDeleted(product = {}) {
  const status = String(product.status || '').trim().toLowerCase();
  return Boolean(product.deleted_at || product.deletedAt || status === 'deleted' || status === 'inactive');
}

export function softDeleteProduct(product = {}, actorId = null) {
  const timestamp = new Date().toISOString();
  return {
    ...product,
    status: 'Inactive',
    is_deleted: true,
    deleted_at: timestamp,
    deleted_by: actorId ?? product.deleted_by ?? null,
    updated_at: timestamp
  };
}

export function restoreProduct(product = {}, actorId = null) {
  const timestamp = new Date().toISOString();
  return {
    ...product,
    status: 'Active',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    restored_by: actorId ?? product.restored_by ?? null,
    updated_at: timestamp
  };
}
