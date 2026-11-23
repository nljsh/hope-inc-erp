# S1-TST-01: Sprint 1 Test Plan and Acceptance Criteria

- **Task ID:** `S1-TST-01`
- **Sprint / Week:** Sprint 1 / Week 1
- **Role:** Tester
- **Project:** HOPE, Inc. ERP

---

## 1. Objective

Define the testing scope, test environments, test roles, and acceptance criteria for **Sprint 1** covering project scaffolding/database setup, authentication and password flows, User Management, role/right permission enforcement, and audit logging.

---

## 2. In-Scope Sprint 1 Deliverables

- **Project Scaffold & DB Setup (`S1-DEV-01`, `S1-DBA-01` to `S1-DBA-06`):**
  - App skeleton, environment config, database connection, and student setup README.
  - Base tables and sample data (`HopeDB_audit.sql`), `app_user` (with role and blocked flag), `role`, `module`, 36-right catalogue, `user_permission` (with soft delete), and password reset token table (hashed, expiry, used flag).
  - Seed data: one superadmin per team member, 5 rights modules (`Customer`, `Product`, `Human Resources`, `Sales`, `Reports`), 36 per-action rights, default roles, and one-time set-password flow.
  - `audit_user()` recording the logged-in user in `audit_log`.
- **Auth & Password Flows (`S1-DEV-02` to `S1-DEV-04`):**
  - User registration (new users start as `pending`).
  - Login/logout with session handling, password hashing, set-password on first login, and blocking sign-in for blocked users.
  - Reset password request, emailed token, and reset form (including expired and reused token handling).
- **User Management & Permissions (`S1-DEV-05` to `S1-DEV-08`):**
  - User Management screen: user list, Add User, Edit User, Block/Unblock; Admin manages Users only and Superadmin accounts are hidden from Admin.
  - Superadmin actions: approve pending users, designate admins, and block removing or disabling the last remaining superadmin.
  - Rights dialog: assign per-action rights by module with module checkbox and All/None; log every rights change in `audit_log`.
  - Main page sidebar and module tiles driven by role and rights, backed by server-side permission checks.
- **UI/UX References (`S1-UIX-01` to `S1-UIX-05`):**
  - Design system, wireframes, hi-fi mockups, handoff notes, and usability review fixes.

---

## 3. Test Environments & Test Accounts

- **Application URL:** `http://localhost:3000` (local Node/Express server)
- **Database:** Supabase PostgreSQL configured via `.env` / `src/config/env.local.js`
- **Browser & DevTools:** Latest desktop browser with Developer Tools (`Console`, `Network`, `Application`)
- **Test Accounts Needed:**
  - `superadmin` account(s)
  - `admin` account (registered & approved)
  - Standard `user` account (registered & approved)
  - `pending` user account (unapproved)
  - `blocked` user account

---

## 4. Acceptance Criteria Checklist

### A. Setup, Database & Audit

- [ ] Application starts cleanly and connects to the database with valid environment configuration.
- [ ] Migrations and seed data run without errors and include the 5 modules and 36 per-action rights.
- [ ] `audit_user()` records the authenticated user in `audit_log` for audited actions and rights changes.

### B. Registration, Login/Logout & Password Reset

- [ ] New registered users default to `pending` status and cannot access restricted areas before approval.
- [ ] First-time password setup works via one-time link; login and logout manage sessions properly.
- [ ] Blocked users cannot sign in.
- [ ] Password reset sends a token and updates the password; expired and already-used tokens are rejected.

### C. User Management & Role Guards

- [ ] Superadmin can approve pending users, add/edit users, block/unblock users, and designate admins.
- [ ] Admin can manage eligible users only, cannot see or edit Superadmin accounts, and cannot bypass role limits.
- [ ] The system blocks removing or disabling the last remaining Superadmin.

### D. Permission Matrix (UI + Server)

- [ ] Menu items and action buttons match each role (`superadmin`, `admin`, `user`) and assigned per-action rights.
- [ ] Server-side endpoints reject unauthorized actions even if a UI element is visible or called directly.

### E. Smoke, Regression & Bug Verification

- [ ] Automated smoke test for login and main page passes.
- [ ] All identified bugs are logged with clear reproduction steps and re-verified after fixes are merged.
