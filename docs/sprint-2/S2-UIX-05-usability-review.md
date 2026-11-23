# S2-UIX-05: Usability Review of Built Screens (Sprint 2)

- **Task ID:** `S2-UIX-05`
- **Sprint:** Sprint 2 (Week 3)
- **Role:** UI/UX Designer
- **Reviewed Artifacts:** `index.html`, `src/pages/dashboard.html`, `src/assets/css/styles.css`, `src/assets/css/dashboard.css`, and Sprint 2 Customer/Product modules (`S2-DEV-01`–`08`)

---

## 1. Executive Summary

The built Customer Lifecycle, Product Catalog, and Price History screens establish a cohesive **Obsidian Editorial** visual identity (`Instrument Serif` + `Inter` on `#0E0E11` / `#14151A` surfaces) with clear information hierarchy and strong contrast (`#F3F4F6` primary text, `#34D399` emerald status cues). Below is a structured usability evaluation across layout, interaction feedback, accessibility, and permission clarity, along with prioritized recommendations.

---

## 2. Heuristic & UI Evaluation Findings

| ID        | Screen / Area                                | Severity                  | Finding                                                                                                                                            | Recommended Improvement                                                                                                                                  |
| :-------- | :------------------------------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UX-01** | `index.html` (Auth Footer)                   | **Low (Fixed in PR #36)** | Stray PowerShell newline artifact (`'n`) appeared below the footer rule.                                                                           | Removed literal `` `n `` between `<script>` tags so footer renders cleanly.                                                                              |
| **UX-02** | Customer & Product Lists (`S2-DEV-01`, `04`) | **Medium**                | When filtering by `Archived` / soft-deleted records (`S2-DEV-03`, `06`), active and archived rows can look visually similar at a glance.           | Apply a muted `Archived` status pill (`#23252C` bg, `#6B7280` text) and dim row opacity slightly (`0.78`) to prevent accidental edits on archived items. |
| **UX-03** | Product Catalog (`S2-DEV-08`)                | **Medium**                | Products without an effective price entry as of `CURRENT_DATE` (`S2-DBA-02`) risk showing blank cells or `$0.00`.                                  | Render an explicit muted badge (`No Active Price`) when no `effdate <= today` record exists so operators distinguish unpriced SKUs from `$0.00`.         |
| **UX-04** | Price History Modal (`S2-DEV-07`)            | **Low**                   | Operators managing multiple historical and future-dated prices need immediate clarity on which rate is currently live.                             | Highlight the single active row (`effdate <= today`, most recent) with an emerald `Current` pill and mark future dates as `Scheduled`.                   |
| **UX-05** | Create / Edit Modals (`S2-DEV-02`, `05`)     | **Low**                   | Keyboard-only navigation and focus visibility rely on subtle border shifts (`--border-hairline` `#23252C` to `--border-focus` `#3D414D`).          | Add a visible `:focus-visible` ring (`0 0 0 2px rgba(243, 244, 246, 0.25)`) on inputs, dropdowns, and modal buttons for keyboard accessibility.          |
| **UX-06** | Responsive Workspace (`dashboard.css`)       | **Medium**                | `.workspace-shell` uses a fixed two-column grid (`230px 1fr`, `gap: 3rem`), which compresses table columns on tablet/mobile viewports (`< 900px`). | Collapse `.workspace-shell` to a single-column stack below `900px` with horizontal scroll wrappers (`overflow-x: auto`) around wide ledger tables.       |

---

## 3. Sign-Off Checklist (Sprint 2 UI/UX Acceptance)

- [x] Customer List, Create/Edit (`payTerms` validation), and Soft Delete/Restore flows reviewed (`S2-UIX-01`, `S2-DEV-01`–`03`)
- [x] Product List, Create/Edit (`unit` validation), Soft Delete/Restore, and Price History CRUD reviewed (`S2-UIX-02`, `S2-DEV-04`–`07`)
- [x] Design tokens, typography, and per-action permission visibility rules verified (`S2-UIX-03`, `S2-DEV-08`)
- [x] Empty, validation error, and confirm-delete / blocked-delete states specified (`S2-UIX-04`, `S2-DBA-03`–`04`)
