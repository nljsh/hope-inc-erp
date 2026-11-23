# Sprint 3 Planning Notes & Board (`S3-SM-01`)

- **Reference:** `HOPE_Sprint_Task_Plan_revised.xlsx` (`Task Plan` sheet, Sprint 3, Weeks 5–6, Due Day 1)
- **Workflow:** One task per branch, one PR per task off `main` (`Merged` = done)

## Sprint 3 Planning Notes
- **Focus:** HR module (`department`, `job`, `employee`, `jobhistory`), UI/UX screens & job timeline component, test cases & permission/salary visibility checks, and Scrum Master sprint tracking/ceremonies.
- **Current Coordination Reality:**
  - `S3-DEV-01` through `S3-DEV-08` and `S3-DBA-01` through `S3-DBA-06` have been implemented and pushed to feature branches; PR review/merge and UI/environment integration remain key dependencies.
  - UI/UX (`S3-UIX-01`–`S3-UIX-05`) and Testing (`S3-TST-01`–`S3-TST-06`) tasks are tracked openly on the board without marking uncompleted downstream work as done.

## Sprint 3 Board by Role

### Scrum Master (Week 5–6)
- [ ] `S3-SM-01` (Week 5, Due Day 1): Sprint 3 planning notes and board
- [ ] `S3-SM-02` (Week 5, Due Day 3): Re-prioritize any Sprint 2 carryover
- [ ] `S3-SM-03` (Week 5, Due Day 5): Mid-sprint check and impediment log
- [ ] `S3-SM-04` (Week 6, Due Day 8): Update velocity and Sprint 4 risk register
- [ ] `S3-SM-05` (Week 6, Due Day 10): Sprint 3 review and retrospective report

### Developer (Week 5–6)
- [ ] `S3-DEV-01` (Week 5, Due Day 2): Department list and CRUD
- [ ] `S3-DEV-02` (Week 5, Due Day 3): Job list and CRUD
- [ ] `S3-DEV-03` (Week 5, Due Day 4): Employee list with search and filter
- [ ] `S3-DEV-04` (Week 5, Due Day 5): Employee create and edit form
- [ ] `S3-DEV-05` (Week 6, Due Day 6): Employee soft delete/restore and separation date
- [ ] `S3-DEV-06` (Week 6, Due Day 7): Job history: add, edit and delete promotion or transfer (effective date, salary)
- [ ] `S3-DEV-07` (Week 6, Due Day 8): Employee profile with job timeline
- [ ] `S3-DEV-08` (Week 6, Due Day 9): Restrict job history and salary visibility with the View Job History right

### DB Admin (Week 5–6)
- [ ] `S3-DBA-01` (Week 5, Due Day 2): Views/queries: employee current job and department
- [ ] `S3-DBA-02` (Week 5, Due Day 4): Job history validation (no duplicate effective dates)
- [ ] `S3-DBA-03` (Week 5, Due Day 5): Link app_user.empno to employee
- [ ] `S3-DBA-04` (Week 6, Due Day 6): Verify child-record delete checks for employee, department, job
- [ ] `S3-DBA-05` (Week 6, Due Day 7): HR demo data
- [ ] `S3-DBA-06` (Week 6, Due Day 9): Indexes and backup/restore script

### UI/UX Designer (Week 5–6)
- [ ] `S3-UIX-01` (Week 5, Due Day 2): Wireframes: department and job screens
- [ ] `S3-UIX-02` (Week 5, Due Day 3): Wireframes: employee and profile screens
- [ ] `S3-UIX-03` (Week 5, Due Day 4): Job timeline component design
- [ ] `S3-UIX-04` (Week 5, Due Day 5): Hi-fi mockups and handoff notes
- [ ] `S3-UIX-05` (Week 6, Due Day 9): Usability review of built screens

### Tester (Week 5–6)
- [ ] `S3-TST-01` (Week 5, Due Day 3): Test cases: department and job
- [ ] `S3-TST-02` (Week 5, Due Day 5): Test cases: employee
- [ ] `S3-TST-03` (Week 6, Due Day 7): Job history tests (effective date, salary)
- [ ] `S3-TST-04` (Week 6, Due Day 8): Salary visibility and HR per-right permission tests
- [ ] `S3-TST-05` (Week 6, Due Day 9): Regression test of Sprints 1-2
- [ ] `S3-TST-06` (Week 6, Due Day 9): Bug reports and fix verification
