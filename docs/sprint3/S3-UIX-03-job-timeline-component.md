# S3-UIX-03: Job Timeline Component Design

- **Task ID:** `S3-UIX-03`
- **Sprint:** Sprint 3 (Week 5)
- **Role:** UI/UX Designer
- **Target View:** Employee Profile -> Career & Job History Panel
- **Related Tasks:** `S3-DEV-06` (Job history add/edit/delete promotion or transfer), `S3-DEV-07` (Employee profile with job timeline), `S3-DEV-08` (Restrict job history and salary visibility with `View Job History` right), `S3-DBA-02` (No duplicate effective dates)

---

## 1. Component Architecture & States

The **Job Timeline** displays an employee's chronological career progression (initial hire, promotions, department transfers, and salary adjustments) ordered newest-first (`effdate DESC`).

---

## 2. Wireframe: Job Timeline Component (`S3-DEV-06` & `S3-DEV-07`)

```text
+-------------------------------------------------------------------+

|  CAREER & JOB HISTORY                      [ + Record Change ]*   |
+-------------------------------------------------------------------+

|                                                                   |
|  (●)── 2026-01-15  ·  CURRENT ROLE                    [Edit][Del]*|
|   │    Senior Account Executive  ·  Enterprise Sales              |
|   │    Compensation: $68,500.00 / yr                              |
|   │                                                               |
|  (○)── 2025-02-01  ·  PROMOTION                       [Edit][Del]*|
|   │    Account Executive  ·  Enterprise Sales                     |
|   │    Compensation: $56,000.00 / yr                              |
|   │                                                               |
|  (○)── 2024-03-15  ·  INITIAL ASSIGNMENT              [Edit][Del]*|
|        Sales Associate  ·  Enterprise Sales                       |
|        Compensation: $45,000.00 / yr                              |
|                                                                   |
+-------------------------------------------------------------------+
* [+ Record Change], [Edit], and [Del] gated by Add/Edit/Delete Job History rights.
```

---

## 3. Add / Edit Promotion or Transfer Modal (`S3-DEV-06`)

```text
+-------------------------------------------------------+

|  Record Promotion / Transfer — E-001             [X]  |
+-------------------------------------------------------+

|  EFFECTIVE DATE (`effdate`) *                         |
|  [ 2026-04-01                                       ] |
|                                                       |
|  NEW DEPARTMENT *                                     |
|  [ Enterprise Sales & Accounts                    v ] |
|                                                       |
|  NEW JOB TITLE *                                      |
|  [ Senior Account Executive                       v ] |
|                                                       |
|  SALARY (`salary`) *                                  |
|  [ 68500.00                                         ] |
|                                                       |
|                     [ Cancel ]   [ Save Entry ]       |
+-------------------------------------------------------+
```

### Validation & Duplicate-Date Rules (`S3-DBA-02`)

- **Unique Effective Date:** Only one job history entry is permitted per `(empno, effdate)`. If a duplicate date is submitted, display inline error: _"A job history record already exists for this effective date. Edit the existing entry instead."_

---

## 4. Permission-Gated Visibility (`S3-DEV-08`)

- **Without `View Job History` Right:** Do **not** render compensation figures or timeline entries in the DOM. Replace the timeline panel with a clean restricted notice card:
  - _"Job history and compensation records are restricted. Contact a Superadmin if you require `View Job History` access."_
