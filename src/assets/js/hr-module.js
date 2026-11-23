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

// S3-DEV-02: Job list and CRUD (permission-checked)

export function canViewJobs(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('job.view') ||
    rights.includes('Job.View') ||
    rights.includes('hr.view') ||
    rights.includes('HR.View')
  );
}

export function canManageJobs(sessionUser, action = 'edit') {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  const normalizedAction = String(action || '').toLowerCase();
  const candidates = [
    `job.${normalizedAction}`,
    `Job.${normalizedAction[0]?.toUpperCase() || ''}${normalizedAction.slice(1)}`,
    `hr.job.${normalizedAction}`,
    `hr.${normalizedAction}`
  ];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.some((r) => candidates.includes(String(r)))
  );
}

export function isJobDeleted(job = {}) {
  const status = String(job.status || '').trim().toLowerCase();
  return Boolean(
    job.is_deleted === true ||
    job.deleted_at ||
    job.deletedAt ||
    status === 'deleted' ||
    status === 'inactive'
  );
}

export function validateJobPayload(input = {}, { isUpdate = false } = {}) {
  const errors = {};
  const jobcode = String(input.jobcode ?? input.jobCode ?? '').trim().toUpperCase();
  const jobdesc = String(input.jobdesc ?? input.jobDesc ?? '').trim();

  if (!isUpdate && !jobcode) {
    errors.jobcode = 'Job code is required.';
  } else if (jobcode && jobcode.length > 4) {
    errors.jobcode = 'Job code must be 4 characters or fewer.';
  }

  if (!jobdesc) {
    errors.jobdesc = 'Job description is required.';
  } else if (jobdesc.length > 20) {
    errors.jobdesc = 'Job description must be 20 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      jobcode,
      jobdesc
    }
  };
}

