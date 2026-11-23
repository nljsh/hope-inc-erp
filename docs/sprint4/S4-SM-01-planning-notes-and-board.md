# S4-SM-01: Sprint 4 planning notes and board

- **Task ID:** `S4-SM-01`
- **Sprint / Week:** Sprint 4, Week 7
- **Role:** Scrum Master
- **Task (one PR):** Sprint 4 planning notes and board
- **Due (sprint day):** Day 1
- **Description:** Captures Sprint 4 planning notes, final-sprint scope across Sales, Reports, and Audit Log modules, role-by-role Sprint 4 board items, and dependency/readiness notes.

## Planning Notes & Scope
- **Sprint 4 Focus (Weeks 7–8):** Sales list/header/line items (price as of sales date), payment recording & balances, sales soft delete/restore, 7 reports (Product Master List, Active Employees, All Employees, Employee Job History, Top Customers, Top Products, Top Sales with date range, Top N, per-report rights, and Print / Save as PDF), superadmin audit log viewer, full regression/E2E testing, and final release/retrospective deliverables.
- **Branching Rule:** One task per branch, one PR per task off `main` (`Merged` = done).
- **Carryover & Readiness Notes:**
  - Keep completed Sprint 3 branches/PRs (`S3-DEV-*`, `S3-DBA-*`, `S3-SM-*`) and stashed auth/server/admin changes organized so integration and regression testing have a clear baseline.
  - Track UI/UX and QA dependencies openly without marking unverified items as done.

## Sprint 4 Board

### Scrum Master
- [ ] `S4-SM-01` (Week 7, Due Day 1): Sprint 4 planning notes and board
- [ ] `S4-SM-02` (Week 7, Due Day 5): Mid-sprint check and impediment log
- [ ] `S4-SM-03` (Week 8, Due Day 8): Release checklist and demo script
- [ ] `S4-SM-04` (Week 8, Due Day 9): Collect final peer evaluations
- [ ] `S4-SM-05` (Week 8, Due Day 10): Final review, retrospective and project report

### Developer
- [ ] `S4-DEV-01` (Week 7, Due Day 3): Sales list with search and New Sale header (auto-numbered transaction, customer and salesperson drop-downs)
- [ ] `S4-DEV-02` (Week 7, Due Day 5): Sale details: add, edit and delete line items (product, quantity); auto-fill unit price from price history as of sales date
- [ ] `S4-DEV-03` (Week 8, Due Day 6): Record payment against a transaction
- [ ] `S4-DEV-04` (Week 8, Due Day 6): Reports module, part 1: Product Master List, Active Employees, All Employees, Employee Job History (per-report rights, Print / Save as PDF)
- [ ] `S4-DEV-05` (Week 8, Due Day 7): Reports module, part 2: Top Customers, Top Products, Top Sales (date range, Top N, per-report rights, Print / Save as PDF)
- [ ] `S4-DEV-06` (Week 8, Due Day 7): Balance view per transaction and customer
- [ ] `S4-DEV-07` (Week 8, Due Day 8): Sales soft delete and restore with status and stamp; Sale and Sale Detail rights enforced
- [ ] `S4-DEV-08` (Week 8, Due Day 9): Audit log viewer for superadmin

### DB Admin
- [ ] `S4-DBA-01` (Week 7, Due Day 2): Query: sales totals and line amounts
- [ ] `S4-DBA-02` (Week 7, Due Day 4): Payment balance view
- [ ] `S4-DBA-03` (Week 7, Due Day 5): Report queries: master list, active/all employees, employee job history, Top Customers/Products/Sales (date range, Top N)
- [ ] `S4-DBA-04` (Week 8, Due Day 6): Audit log query with filters
- [ ] `S4-DBA-05` (Week 8, Due Day 7): Verify delete rules for sales with details or payments
- [ ] `S4-DBA-06` (Week 8, Due Day 9): Final DB review: rebuild from migrations, backup, docs

### UI/UX Designer
- [ ] `S4-UIX-01` (Week 7, Due Day 2): Wireframes: sales entry and line items
- [ ] `S4-UIX-02` (Week 7, Due Day 3): Wireframes: payment and balance screens
- [ ] `S4-UIX-03` (Week 7, Due Day 4): Report screens (7 reports, filters, Print / Save as PDF) and audit-viewer design
- [ ] `S4-UIX-04` (Week 7, Due Day 5): Hi-fi mockups and handoff notes
- [ ] `S4-UIX-05` (Week 8, Due Day 9): Final UI consistency and usability pass

### Tester
- [ ] `S4-TST-01` (Week 7, Due Day 5): Test cases: sales transaction and price-as-of-date
- [ ] `S4-TST-02` (Week 8, Due Day 7): Payment and balance tests
- [ ] `S4-TST-03` (Week 8, Due Day 8): Report tests: all seven reports (date range, Top N, per-report rights, Print / Save as PDF)
- [ ] `S4-TST-04` (Week 8, Due Day 8): End-to-end test: register, approve, assign rights, login, sell, pay, run reports
- [ ] `S4-TST-05` (Week 8, Due Day 9): Full regression across all modules
- [ ] `S4-TST-06` (Week 8, Due Day 9): Final test sign-off report
