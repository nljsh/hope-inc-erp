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
