/**
 * S4-DEV-04: Reports module, part 1:
 * Product Master List, Active Employees, All Employees, Employee Job History
 * (per-report rights, Print / Save as PDF).
 */

export const PART1_REPORT_KEYS = Object.freeze({
  PRODUCT_MASTER_LIST: "product_master_list",
  ACTIVE_EMPLOYEES: "active_employees",
  ALL_EMPLOYEES: "all_employees",
  EMPLOYEE_JOB_HISTORY: "employee_job_history",
});

export function hasReportPermission(user = {}, reportKey = "") {
  const normalizedKey = String(reportKey || "").trim().toLowerCase();
  if (!normalizedKey) return false;

  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "superadmin" || role === "admin") {
    return true;
  }

  const rightsList = Array.isArray(user?.rights)
    ? user.rights
    : Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  const normalizedRights = new Set(
    rightsList.map((r) => String(r || "").trim().toLowerCase().replace(/[\s-]+/g, "_"))
  );

  if (normalizedRights.has("all_reports") || normalizedRights.has("view_all_reports")) {
    return true;
  }

  const aliasesByReport = {
    [PART1_REPORT_KEYS.PRODUCT_MASTER_LIST]: [
      "report_product_master_list",
      "product_master_list",
      "view_product_master_list",
    ],
    [PART1_REPORT_KEYS.ACTIVE_EMPLOYEES]: [
      "report_active_employees",
      "active_employees",
      "view_active_employees",
    ],
    [PART1_REPORT_KEYS.ALL_EMPLOYEES]: [
      "report_all_employees",
      "all_employees",
      "view_all_employees",
    ],
    [PART1_REPORT_KEYS.EMPLOYEE_JOB_HISTORY]: [
      "report_employee_job_history",
      "employee_job_history",
      "view_employee_job_history",
      "view_job_history",
    ],
  };

  const candidates = aliasesByReport[normalizedKey] || [normalizedKey];
  return candidates.some((key) => normalizedRights.has(key));
}

function isEmployeeActive(emp = {}) {
  if (emp?.is_deleted || emp?.deleted_at) return false;
  if (emp?.separation_date || emp?.separated_at) return false;
  const status = String(emp?.status || emp?.employment_status || "active").trim().toLowerCase();
  return status !== "inactive" && status !== "separated" && status !== "terminated";
}

export function buildProductMasterListReport(products = [], options = {}) {
  const includeInactive = Boolean(options?.includeInactive);
  const rows = (products || [])
    .filter((p) => {
      if (!p) return false;
      if (!includeInactive && (p.is_deleted || String(p.status || "").toLowerCase() === "inactive")) {
        return false;
      }
      return true;
    })
    .map((p, index) => ({
      no: index + 1,
      sku: p.sku ?? p.code ?? p.product_code ?? "",
      name: p.name ?? p.product_name ?? "",
      unit: p.unit ?? p.uom ?? "",
      current_price: Number(p.current_price ?? p.unit_price ?? p.price ?? 0),
      status: p.is_deleted ? "deleted" : p.status || "active",
    }));

  return {
    reportKey: PART1_REPORT_KEYS.PRODUCT_MASTER_LIST,
    title: "Product Master List",
    generatedAt: new Date().toISOString(),
    totalCount: rows.length,
    rows,
  };
}

export function buildEmployeesReport(employees = [], options = {}) {
  const activeOnly = Boolean(options?.activeOnly);
  const reportKey = activeOnly
    ? PART1_REPORT_KEYS.ACTIVE_EMPLOYEES
    : PART1_REPORT_KEYS.ALL_EMPLOYEES;
  const title = activeOnly ? "Active Employees Report" : "All Employees Report";

  const rows = (employees || [])
    .filter((emp) => {
      if (!emp) return false;
      return activeOnly ? isEmployeeActive(emp) : true;
    })
    .map((emp, index) => ({
      no: index + 1,
      empno: emp.empno ?? emp.employee_no ?? emp.id ?? "",
      full_name:
        emp.full_name ??
        ([emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || emp.name || ""),
      department: emp.department_name ?? emp.department ?? "",
      job_title: emp.job_title ?? emp.job ?? "",
      hire_date: emp.hire_date ?? emp.date_hired ?? "",
      status: isEmployeeActive(emp) ? "active" : emp.status || "inactive",
    }));

  return {
    reportKey,
    title,
    generatedAt: new Date().toISOString(),
    totalCount: rows.length,
    rows,
  };
}

export function buildEmployeeJobHistoryReport(jobHistory = [], options = {}) {
  const employeeIdFilter = options?.employeeId ?? options?.employee_id ?? "";
  const empnoFilter = String(options?.empno ?? "").trim().toLowerCase();
  const canViewSalary = Boolean(options?.canViewSalary);

  const rows = (jobHistory || [])
    .filter((entry) => {
      if (!entry) return false;
      if (employeeIdFilter && String(entry.employee_id ?? "") !== String(employeeIdFilter)) {
        return false;
      }
      if (empnoFilter && String(entry.empno ?? "").trim().toLowerCase() !== empnoFilter) {
        return false;
      }
      return true;
    })
    .map((entry, index) => {
      const baseRow = {
        no: index + 1,
        empno: entry.empno ?? entry.employee_no ?? "",
        employee_name: entry.employee_name ?? entry.full_name ?? "",
        department: entry.department_name ?? entry.department ?? "",
        job_title: entry.job_title ?? entry.job ?? "",
        effective_date: entry.effective_date ?? entry.start_date ?? "",
        end_date: entry.end_date ?? "",
        change_type: entry.change_type ?? entry.movement_type ?? "",
      };

      if (canViewSalary && entry.salary !== undefined) {
        baseRow.salary = Number(entry.salary);
      }

      return baseRow;
    });

  return {
    reportKey: PART1_REPORT_KEYS.EMPLOYEE_JOB_HISTORY,
    title: "Employee Job History Report",
    generatedAt: new Date().toISOString(),
    totalCount: rows.length,
    rows,
  };
}

export function triggerReportPrintOrPdf(report = {}, context = {}) {
  const user = context?.user ?? {};
  const reportKey = report?.reportKey ?? context?.reportKey ?? "";

  if (!hasReportPermission(user, reportKey)) {
    return {
      allowed: false,
      action: "print_or_save_pdf",
      reason: "Missing permission for this report.",
    };
  }

  const targetWindow = context?.targetWindow ?? (typeof window !== "undefined" ? window : null);
  const previousTitle = targetWindow?.document ? targetWindow.document.title : "";

  if (targetWindow?.document && report?.title) {
    targetWindow.document.title = `${report.title} - Hope, Inc. ERP`;
  }

  if (typeof targetWindow?.print === "function") {
    targetWindow.print();
  }

  if (targetWindow?.document && report?.title) {
    targetWindow.document.title = previousTitle;
  }

  return {
    allowed: true,
    action: "print_or_save_pdf",
    reportKey,
    title: report?.title || "",
  };
}
