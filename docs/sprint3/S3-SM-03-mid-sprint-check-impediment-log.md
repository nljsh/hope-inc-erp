# S3-SM-03: Mid-sprint check and impediment log

- **Task ID:** `S3-SM-03`
- **Sprint / Week:** Sprint 3, Week 5
- **Role:** Scrum Master
- **Task (one PR):** Mid-sprint check and impediment log
- **Due (sprint day):** Day 5
- **Description:** Captures the Sprint 3 mid-sprint status check across roles, logs active impediments and dependencies (such as pending UI/UX screens, pending testing, unmerged feature PRs, and stashed auth/server/admin changes), and outlines clear unblocking actions.

## Mid-Sprint Checkpoint (Sprint 3)
- **Developer (`S3-DEV-01`–`S3-DEV-08`):** HR module logic implemented and pushed on dedicated task branches; awaiting PR reviews, merge into `main`, and UI screen wiring.
- **DB Admin (`S3-DBA-01`–`S3-DBA-06`):** HR SQL migrations, seed data, verification queries, and backup/restore script created and pushed on dedicated task branches; awaiting PR reviews, merge into `main`, and execution on the target database.
- **UI/UX Designer (`S3-UIX-01`–`S3-UIX-05`):** Not yet completed/delivered; remains an active dependency for screen-level wiring and usability review.
- **Tester (`S3-TST-01`–`S3-TST-06`):** Not yet executed/completed; dependent on merged HR logic/migrations and built/wired screens.
- **Scrum Master (`S3-SM-01`–`S3-SM-05`):** Planning notes/board (`S3-SM-01`) and Sprint 2 carryover re-prioritization (`S3-SM-02`) branched/tracked; mid-sprint check (`S3-SM-03`) in progress.

## Impediment Log

| ID | Impediment / Risk | Impact | Owner / Target Role | Mitigation / Next Step | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-01` | UI/UX wireframes, job timeline component, and hi-fi screens (`S3-UIX-01`–`S3-UIX-05`) not yet in place | Delays full UI integration and screen-level walkthroughs | UI/UX Designer & Scrum Master | Track openly on board; bind core HR module logic cleanly so UI can plug in without rewriting domain/permission helpers | Open |
| `IMP-02` | HR test cases, permission/salary visibility tests, and regression tests (`S3-TST-01`–`S3-TST-06`) not yet completed | Delays formal QA sign-off and bug-fix verification | Tester & Scrum Master | Run tests once DB migrations/seed data and target UI/logic branches are available in the test environment | Open |
| `IMP-03` | Multiple `S3-DEV` and `S3-DBA` branches pushed and waiting on PR review/merge into `main` | Risk of branch drift or merge conflicts if delayed | Developer, DB Admin & Scrum Master | Review and merge one task PR at a time off an updated `main` branch | Open |
| `IMP-04` | Uncommitted edits to `auth-service.js`, `session-guard.js`, `supabaseClient.js`, `server.js`, and new `src/routes/admin.js` stashed to keep `main` clean | Could cause confusion or accidental inclusion in unrelated PRs | Developer / Maintainer | Keep safely in Git stash (`git stash list`) and handle in its own dedicated branch/PR | Mitigated (Stashed) |
