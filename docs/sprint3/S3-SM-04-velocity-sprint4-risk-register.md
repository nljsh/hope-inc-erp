# S3-SM-04: Update velocity and Sprint 4 risk register

- **Task ID:** `S3-SM-04`
- **Sprint / Week:** Sprint 3, Week 6
- **Role:** Scrum Master
- **Task (one PR):** Update velocity and Sprint 4 risk register
- **Due (sprint day):** Day 8
- **Description:** Updates Sprint 3 velocity and PR/branch completion metrics without overstating unmerged work or pending UI/UX and testing tasks, and establishes a Sprint 4 risk register with owners and mitigations.

## Sprint 3 Velocity & Progress Snapshot
- **Sprint 3 Planned Tasks:** 30 across 5 roles (`8` Developer, `6` DB Admin, `6` Tester, `5` UI/UX Designer, `5` Scrum Master).
- **Completion Rule (`Summary` sheet):** A task counts as `Merged` once its PR is reviewed and merged into `main`.
- **Current Velocity Breakdown:**
  - **Developer (`S3-DEV-01`–`S3-DEV-08`):** 8/8 task branches implemented and pushed (`src/assets/js/hr-module.js`); pending PR review/merge into `main` and UI screen integration.
  - **DB Admin (`S3-DBA-01`–`S3-DBA-06`):** 6/6 task branches created and pushed (current job/dept view, unique effective date guard, `app_user.empno` link, child-record delete checks, idempotent HR seed data, HR indexes & backup/restore script); pending PR review/merge and target DB execution.
  - **Scrum Master (`S3-SM-01`–`S3-SM-05`):** Planning notes/board (`S3-SM-01`), Sprint 2 carryover re-prioritization (`S3-SM-02`), and mid-sprint check/impediment log (`S3-SM-03`) branched/documented; velocity & Sprint 4 risk register (`S3-SM-04`) active; review/retro (`S3-SM-05`) next.
  - **UI/UX Designer (`S3-UIX-01`–`S3-UIX-05`):** Pending/not yet completed; active dependency for screen wiring and usability walkthroughs.
  - **Tester (`S3-TST-01`–`S3-TST-06`):** Pending/not yet executed; dependent on merged code/migrations and UI screen readiness.

## Sprint 4 Risk Register

| Risk ID | Risk Description | Likelihood | Impact | Mitigation / Action Plan | Owner |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `R4-01` | Pending UI/UX screens and QA/regression backlog from Sprints 1–3 spill into Sprint 4 (Weeks 7–8) | High | High | Prioritize core Sales/Report/DB deliverables early, keep UI/QA status accurate, and scope Sprint 4 PRs tightly | Scrum Master, UI/UX Designer & Tester |
| `R4-02` | Unmerged feature branches and stashed auth/server/admin changes create merge conflicts during Sprint 4 | Medium | High | Merge completed `S3-DEV`, `S3-DBA`, and `S3-SM` PRs incrementally onto `main` and handle stashed auth/server/admin edits in a dedicated PR | Scrum Master, Developer & DB Admin |
| `R4-03` | Price-as-of-sales-date, payment balance calculations, and soft-delete rules (`S4-DEV-02`, `S4-DEV-03`, `S4-DEV-07`, `S4-DBA-01`, `S4-DBA-02`, `S4-DBA-05`) hit edge cases | Medium | High | Validate effective-date pricing queries, payment/balance math, and child/detail delete guards with realistic test scenarios early | Developer, DB Admin & Tester |
| `R4-04` | Seven Sprint 4 reports (including Active/All Employees, Employee Job History, Top Customers/Products/Sales, date range, Top N, Print/PDF) and per-report rights miss requirements | Medium | Medium | Align report query definitions (`S4-DBA-03`) with per-report permission checks and Print/PDF layouts (`S4-DEV-04`, `S4-DEV-05`, `S4-UIX-03`) | Developer, DB Admin & UI/UX Designer |
| `R4-05` | End-to-end chain (`register -> approve -> assign rights -> login -> sell -> pay -> run reports` and superadmin audit log viewer) fails late in Week 8 | Medium | High | Run incremental integration smoke checks before Week 8 Day 8–9 (`S4-TST-04`–`S4-TST-06`) and keep a clear release/demo checklist (`S4-SM-03`) | Tester, Developer & Scrum Master |
