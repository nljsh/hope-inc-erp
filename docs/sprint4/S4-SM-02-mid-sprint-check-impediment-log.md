# S4-SM-02: Mid-sprint check and impediment log

- **Task ID:** `S4-SM-02`
- **Sprint / Week:** Sprint 4, Week 7
- **Role:** Scrum Master
- **Task (one PR):** Mid-sprint check and impediment log
- **Due (sprint day):** Day 5
- **Description:** Records the Sprint 4 mid-sprint checkpoint across roles, logs active impediments and dependencies across Sales, Reports, Audit Log, UI/UX, QA, and PR/branch workflows, and sets concrete unblocking actions.

## Sprint 4 Mid-Sprint Checkpoint
- **Scrum Master (`S4-SM-01`–`S4-SM-05`):** Planning notes and board (`S4-SM-01`) tracked; mid-sprint check and impediment log (`S4-SM-02`) active; release checklist & demo script (`S4-SM-03`), final peer evaluations (`S4-SM-04`), and final review/retrospective/project report (`S4-SM-05`) scheduled for Week 8.
- **Developer (`S4-DEV-01`–`S4-DEV-08`):** Sales list/header/line items (price as of sales date), payments/balances, sales soft delete/restore, 7 reports with per-report rights and Print / Save as PDF, and superadmin audit log viewer scoped one PR per task; unmerged PRs/branches and UI wiring remain key coordination points.
- **DB Admin (`S4-DBA-01`–`S4-DBA-06`):** Sales totals/line amounts, payment balance view, 7 report queries, audit log filter query, sales delete rules with details/payments, and final DB rebuild/backup/docs scoped one PR per task; execution and verification depend on clean schema/migration order.
- **UI/UX Designer (`S4-UIX-01`–`S4-UIX-05`):** Sales entry/line items, payment/balance screens, 7 report screens + audit viewer, hi-fi mockups/handoff notes, and final UI consistency pass tracked transparently without overstating uncompleted work.
- **Tester (`S4-TST-01`–`S4-TST-06`):** Sales/price-as-of-date test cases, payment/balance tests, 7-report tests, end-to-end flow test (`register -> approve -> assign rights -> login -> sell -> pay -> run reports`), full regression, and final test sign-off tracked openly against actual implementation readiness.

## Impediment Log

| ID | Impediment / Risk | Impact | Owner / Target Role | Mitigation / Next Step | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S4-IMP-01` | Pending UI/UX screens and QA/testing backlog from earlier sprints or current sprint delays end-to-end screen verification | High | Scrum Master, UI/UX Designer & Tester | Keep status honest on the board, wire core logic cleanly, and run focused test passes as views and queries land | Open |
| `S4-IMP-02` | Unmerged feature branches and PR review queue across sprints can cause drift or merge conflicts | High | Scrum Master, Developer & DB Admin | Merge one PR at a time off an updated `main` branch and resolve conflicts early before Week 8 final checks | Open |
| `S4-IMP-03` | Stashed auth, session, Supabase client, server, and admin route edits remain outside active feature branches | Medium | Developer / Maintainer | Keep safely in Git stash (`git stash list`) and isolate into a dedicated branch/PR rather than mixing into unrelated tasks | Mitigated (Stashed) |
| `S4-IMP-04` | Price-as-of-sales-date, payment balance math, delete guards on sales with details/payments, and per-report rights have tight cross-role dependencies | High | Developer, DB Admin & Tester | Align query definitions, permission checks, and edge-case test scenarios before Week 8 E2E and regression runs | Open |
