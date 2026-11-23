# S4-SM-03: Release checklist and demo script

- **Task ID:** `S4-SM-03`
- **Sprint / Week:** Sprint 4, Week 8
- **Role:** Scrum Master
- **Task (one PR):** Release checklist and demo script
- **Due (sprint day):** Day 8
- **Description:** Provides a pre-release verification checklist and a step-by-step live demo script for Hope, Inc. ERP covering auth/roles/rights, Customer/Product/HR/Sales flows, the seven reports with Print / Save as PDF, superadmin audit log viewing, and accurate status reporting where UI/UX or QA items remain pending.

## Pre-Release Checklist

### Code, Git & Configuration Hygiene
- [ ] All completed task PRs are reviewed and merged cleanly into `main` (one task per branch/PR).
- [ ] Unrelated or stashed changes (`auth-service.js`, `session-guard.js`, `supabaseClient.js`, `server.js`, `src/routes/admin.js`) are kept out of unrelated PRs and handled cleanly.
- [ ] No `.env` files, plaintext passwords, or secret/service keys are committed in the repository.

### Database & Environment Readiness
- [ ] Database migrations, views, constraints, demo/seed scripts, and backup/restore checks are verified in order.
- [ ] Role, module, and per-action permission checks (`36` rights catalogue and `View Job History` / per-report rights) are enforced on both UI controls and server/API checks.

### Functional, UI/UX & QA Verification
- [ ] Core flows (auth/registration/approval/blocking, Customer, Product & price history, HR departments/jobs/employees/job history, Sales & line items with price as of sales date, payments/balances, soft delete/restore) are verified.
- [ ] All seven reports (Product Master List, Active Employees, All Employees, Employee Job History, Top Customers, Top Products, Top Sales with date range, Top N, per-report rights, and Print / Save as PDF) and the superadmin audit log viewer are checked.
- [ ] Any UI/UX or QA/regression items still pending or incomplete are explicitly called out rather than claimed as finished.

## Demo Script

1. **Authentication, User Management & Per-Action Rights**
   - Show registration/approval/session/blocking behavior and role/right assignment (`Superadmin`, `Admin`, `User`, and module/action rights).
   - Demonstrate how menu items, actions, and server/API checks respect permissions—including restricting job history/salary visibility when `View Job History` is not granted.
2. **Master Data & HR Module (`department`, `job`, `employee`, `jobhistory`)**
   - Walk through Department and Job CRUD, Employee search/filter, create/edit, soft delete/restore & separation date, and Job History (promotion/transfer with effective date, salary, duplicate effective-date guard, and employee profile job timeline).
3. **Sales Transactions, Pricing as of Sales Date, Payments & Balances**
   - Create a sales transaction, add/edit/delete line items with unit price resolved from price history as of the sales date, record a payment, inspect transaction/customer balances, and verify soft delete/restore and child/detail delete guards.
4. **Reports (7 Reports + Print / Save as PDF) & Superadmin Audit Log**
   - Run sample reports across master/HR and Top Customers/Products/Sales (with date range, Top N, per-report rights, and Print / Save as PDF).
   - Open the superadmin audit log viewer to show recorded changes.
5. **Honest Status & Open Follow-Ups**
   - Close by clearly stating which deliverables are merged/verified versus any UI/UX, QA/regression, or integration follow-ups still in progress.
