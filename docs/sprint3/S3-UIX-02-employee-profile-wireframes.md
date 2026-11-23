# S3-UIX-02: Employee Directory & Profile Screens Wireframes

- **Task ID:** `S3-UIX-02`
- **Sprint:** Sprint 3 (Week 5)
- **Role:** UI/UX Designer
- **Target View:** `src/pages/dashboard.html` (`Employee Registries` -> `Employees` & `Employee Profile`)
- **Related Tasks:** `S3-DEV-03` (Employee list with search and filter), `S3-DEV-04` (Create/edit form), `S3-DEV-05` (Soft delete/restore and separation date), `S3-DBA-01` (Current job & department view)

---

## 1. Wireframe 1: Employee Directory (`S3-DEV-03` & `S3-DBA-01`)

```text
+---------------------------------------------------------------------------------------+

|  EMPLOYEE REGISTRIES                                             [ + Add Employee ]*  |
|  [ > Employees ]   [ Departments ]   [ Jobs ]                                         |
|                                                                                       |
|  [ Search name or empno... ]   [ Dept: All v ]   [ Status: Active v ]                 |
|                                                                                       |
|  +--------+------------------+-------------------+-------------------+--------------+ |
|  | Emp No | Full Name        | Current Dept      | Current Job       | Actions      | |
|  +--------+------------------+-------------------+-------------------+--------------+ |
|  | E-001  | Elena Santos     | Enterprise Sales  | Sr. Account Exec  | [View] [..] | |
|  | E-002  | Marcus Reyes     | Logistics         | Operations Lead   | [View] [..] | |
|  +--------+------------------+-------------------+-------------------+--------------+ |
|  Showing 1–2 of 19 active employees                               [< Prev] [Next >]   |
+---------------------------------------------------------------------------------------+
* Current Dept and Current Job resolve from latest effective job history (`S3-DBA-01`).
```

### Search, Filter & Status Rules

- **Filters:** Keyword search (`empno`, `lastname`, `firstname`), Department dropdown filter, and Employment Status filter (`Active` default, `Separated / Archived`, `All`).

---

## 2. Wireframe 2: Create / Edit Employee Modal (`S3-DEV-04`)

```text
+-------------------------------------------------------+

|  Add Employee  (or Edit Employee: E-001)         [X]  |
+-------------------------------------------------------+

|  EMPLOYEE NUMBER (`empno`)                            |
|  [ E-003 (Auto-assigned / Read-only on Edit)       ]  |
|                                                       |
|  FIRST NAME *                 LAST NAME *             |
|  [                      ]     [                     ] |
|                                                       |
|  GENDER                       BIRTH DATE              |
|  [ Select gender      v ]     [ YYYY-MM-DD          ] |
|                                                       |
|  HIRE DATE *                                          |
|  [ YYYY-MM-DD                                       ] |
|                                                       |
|                     [ Cancel ]   [ Save Employee ]    |
+-------------------------------------------------------+
```

---

## 3. Wireframe 3: Employee Profile & Separation / Restore Flow (`S3-DEV-05` & `S3-DEV-07`)

```text
+---------------------------------------------------------------------------------------+

|  < Back to Employees                                       [ Edit Profile ]* [Archive]*|
|                                                                                       |
|  E-001 · Elena Santos                                              [ ACTIVE ]         |
|  Senior Account Executive · Enterprise Sales & Accounts                               |
+-----------------------------------+---------------------------------------------------+

|  PERSONAL & TENURE DETAILS        |  CAREER & JOB HISTORY TIMELINE (`S3-UIX-03`)      |
|  Hire Date:       2024-03-15      |  (Rendered only if `View Job History` right = 1)  |
|  Separation Date: —               |                                                   |
|  Linked Account:  elena@hope.com  |  [ See S3-UIX-03 for timeline & salary controls ] |
+-----------------------------------+---------------------------------------------------+
```

### Soft Delete, Separation Date & Restore Rules (`S3-DEV-05`)

- **Soft Delete / Separation:** Clicking `Archive / Separate` prompts for an optional **Separation Date** (defaults to today's date). Confirming sets the soft-delete flag, records `sepdate`, and updates the profile pill to `Separated` (`#23252C` bg, `#6B7280` text).
- **Restore:** Viewing a separated employee profile displays a `[ Restore Employee ]` action that clears the soft-delete status and restores active directory visibility.
