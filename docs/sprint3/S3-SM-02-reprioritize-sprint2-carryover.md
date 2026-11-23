# S3-SM-02: Re-prioritize any Sprint 2 carryover

- **Task ID:** `S3-SM-02`
- **Sprint / Week:** Sprint 3, Week 5
- **Role:** Scrum Master
- **Task (one PR):** Re-prioritize any Sprint 2 carryover
- **Due (sprint day):** Day 3
- **Description:** Evaluates potential Sprint 2 carryover items (Customer, Product, Price History, UI/UX, QA, and Sprint 2 ceremonies), ranks them by priority relative to Sprint 3 HR deliverables, and sets clear execution/merge order.

## Re-prioritization Criteria
1. **Unblocks Sprint 3 or Sales/Reports:** Shared auth/session/client wiring, active views, and per-action rights checks take precedence over polish.
2. **Core Domain Before Secondary States:** Core CRUD and data integrity outrank non-blocking UI polish or unverified QA passes while UI/UX and testing are still catching up.
3. **One Task, One PR:** Every carryover item stays scoped to its own branch/PR off `main`.

## Carryover Priority Matrix

### P1 — High Priority (Address Before or Alongside Sprint 3 Integration)
- **Shared Auth / Session / Client & Admin Wiring (`src/assets/js/auth-service.js`, `src/assets/js/session-guard.js`, `src/config/supabaseClient.js`, `src/server.js`, `src/routes/admin.js`):** Stabilize and isolate in its own clean PR so session guards, Supabase client config, and permission checks do not conflict with Sprint 3 HR work.
- **Sprint 2 Core Customer & Product Data / Rights (`S2-DEV-01`–`S2-DEV-08`, `S2-DBA-01`–`S2-DBA-06`):** Ensure any unmerged Customer/Product/Price History logic, active views, or per-action permission checks are verified and merged cleanly so downstream modules and regression tests (`S3-TST-05`) have a solid baseline.

### P2 — Medium Priority (Schedule Once Sprint 3 Core HR Branches Are Pushed/Merged)
- **Sprint 2 UI/UX States & Handoffs (`S2-UIX-01`–`S2-UIX-05`):** Align customer, product, and price-history screens/states (empty, error, confirm-delete) with actual merged/implemented views so UI wiring does not get reworked twice.
- **Sprint 2 Test Execution & Bug Fixes (`S2-TST-01`–`S2-TST-06`):** Run permission, soft-delete/child-check, and regression checks once the target environment has the corresponding migrations and views applied.

### P3 — Lower Priority / Defer to Backlog or Sprint 4 Window
- **Non-blocking Cosmetic Refinements & Retrospective Follow-ups (`S2-SM-04`–`S2-SM-05` carryovers):** Keep Sprint 3 focus on HR completion, PR hygiene, and unblocking integration rather than spending Week 5 cycles on minor visual tweaks.

## Action Rules for the Team
- Do **not** mix stashed/unrelated auth/server/admin edits into `S3-SM-*` or `S3-DEV-*` / `S3-DBA-*` PRs.
- Keep UI/UX and test items marked accurately until verified against real branches/screens.
- Re-check carryover status at the mid-sprint check (`S3-SM-03`).