export function filterJobs(jobs = [], { query = '', statusFilter = 'active' } = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedStatus = String(statusFilter || 'active').trim().toLowerCase();

  return jobs.filter((job) => {
    const deleted = isJobDeleted(job);

    if (normalizedStatus === 'active' && deleted) return false;
    if (normalizedStatus === 'deleted' && !deleted) return false;

    if (!normalizedQuery) return true;

    const haystack = [
      job.jobcode,
      job.jobCode,
      job.jobdesc,
      job.jobDesc
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function renderJobRows(tbodyEl, jobs = [], { allowManage = false } = {}) {
  if (!tbodyEl) return;

  if (!jobs.length) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No matching jobs found.</td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = jobs
    .map((job) => {
      const code = String(job.jobcode ?? job.jobCode ?? '');
      const desc = String(job.jobdesc ?? job.jobDesc ?? '');
      const deleted = isJobDeleted(job);
      const statusLabel = deleted ? 'Inactive' : 'Active';

      const actionsHtml = allowManage
        ? `
          <button type="button" class="btn-edit-job" data-jobcode="${code}">Edit</button>
          ${
            deleted
              ? `<button type="button" class="btn-restore-job" data-jobcode="${code}">Restore</button>`
              : `<button type="button" class="btn-delete-job" data-jobcode="${code}">Delete</button>`
          }
        `
        : '<span class="muted">View only</span>';

      return `
        <tr data-jobcode="${code}" data-deleted="${deleted}">
          <td>${code}</td>
          <td>${desc}</td>
          <td>${statusLabel}</td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    })
    .join('');
}

export async function listJobs(supabaseClient, { includeDeleted = false } = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required to list jobs.');
  }

  let query = supabaseClient
    .from('job')
    .select('jobcode, jobdesc, is_deleted, stamp')
    .order('jobcode', { ascending: true });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createJob(supabaseClient, payload, sessionUser = null) {
  if (!canManageJobs(sessionUser, 'add') && !canManageJobs(sessionUser, 'create')) {
    throw new Error('You do not have permission to create jobs.');
  }

  const check = validateJobPayload(payload, { isUpdate: false });
  if (!check.valid) {
    const err = new Error('Invalid job input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('job')
    .insert({
      jobcode: check.value.jobcode,
      jobdesc: check.value.jobdesc,
      is_deleted: false
    })
    .select('jobcode, jobdesc, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(supabaseClient, jobcode, payload, sessionUser = null) {
  if (!canManageJobs(sessionUser, 'edit')) {
    throw new Error('You do not have permission to update jobs.');
  }

  const normalizedCode = String(jobcode || '').trim().toUpperCase();
  const check = validateJobPayload(
    { ...payload, jobcode: normalizedCode },
    { isUpdate: true }
  );
  if (!check.valid) {
    const err = new Error('Invalid job input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('job')
    .update({
      jobdesc: check.value.jobdesc
    })
    .eq('jobcode', normalizedCode)
    .select('jobcode, jobdesc, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function setJobDeleted(supabaseClient, jobcode, deleted = true, sessionUser = null) {
  const action = deleted ? 'delete' : 'edit';
  if (!canManageJobs(sessionUser, action)) {
    throw new Error(
      deleted
        ? 'You do not have permission to delete jobs.'
        : 'You do not have permission to restore jobs.'
    );
  }

  const normalizedCode = String(jobcode || '').trim().toUpperCase();
  const { data, error } = await supabaseClient
    .from('job')
    .update({ is_deleted: Boolean(deleted) })
    .eq('jobcode', normalizedCode)
    .select('jobcode, jobdesc, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

// S3-DEV-03: Employee list with search and filter (permission-checked)

export function canViewEmployees(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('employee.view') ||
    rights.includes('Employee.View') ||
    rights.includes('hr.view') ||
    rights.includes('HR.View')
  );
}

export function isEmployeeDeleted(employee = {}) {
  const status = String(employee.status || '').trim().toLowerCase();
  return Boolean(
    employee.is_deleted === true ||
    employee.deleted_at ||
    employee.deletedAt ||
    status === 'deleted'
  );
}

export function isEmployeeSeparated(employee = {}) {
  const sep = employee.sepdate ?? employee.sepDate ?? null;
  const status = String(employee.status || '').trim().toLowerCase();
  return Boolean(sep || status === 'separated' || status === 'inactive');
}

export function formatEmployeeFullName(employee = {}) {
  const first = String(employee.firstname ?? employee.firstName ?? '').trim();
  const last = String(employee.lastname ?? employee.lastName ?? '').trim();
  if (last && first) return `${last}, ${first}`;
  return last || first || '';
}

export function filterEmployees(
  employees = [],
  {
    query = '',
    statusFilter = 'active',
    genderFilter = 'all',
    deptFilter = 'all'
  } = {}
) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedStatus = String(statusFilter || 'active').trim().toLowerCase();
  const normalizedGender = String(genderFilter || 'all').trim().toUpperCase();
  const normalizedDept = String(deptFilter || 'all').trim().toUpperCase();

  return employees.filter((emp) => {
    const deleted = isEmployeeDeleted(emp);
    const separated = isEmployeeSeparated(emp);

    if (normalizedStatus === 'active' && (deleted || separated)) return false;
    if (normalizedStatus === 'separated' && (deleted || !separated)) return false;
    if (normalizedStatus === 'deleted' && !deleted) return false;

    const gender = String(emp.gender || '').trim().toUpperCase();
    if (normalizedGender !== 'ALL' && gender !== normalizedGender) return false;

    const deptCode = String(emp.deptcode ?? emp.deptCode ?? '').trim().toUpperCase();
    if (normalizedDept !== 'ALL' && deptCode !== normalizedDept) return false;

    if (!normalizedQuery) return true;

    const haystack = [
      emp.empno,
      emp.empNo,
      emp.firstname,
      emp.firstName,
      emp.lastname,
      emp.lastName,
      formatEmployeeFullName(emp),
      emp.gender,
      deptCode,
      emp.deptname,
      emp.deptName,
      emp.jobcode,
      emp.jobCode,
      emp.jobdesc,
      emp.jobDesc
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function renderEmployeeRows(tbodyEl, employees = [], { allowManage = false } = {}) {
  if (!tbodyEl) return;

  if (!employees.length) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No matching employees found.</td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = employees
    .map((emp) => {
      const empno = String(emp.empno ?? emp.empNo ?? '');
      const fullName = formatEmployeeFullName(emp);
      const gender = String(emp.gender || '').toUpperCase();
      const hireDate = String(emp.hiredate ?? emp.hireDate ?? '');
      const deptCode = String(emp.deptcode ?? emp.deptCode ?? '');
      const deleted = isEmployeeDeleted(emp);
      const separated = isEmployeeSeparated(emp);
      const statusLabel = deleted ? 'Deleted' : separated ? 'Separated' : 'Active';

      const actionsHtml = allowManage
        ? `
          <button type="button" class="btn-view-emp" data-empno="${empno}">View</button>
          <button type="button" class="btn-edit-emp" data-empno="${empno}">Edit</button>
        `
        : `<button type="button" class="btn-view-emp" data-empno="${empno}">View</button>`;

      return `
        <tr data-empno="${empno}" data-deleted="${deleted}" data-separated="${separated}">
          <td>${empno}</td>
          <td>${fullName}</td>
          <td>${gender}</td>
          <td>${deptCode || '—'}</td>
          <td>${hireDate || '—'}</td>
          <td>${statusLabel}</td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    })
    .join('');
}

export async function listEmployees(supabaseClient, { includeDeleted = false } = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required to list employees.');
  }

  let query = supabaseClient
    .from('employee')
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .order('empno', { ascending: true });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// S3-DEV-04: Employee create and edit form (permission-checked)

export function canManageEmployees(sessionUser, action = 'edit') {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  const normalizedAction = String(action || '').toLowerCase();
  const candidates = [
    `employee.${normalizedAction}`,
    `Employee.${normalizedAction[0]?.toUpperCase() || ''}${normalizedAction.slice(1)}`,
    `hr.employee.${normalizedAction}`,
    `hr.${normalizedAction}`
  ];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.some((r) => candidates.includes(String(r)))
  );
}

function isValidIsoDate(value) {
  if (!value) return false;
  const str = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const parsed = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === str;
}

export function validateEmployeePayload(input = {}, { isUpdate = false } = {}) {
  const errors = {};

  const empno = String(input.empno ?? input.empNo ?? '').trim();
  const lastname = String(input.lastname ?? input.lastName ?? '').trim();
  const firstname = String(input.firstname ?? input.firstName ?? '').trim();
  const gender = String(input.gender ?? '').trim().toUpperCase();
  const birthdate = String(input.birthdate ?? input.birthDate ?? '').trim();
  const hiredate = String(input.hiredate ?? input.hireDate ?? '').trim();
  const rawSepdate = input.sepdate ?? input.sepDate ?? '';
  const sepdate = rawSepdate === null || rawSepdate === undefined ? '' : String(rawSepdate).trim();

  if (!isUpdate && !empno) {
    errors.empno = 'Employee number is required.';
  } else if (empno && empno.length > 5) {
    errors.empno = 'Employee number must be 5 characters or fewer.';
  }

  if (!lastname) {
    errors.lastname = 'Last name is required.';
  } else if (lastname.length > 15) {
    errors.lastname = 'Last name must be 15 characters or fewer.';
  }

  if (!firstname) {
    errors.firstname = 'First name is required.';
  } else if (firstname.length > 15) {
    errors.firstname = 'First name must be 15 characters or fewer.';
  }

  if (!['M', 'F'].includes(gender)) {
    errors.gender = 'Gender must be M or F.';
  }

  if (!isValidIsoDate(birthdate)) {
    errors.birthdate = 'Valid birth date (YYYY-MM-DD) is required.';
  }

  if (!isValidIsoDate(hiredate)) {
    errors.hiredate = 'Valid hire date (YYYY-MM-DD) is required.';
  }

  if (isValidIsoDate(birthdate) && isValidIsoDate(hiredate) && birthdate >= hiredate) {
    errors.hiredate = 'Hire date must be after birth date.';
  }

  if (sepdate) {
    if (!isValidIsoDate(sepdate)) {
      errors.sepdate = 'Separation date must be a valid date (YYYY-MM-DD).';
    } else if (isValidIsoDate(hiredate) && sepdate < hiredate) {
      errors.sepdate = 'Separation date cannot be earlier than hire date.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      empno,
      lastname,
      firstname,
      gender,
      birthdate,
      hiredate,
      sepdate: sepdate || null
    }
  };
}

export function readEmployeeFormPayload(formEl) {
  if (!formEl) return {};
  const data = new FormData(formEl);
  return {
    empno: data.get('empno') ?? '',
    lastname: data.get('lastname') ?? '',
    firstname: data.get('firstname') ?? '',
    gender: data.get('gender') ?? '',
    birthdate: data.get('birthdate') ?? '',
    hiredate: data.get('hiredate') ?? '',
    sepdate: data.get('sepdate') ?? ''
  };
}

export function populateEmployeeForm(formEl, employee = null) {
  if (!formEl) return;

  const setField = (name, val) => {
    const el = formEl.elements?.[name];
    if (el) el.value = val ?? '';
  };

  if (!employee) {
    formEl.reset();
    const empnoInput = formEl.elements?.empno;
    if (empnoInput) empnoInput.readOnly = false;
    return;
  }

  setField('empno', employee.empno ?? employee.empNo ?? '');
  setField('lastname', employee.lastname ?? employee.lastName ?? '');
  setField('firstname', employee.firstname ?? employee.firstName ?? '');
  setField('gender', String(employee.gender ?? '').toUpperCase());
  setField('birthdate', employee.birthdate ?? employee.birthDate ?? '');
  setField('hiredate', employee.hiredate ?? employee.hireDate ?? '');
  setField('sepdate', employee.sepdate ?? employee.sepDate ?? '');

  const empnoInput = formEl.elements?.empno;
  if (empnoInput) empnoInput.readOnly = true;
}

export async function createEmployee(supabaseClient, payload, sessionUser = null) {
  if (!canManageEmployees(sessionUser, 'add') && !canManageEmployees(sessionUser, 'create')) {
    throw new Error('You do not have permission to create employees.');
  }

  const check = validateEmployeePayload(payload, { isUpdate: false });
  if (!check.valid) {
    const err = new Error('Invalid employee form input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('employee')
    .insert({
      empno: check.value.empno,
      lastname: check.value.lastname,
      firstname: check.value.firstname,
      gender: check.value.gender,
      birthdate: check.value.birthdate,
      hiredate: check.value.hiredate,
      sepdate: check.value.sepdate,
      is_deleted: false
    })
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(supabaseClient, empno, payload, sessionUser = null) {
  if (!canManageEmployees(sessionUser, 'edit')) {
    throw new Error('You do not have permission to update employees.');
  }

  const normalizedEmpno = String(empno || '').trim();
  const check = validateEmployeePayload(
    { ...payload, empno: normalizedEmpno },
    { isUpdate: true }
  );
  if (!check.valid) {
    const err = new Error('Invalid employee form input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('employee')
    .update({
      lastname: check.value.lastname,
      firstname: check.value.firstname,
      gender: check.value.gender,
      birthdate: check.value.birthdate,
      hiredate: check.value.hiredate,
      sepdate: check.value.sepdate
    })
    .eq('empno', normalizedEmpno)
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

// S3-DEV-05: Employee soft delete/restore and separation date (permission-checked)

export function validateSeparationDate(sepdate, hiredate = null) {
  const value = String(sepdate || '').trim();
  if (!isValidIsoDate(value)) {
    return {
      valid: false,
      error: 'Valid separation date (YYYY-MM-DD) is required.',
      value: null
    };
  }

  if (hiredate && isValidIsoDate(hiredate) && value < String(hiredate).trim()) {
    return {
      valid: false,
      error: 'Separation date cannot be earlier than hire date.',
      value: null
    };
  }

  return {
    valid: true,
    error: null,
    value
  };
}

export async function setEmployeeSeparation(
  supabaseClient,
  empno,
  sepdate,
  sessionUser = null,
  hiredate = null
) {
  if (!canManageEmployees(sessionUser, 'edit')) {
    throw new Error('You do not have permission to update employee separation dates.');
  }

  const normalizedEmpno = String(empno || '').trim();
  if (!normalizedEmpno) {
    throw new Error('Employee number is required.');
  }

  let effectiveHireDate = hiredate;
  if (!effectiveHireDate) {
    const { data: existing, error: fetchError } = await supabaseClient
      .from('employee')
      .select('hiredate')
      .eq('empno', normalizedEmpno)
      .single();
    if (fetchError) throw fetchError;
    effectiveHireDate = existing?.hiredate ?? null;
  }

  const check = validateSeparationDate(sepdate, effectiveHireDate);
  if (!check.valid) {
    const err = new Error(check.error);
    err.validationErrors = { sepdate: check.error };
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('employee')
    .update({ sepdate: check.value })
    .eq('empno', normalizedEmpno)
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function clearEmployeeSeparation(supabaseClient, empno, sessionUser = null) {
  if (!canManageEmployees(sessionUser, 'edit')) {
    throw new Error('You do not have permission to clear employee separation dates.');
  }

  const normalizedEmpno = String(empno || '').trim();
  if (!normalizedEmpno) {
    throw new Error('Employee number is required.');
  }

  const { data, error } = await supabaseClient
    .from('employee')
    .update({ sepdate: null })
    .eq('empno', normalizedEmpno)
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function setEmployeeDeleted(
  supabaseClient,
  empno,
  deleted = true,
  sessionUser = null
) {
  const action = deleted ? 'delete' : 'edit';
  if (!canManageEmployees(sessionUser, action)) {
    throw new Error(
      deleted
        ? 'You do not have permission to delete employees.'
        : 'You do not have permission to restore employees.'
    );
  }

  const normalizedEmpno = String(empno || '').trim();
  if (!normalizedEmpno) {
    throw new Error('Employee number is required.');
  }

  const { data, error } = await supabaseClient
    .from('employee')
    .update({ is_deleted: Boolean(deleted) })
    .eq('empno', normalizedEmpno)
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .single();

  if (error) throw error;
  return data;
}

export async function restoreEmployee(supabaseClient, empno, sessionUser = null) {
  return setEmployeeDeleted(supabaseClient, empno, false, sessionUser);
}

// S3-DEV-06: Job history add, edit and delete promotion or transfer (permission-checked)

export function canManageJobHistory(sessionUser, action = 'edit') {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  const normalizedAction = String(action || '').toLowerCase();
  const candidates = [
    `jobhistory.${normalizedAction}`,
    `JobHistory.${normalizedAction[0]?.toUpperCase() || ''}${normalizedAction.slice(1)}`,
    `job_history.${normalizedAction}`,
    `hr.jobhistory.${normalizedAction}`,
    `hr.${normalizedAction}`
  ];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.some((r) => candidates.includes(String(r)))
  );
}

export function validateJobHistoryPayload(input = {}, { isUpdate = false } = {}) {
  const errors = {};

  const empno = String(input.empno ?? input.empNo ?? '').trim();
  const jobcode = String(input.jobcode ?? input.jobCode ?? '').trim().toUpperCase();
  const effdate = String(input.effdate ?? input.effDate ?? '').trim();
  const rawSalary = input.salary;
  const salary =
    rawSalary === '' || rawSalary === null || rawSalary === undefined
      ? Number.NaN
      : Number(rawSalary);
  const rawDept = input.deptcode ?? input.deptCode ?? '';
  const deptcode = String(rawDept).trim().toUpperCase();

  if (!isUpdate && !empno) {
    errors.empno = 'Employee number is required.';
  } else if (empno && empno.length > 5) {
    errors.empno = 'Employee number must be 5 characters or fewer.';
  }

  if (!isUpdate && !jobcode) {
    errors.jobcode = 'Job code is required.';
  } else if (jobcode && jobcode.length > 4) {
    errors.jobcode = 'Job code must be 4 characters or fewer.';
  }

  if (!isUpdate && !isValidIsoDate(effdate)) {
    errors.effdate = 'Valid effective date (YYYY-MM-DD) is required.';
  } else if (isUpdate && effdate && !isValidIsoDate(effdate)) {
    errors.effdate = 'Effective date must be a valid date (YYYY-MM-DD).';
  }

  if (!Number.isFinite(salary) || salary < 0) {
    errors.salary = 'Salary must be a valid non-negative number.';
  }

  if (deptcode && deptcode.length > 4) {
    errors.deptcode = 'Department code must be 4 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      empno,
      jobcode,
      effdate,
      salary: Number.isFinite(salary) ? Number(salary.toFixed(2)) : null,
      deptcode: deptcode || null
    }
  };
}

export function hasDuplicateEffectiveDate(entries = [], empno, effdate, excludeKey = null) {
  const targetEmp = String(empno || '').trim();
  const targetDate = String(effdate || '').trim();
  if (!targetEmp || !targetDate) return false;

  return entries.some((item) => {
    const itemEmp = String(item.empno ?? item.empNo ?? '').trim();
    const itemDate = String(item.effdate ?? item.effDate ?? '').trim();
    const itemJob = String(item.jobcode ?? item.jobCode ?? '').trim().toUpperCase();
    const key = `${itemEmp}|${itemJob}|${itemDate}`;
    if (excludeKey && key === excludeKey) return false;
    return itemEmp === targetEmp && itemDate === targetDate;
  });
}

export function renderJobHistoryRows(tbodyEl, entries = [], { allowManage = false } = {}) {
  if (!tbodyEl) return;

  if (!entries.length) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No job history records found.</td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = entries
    .map((row) => {
      const empno = String(row.empno ?? row.empNo ?? '');
      const jobcode = String(row.jobcode ?? row.jobCode ?? '');
      const effdate = String(row.effdate ?? row.effDate ?? '');
      const deptcode = String(row.deptcode ?? row.deptCode ?? '');
      const salaryNum = Number(row.salary ?? 0);
      const salaryText = Number.isFinite(salaryNum) ? salaryNum.toFixed(2) : '0.00';

      const actionsHtml = allowManage
        ? `
          <button type="button" class="btn-edit-jh" data-empno="${empno}" data-jobcode="${jobcode}" data-effdate="${effdate}">Edit</button>
          <button type="button" class="btn-delete-jh" data-empno="${empno}" data-jobcode="${jobcode}" data-effdate="${effdate}">Delete</button>
        `
        : '<span class="muted">View only</span>';

      return `
        <tr data-empno="${empno}" data-jobcode="${jobcode}" data-effdate="${effdate}">
          <td>${effdate}</td>
          <td>${jobcode}</td>
          <td>${deptcode || '—'}</td>
          <td>${salaryText}</td>
          <td>${empno}</td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    })
    .join('');
}

export async function listJobHistory(supabaseClient, empno = null) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required to list job history.');
  }

  let query = supabaseClient
    .from('jobhistory')
    .select('empno, jobcode, effdate, salary, deptcode')
    .order('effdate', { ascending: false });

  if (empno) {
    query = query.eq('empno', String(empno).trim());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addJobHistoryEntry(supabaseClient, payload, sessionUser = null) {
  if (!canManageJobHistory(sessionUser, 'add') && !canManageJobHistory(sessionUser, 'create')) {
    throw new Error('You do not have permission to add job history records.');
  }

  const check = validateJobHistoryPayload(payload, { isUpdate: false });
  if (!check.valid) {
    const err = new Error('Invalid job history input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('jobhistory')
    .insert({
      empno: check.value.empno,
      jobcode: check.value.jobcode,
      effdate: check.value.effdate,
      salary: check.value.salary,
      deptcode: check.value.deptcode
    })
    .select('empno, jobcode, effdate, salary, deptcode')
    .single();

  if (error) throw error;
  return data;
}

export async function updateJobHistoryEntry(
  supabaseClient,
  key = {},
  payload = {},
  sessionUser = null
) {
  if (!canManageJobHistory(sessionUser, 'edit')) {
    throw new Error('You do not have permission to update job history records.');
  }

  const empno = String(key.empno ?? key.empNo ?? '').trim();
  const jobcode = String(key.jobcode ?? key.jobCode ?? '').trim().toUpperCase();
  const effdate = String(key.effdate ?? key.effDate ?? '').trim();

  if (!empno || !jobcode || !effdate) {
    throw new Error('Employee number, job code, and effective date are required to update job history.');
  }

  const check = validateJobHistoryPayload(
    { ...payload, empno, jobcode, effdate },
    { isUpdate: true }
  );
  if (!check.valid) {
    const err = new Error('Invalid job history input.');
    err.validationErrors = check.errors;
    throw err;
  }

  const nextEffDate = check.value.effdate || effdate;
  const { data, error } = await supabaseClient
    .from('jobhistory')
    .update({
      effdate: nextEffDate,
      salary: check.value.salary,
      deptcode: check.value.deptcode
    })
    .eq('empno', empno)
    .eq('jobcode', jobcode)
    .eq('effdate', effdate)
    .select('empno, jobcode, effdate, salary, deptcode')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJobHistoryEntry(supabaseClient, key = {}, sessionUser = null) {
  if (!canManageJobHistory(sessionUser, 'delete')) {
    throw new Error('You do not have permission to delete job history records.');
  }

  const empno = String(key.empno ?? key.empNo ?? '').trim();
  const jobcode = String(key.jobcode ?? key.jobCode ?? '').trim().toUpperCase();
  const effdate = String(key.effdate ?? key.effDate ?? '').trim();

  if (!empno || !jobcode || !effdate) {
    throw new Error('Employee number, job code, and effective date are required to delete job history.');
  }

  const { data, error } = await supabaseClient
    .from('jobhistory')
    .delete()
    .eq('empno', empno)
    .eq('jobcode', jobcode)
    .eq('effdate', effdate)
    .select('empno, jobcode, effdate, salary, deptcode')
    .single();

  if (error) throw error;
  return data;
}

// S3-DEV-07: Employee profile with job timeline (permission-checked)

export function buildJobTimeline(entries = [], { order = 'desc' } = {}) {
  const normalizedOrder = String(order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const enriched = (Array.isArray(entries) ? entries : []).map((row) => {
    const empno = String(row.empno ?? row.empNo ?? '').trim();
    const jobcode = String(row.jobcode ?? row.jobCode ?? '').trim().toUpperCase();
    const jobdesc = String(row.jobdesc ?? row.jobDesc ?? jobcode).trim();
    const deptcode = String(row.deptcode ?? row.deptCode ?? '').trim().toUpperCase();
    const deptname = String(row.deptname ?? row.deptName ?? deptcode).trim();
    const effdate = String(row.effdate ?? row.effDate ?? '').trim();
    const salaryNum = Number(row.salary ?? 0);

    return {
      empno,
      jobcode,
      jobdesc,
      deptcode,
      deptname,
      effdate,
      salary: Number.isFinite(salaryNum) ? Number(salaryNum.toFixed(2)) : 0
    };
  });

  enriched.sort((a, b) => {
    const cmp = a.effdate.localeCompare(b.effdate);
    return normalizedOrder === 'asc' ? cmp : -cmp;
  });

  return enriched.map((item, idx, arr) => {
    const chronological = normalizedOrder === 'asc' ? arr : [...arr].reverse();
    const chronoIdx = chronological.findIndex(
      (x) => x.effdate === item.effdate && x.jobcode === item.jobcode
    );
    const prev = chronoIdx > 0 ? chronological[chronoIdx - 1] : null;

    let movementType = 'Initial Assignment';
    if (prev) {
      const deptChanged = prev.deptcode && item.deptcode && prev.deptcode !== item.deptcode;
      const jobChanged = prev.jobcode && item.jobcode && prev.jobcode !== item.jobcode;
      const salaryIncreased = item.salary > prev.salary;

      if (deptChanged && !jobChanged) {
        movementType = 'Transfer';
      } else if (jobChanged && salaryIncreased) {
        movementType = 'Promotion';
      } else if (jobChanged) {
        movementType = 'Role Change';
      } else if (salaryIncreased) {
        movementType = 'Salary Adjustment';
      } else if (deptChanged) {
        movementType = 'Department Transfer';
      } else {
        movementType = 'Update';
      }
    }

    return {
      ...item,
      movementType,
      isCurrent: idx === 0 && normalizedOrder === 'desc'
    };
  });
}

export function getCurrentJobAssignment(entries = []) {
  const timeline = buildJobTimeline(entries, { order: 'desc' });
  return timeline[0] || null;
}

export async function getEmployeeProfile(supabaseClient, empno, sessionUser = null) {
  if (!canViewEmployees(sessionUser)) {
    throw new Error('You do not have permission to view employee profiles.');
  }

  if (!supabaseClient) {
    throw new Error('Supabase client is required to load employee profile.');
  }

  const normalizedEmpno = String(empno || '').trim();
  if (!normalizedEmpno) {
    throw new Error('Employee number is required.');
  }

  const { data: employee, error: empError } = await supabaseClient
    .from('employee')
    .select('empno, lastname, firstname, gender, birthdate, hiredate, sepdate, is_deleted, stamp')
    .eq('empno', normalizedEmpno)
    .single();

  if (empError) throw empError;

  const { data: history, error: histError } = await supabaseClient
    .from('jobhistory')
    .select('empno, jobcode, effdate, salary, deptcode')
    .eq('empno', normalizedEmpno)
    .order('effdate', { ascending: false });

  if (histError) throw histError;

  const timeline = buildJobTimeline(history || [], { order: 'desc' });
  const currentAssignment = timeline[0] || null;

  return {
    employee,
    currentAssignment,
    timeline
  };
}

export function renderEmployeeProfile(containerEl, profile = {}) {
  if (!containerEl) return;

  const emp = profile.employee || {};
  const current = profile.currentAssignment || null;
  const empno = String(emp.empno ?? emp.empNo ?? '');
  const fullName = formatEmployeeFullName(emp) || empno;
  const deleted = isEmployeeDeleted(emp);
  const separated = isEmployeeSeparated(emp);
  const statusLabel = deleted ? 'Deleted' : separated ? 'Separated' : 'Active';

  containerEl.innerHTML = `
    <div class="employee-profile-card" data-empno="${empno}">
      <h3>${fullName} <span class="emp-id">(${empno})</span></h3>
      <p><strong>Status:</strong> ${statusLabel}</p>
      <p><strong>Gender:</strong> ${String(emp.gender || '—').toUpperCase()}</p>
      <p><strong>Birth Date:</strong> ${emp.birthdate || '—'}</p>
      <p><strong>Hire Date:</strong> ${emp.hiredate || '—'}</p>
      <p><strong>Separation Date:</strong> ${emp.sepdate || '—'}</p>
      <p><strong>Current Role:</strong> ${current ? `${current.jobdesc} (${current.jobcode})` : 'Unassigned'}</p>
      <p><strong>Current Department:</strong> ${current ? `${current.deptname} (${current.deptcode})` : 'Unassigned'}</p>
    </div>
  `;
}

export function renderJobTimeline(containerEl, timeline = []) {
  if (!containerEl) return;

  if (!Array.isArray(timeline) || !timeline.length) {
    containerEl.innerHTML = `<p class="empty-state">No job history timeline entries found.</p>`;
    return;
  }

  containerEl.innerHTML = `
    <ul class="job-timeline-list">
      ${timeline
        .map(
          (item) => `
        <li class="timeline-item ${item.isCurrent ? 'is-current' : ''}" data-effdate="${item.effdate}" data-jobcode="${item.jobcode}">
          <div class="timeline-date">${item.effdate}</div>
          <div class="timeline-body">
            <strong>${item.movementType}</strong> — ${item.jobdesc} (${item.jobcode})
            ${item.deptcode ? `<span>• Dept: ${item.deptname || item.deptcode}</span>` : ''}
            <span>• Salary: ${Number(item.salary || 0).toFixed(2)}</span>
            ${item.isCurrent ? '<span class="badge-current">Current</span>' : ''}
          </div>
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

// S3-DEV-08: Restrict job history and salary visibility with the View Job History right

export function canViewJobHistory(sessionUser) {
  if (!sessionUser) return false;
  const role = String(sessionUser.role || '').toLowerCase();
  const rights = Array.isArray(sessionUser.permissions) ? sessionUser.permissions : [];
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    rights.includes('jobhistory.view') ||
    rights.includes('JobHistory.View') ||
    rights.includes('job_history.view') ||
    rights.includes('hr.jobhistory.view') ||
    rights.includes('hr.salary.view')
  );
}

export function sanitizeJobHistoryEntry(entry = {}, sessionUser = null) {
  const allowed = canViewJobHistory(sessionUser);
  if (!allowed) {
    return null;
  }
  return { ...entry };
}

export function sanitizeJobHistoryList(entries = [], sessionUser = null) {
  if (!canViewJobHistory(sessionUser)) {
    return [];
  }
  return (Array.isArray(entries) ? entries : []).map((item) => ({ ...item }));
}

export function formatSalaryForDisplay(salary, sessionUser = null, maskedLabel = 'Restricted') {
  if (!canViewJobHistory(sessionUser)) {
    return maskedLabel;
  }
  const num = Number(salary ?? 0);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

export async function getRestrictedJobHistory(supabaseClient, empno = null, sessionUser = null) {
  if (!canViewJobHistory(sessionUser)) {
    return [];
  }
  return listJobHistory(supabaseClient, empno);
}

export async function getRestrictedEmployeeProfile(
  supabaseClient,
  empno,
  sessionUser = null
) {
  const profile = await getEmployeeProfile(supabaseClient, empno, sessionUser);
  const canViewHistory = canViewJobHistory(sessionUser);

  return {
    ...profile,
    canViewJobHistory: canViewHistory,
    timeline: canViewHistory ? profile.timeline : [],
    currentAssignment: canViewHistory
      ? profile.currentAssignment
      : profile.currentAssignment
        ? {
            ...profile.currentAssignment,
            salary: null
          }
        : null
  };
}

export function renderRestrictedJobHistoryRows(
  tbodyEl,
  entries = [],
  sessionUser = null,
  { allowManage = false } = {}
) {
  if (!tbodyEl) return;

  if (!canViewJobHistory(sessionUser)) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="6" class="restricted-state">Job history and salary details require the View Job History permission.</td>
      </tr>
    `;
    return;
  }

  renderJobHistoryRows(tbodyEl, entries, { allowManage });
}

export function renderRestrictedJobTimeline(containerEl, timeline = [], sessionUser = null) {
  if (!containerEl) return;

  if (!canViewJobHistory(sessionUser)) {
    containerEl.innerHTML = `
      <p class="restricted-state">Job timeline and salary information are restricted without the View Job History right.</p>
    `;
    return;
  }

  renderJobTimeline(containerEl, timeline);
}
