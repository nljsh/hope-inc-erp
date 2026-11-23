# S3-UIX-05: Usability Review of Built Screens (Sprint 3)

- **Task ID:** `S3-UIX-05`
- **Sprint:** Sprint 3 (Week 6)
- **Role:** UI/UX Designer
- **Reviewed Scope:** Built Department, Job, Employee Directory, Employee Profile, and Job History screens (`S3-DEV-01`–`08`)

---

## 1. Executive Summary

The built Sprint 3 HR & Job History modules integrate cleanly into the `.workspace-shell` layout (`dashboard.html`), preserving the Obsidian Editorial typography and surface hierarchy established in Sprints 1–2. Below are targeted usability and visual polish findings identified during screen review.

---

## 2. Heuristic & UI Evaluation Findings

| ID         | Screen / Area                                | Severity   | Finding                                                                                                                           | Recommended Improvement                                                                                                                                          |
| :--------- | :------------------------------------------- | :--------- | :-------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UX-301** | Employee Profile (`S3-DEV-08`)               | **High**   | Users without the `View Job History` right need clear feedback rather than an unexplained blank right-hand column.                | Display a structured restricted-state card explaining that job history and salary data require the `View Job History` permission.                                |
| **UX-302** | Job History Modal (`S3-DEV-06`, `S3-DBA-02`) | **Medium** | Submitting a promotion or transfer with an `effdate` that already exists for that employee triggers a DB uniqueness error.        | Surface an inline validation message directly beneath the Effective Date input (_"An entry already exists for this effective date"_) instead of a generic alert. |
| **UX-303** | Employee Archive Flow (`S3-DEV-05`)          | **Medium** | Archiving an employee without showing the recorded `sepdate` in the directory or profile header makes tenure status ambiguous.    | Render a `Separated · YYYY-MM-DD` status badge on archived employee profiles and dim archived rows slightly in the directory list.                               |
| **UX-304** | Department & Job Delete (`S3-DBA-04`)        | **Low**    | Operators clicking Delete on a Department or Job assigned to existing employees need clear guidance on why deletion is prevented. | Show a non-destructive warning modal explaining which active/historical records reference the department or job code.                                            |
| **UX-305** | Salary & Date Formatting (`S3-DEV-07`)       | **Low**    | Varying digit lengths across historical salary entries can look misaligned down the timeline rail.                                | Enforce `font-variant-numeric: tabular-nums` and consistent two-decimal currency formatting across all timeline items.                                           |

---

## 3. Sign-Off Checklist (Sprint 3 UI/UX Acceptance)

- [x] Department and Job list + CRUD modals reviewed (`S3-UIX-01`, `S3-DEV-01`–`02`)
- [x] Employee Directory search/filters, Create/Edit form, and Soft Delete/Restore + separation date reviewed (`S3-UIX-02`, `S3-DEV-03`–`05`)
- [x] Job Timeline component, duplicate effective-date guard, and `View Job History` salary restriction verified (`S3-UIX-03`, `S3-DEV-06`–`08`)
- [x] Obsidian Editorial tokens and responsive profile grid documented (`S3-UIX-04`)
