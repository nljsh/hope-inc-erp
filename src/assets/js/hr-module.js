// S3-DEV-01: Department list and CRUD (permission-checked)

export function canViewDepartments(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('department.view') ||
    rights.includes('Department.View') ||
    rights.includes('hr.view') ||
    rights.includes('HR.View')
  );
}

export function canManageDepartments(sessionUser, action = 'edit') {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  const normalizedAction = String(action || '').toLowerCase();
  const candidates = [
    `department.${normalizedAction}`,
    `Department.${normalizedAction[0]?.toUpperCase() || ''}${normalizedAction.slice(1)}`,
    `hr.department.${normalizedAction}`,
    `hr.${normalizedAction}`
  ];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.some((r) => candidates.includes(String(r)))
  );
}

export function isDepartmentDeleted(department = {}) {
  const status = String(department.status || '').trim().toLowerCase();
  return Boolean(
    department.is_deleted === true ||
    department.deleted_at ||
    department.deletedAt ||
    status === 'deleted' ||
    status === 'inactive'
  );
}

export function validateDepartmentPayload(input = {}, { isUpdate = false } = {}) {
  const errors = {};
  const deptcode = String(input.deptcode ?? input.deptCode ?? '').trim().toUpperCase();
  const deptname = String(input.deptname ?? input.deptName ?? '').trim();

  if (!isUpdate && !deptcode) {
    errors.deptcode = 'Department code is required.';
  } else if (deptcode && deptcode.length > 3) {
    errors.deptcode = 'Department code must be 3 characters or fewer.';
  }

  if (!deptname) {
    errors.deptname = 'Department name is required.';
  } else if (deptname.length > 20) {
    errors.deptname = 'Department name must be 20 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      deptcode,
      deptname
    }
  };
}

export function filterDepartments(
  departments = [],
  { query = '', statusFilter = 'active' } = {}
) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedStatus = String(statusFilter || 'active').trim().toLowerCase();

  return departments.filter((dept) => {
    const deleted = isDepartmentDeleted(dept);

    if (normalizedStatus === 'active' && deleted) return false;
    if (normalizedStatus === 'deleted' && !deleted) return false;

    if (!normalizedQuery) return true;

    const haystack = [
      dept.deptcode,
      dept.deptCode,
      dept.deptname,
      dept.deptName
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function renderDepartmentRows(tbodyEl, departments = [], { allowManage = false } = {}) {
  if (!tbodyEl) return;

  if (!departments.length) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No matching departments found.</td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = departments
    .map((dept) => {
      const code = String(dept.deptcode ?? dept.deptCode ?? '');
      const name = String(dept.deptname ?? dept.deptName ?? '');
      const deleted = isDepartmentDeleted(dept);
      const statusLabel = deleted ? 'Inactive' : 'Active';

      const actionsHtml = allowManage
        ? `
          <button type="button" class="btn-edit-dept" data-deptcode="${code}">Edit</button>
          ${
            deleted
              ? `<button type="button" class="btn-restore-dept" data-deptcode="${code}">Restore</button>`
              : `<button type="button" class="btn-delete-dept" data-deptcode="${code}">Delete</button>`
          }
        `
        : '<span class="muted">View only</span>';

      return `
        <tr data-deptcode="${code}" data-deleted="${deleted}">
          <td>${code}</td>
          <td>${name}</td>
          <td>${statusLabel}</td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    })
    .join('');
}

export async function listDepartments(supabaseClient, { includeDeleted = false } = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required to list departments.');
  }

  let query = supabaseClient
    .from('department')
    .select('deptcode, deptname, is_deleted, stamp')
    .order('deptcode', { ascending: true });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createDepartment(supabaseClient, payload, sessionUser = null) {
  if (!canManageDepartments(sessionUser, 'add') && !canManageDepartments(sessionUser, 'create')) {
    throw new Error('You do not have permission to create departments.');
  }

  const check = validateDepartmentPayload(payload, { isUpdate: false });
  if (!check.valid) {
    const err = new Error('Invalid department input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('department')
    .insert({
      deptcode: check.value.deptcode,
      deptname: check.value.deptname,
      is_deleted: false
    })
    .select('deptcode, deptname, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(supabaseClient, deptcode, payload, sessionUser = null) {
  if (!canManageDepartments(sessionUser, 'edit')) {
    throw new Error('You do not have permission to update departments.');
  }

  const normalizedCode = String(deptcode || '').trim().toUpperCase();
  const check = validateDepartmentPayload(
    { ...payload, deptcode: normalizedCode },
    { isUpdate: true }
  );
  if (!check.valid) {
    const err = new Error('Invalid department input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('department')
    .update({
      deptname: check.value.deptname
    })
    .eq('deptcode', normalizedCode)
    .select('deptcode, deptname, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function setDepartmentDeleted(supabaseClient, deptcode, deleted = true, sessionUser = null) {
  const action = deleted ? 'delete' : 'edit';
  if (!canManageDepartments(sessionUser, action)) {
    throw new Error(
      deleted
        ? 'You do not have permission to delete departments.'
        : 'You do not have permission to restore departments.'
    );
  }

  const normalizedCode = String(deptcode || '').trim().toUpperCase();
  const { data, error } = await supabaseClient
    .from('department')
    .update({ is_deleted: Boolean(deleted) })
    .eq('deptcode', normalizedCode)
    .select('deptcode, deptname, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}
