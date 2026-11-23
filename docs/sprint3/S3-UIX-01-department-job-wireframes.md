# S3-UIX-01: Department & Job Screens Wireframes

- **Task ID:** `S3-UIX-01`
- **Sprint:** Sprint 3 (Week 5)
- **Role:** UI/UX Designer
- **Target View:** `src/pages/dashboard.html` (`Employee Registries` / HR Sub-views)
- **Related Tasks:** `S3-DEV-01` (Department list and CRUD), `S3-DEV-02` (Job list and CRUD), `S3-DBA-04` (Child-record delete checks)

---

## 1. Screen Inventory & Navigation

Within the **Employee Registries** workspace module, operators switch between three sub-tabs: **Employees** (default), **Departments**, and **Jobs**.

1. **Department List & CRUD Modal (`S3-DEV-01`)** — Registry of organizational departments (`deptcode`, `deptname`) with inline/modal creation, editing, and child-protected deletion.
2. **Job List & CRUD Modal (`S3-DEV-02`)** — Registry of standardized job titles/classifications (`jobcode`, `jobdesc`) used across employee records and job history assignments.

---

## 2. Wireframe 1: Department Directory (`S3-DEV-01`)

```text
+---------------------------------------------------------------------------------------+

| [Hope ENTERPRISE]                                 [OPERATOR · VERIFIED]  [Sign Out]   |
+-----------------------+---------------------------------------------------------------+

| OPERATIONS LEDGER     |  EMPLOYEE REGISTRIES                       [ + Add Department ]*|
|                       |  [ Employees ]   [ > Departments ]   [ Jobs ]                  |
|  Executive Overview   |                                                               |
|  Customer Lifecycle   |  [ Search department code or name... ]                        |
|  Product Catalog      |                                                               |
| >Employee Registries  |  +-----------+---------------------------------+------------+ |
|  Sales Ledgers        |  | Dept Code | Department Name                 | Actions    | |
|  Reports              |  +-----------+---------------------------------+------------+ |
|  User Management      |  | D-01      | Executive Operations            | [Edit][Del]| |
|                       |  | D-02      | Enterprise Sales & Accounts     | [Edit][Del]| |
|                       |  | D-03      | Logistics & Fulfillment         | [Edit][Del]| |
|                       |  +-----------+---------------------------------+------------+ |
|                       |  Showing 1–3 of 8 departments              [< Prev] [Next >]  |
+-----------------------+---------------------------------------------------------------+
* [+ Add Department], [Edit], and [Del] rendered only when user holds corresponding HR rights.
```

### Department Modal & Validation Rules

- **Fields:** `Department Code` (auto-generated or read-only on edit) and `Department Name` (required).
- **Delete Guard (`S3-DBA-04`):** Attempting to delete a department with assigned active employees or job history entries blocks deletion and displays: _"Cannot delete department: one or more employee records reference this department."_

---

## 3. Wireframe 2: Job Classifications Directory (`S3-DEV-02`)

```text
+---------------------------------------------------------------------------------------+

|  EMPLOYEE REGISTRIES                                                [ + Add Job ]*    |
|  [ Employees ]   [ Departments ]   [ > Jobs ]                                         |
|                                                                                       |
|  [ Search job code or title... ]                                                      |
|                                                                                       |
|  +-----------+-------------------------------------------------+--------------------+ |
|  | Job Code  | Job Title / Description                         | Actions            | |
|  +-----------+-------------------------------------------------+--------------------+ |
|  | J-101     | Senior Account Executive                        | [Edit] [Delete]*   | |
|  | J-102     | Warehouse Operations Lead                       | [Edit] [Delete]*   | |
|  | J-103     | Financial Ledger Analyst                        | [Edit] [Delete]*   | |
|  +-----------+-------------------------------------------------+--------------------+ |
|  Showing 1–3 of 12 job titles                                     [< Prev] [Next >]   |
+---------------------------------------------------------------------------------------+
```

### Job Modal & Validation Rules

- **Fields:** `Job Code` (auto-generated or read-only on edit) and `Job Title / Description` (required, non-empty check).
- **Delete Guard (`S3-DBA-04`):** Blocks deletion when referenced by active employees or historical job assignments.
