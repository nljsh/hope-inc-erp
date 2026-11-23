# S3-UIX-04: Sprint 3 Hi-Fi Mockup Specs & Developer Handoff Notes

- **Task ID:** `S3-UIX-04`
- **Sprint:** Sprint 3 (Week 5)
- **Role:** UI/UX Designer
- **Design System:** Hope Enterprise Obsidian Editorial (`styles.css` & `dashboard.css`)
- **Scope:** Departments (`S3-DEV-01`), Jobs (`S3-DEV-02`), Employees (`S3-DEV-03`–`05`), and Job History Timeline (`S3-DEV-06`–`08`)

---

## 1. Obsidian Editorial Tokens Applied to HR Modules

| Element                       | CSS Token / Value                   | Specification                                                                                |
| :---------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------- |
| **Profile Header Card**       | `--bg-card` (`#14151A`)             | `1px solid var(--border-hairline)`, `border-radius: 10px`, `padding: 1.5rem 1.75rem`         |
| **Employee Name Heading**     | `--font-serif` (`Instrument Serif`) | `1.85rem`, `color: var(--text-primary)` (`#F3F4F6`), regular weight                          |
| **Active Employment Pill**    | `--accent-emerald` (`#34D399`)      | `rgba(52, 211, 153, 0.14)` fill, `1px solid rgba(52, 211, 153, 0.35)`, uppercase `0.68rem`   |
| **Separated / Archived Pill** | `--text-muted` (`#6B7280`)          | `background: #23252C`, `color: #9CA3AF`, paired with `Separation Date` metadata              |
| **Timeline Vertical Rail**    | `--border-hairline` (`#23252C`)     | `2px` vertical connector line (`left: 7px`), active node `12px` circle filled with `#34D399` |
| **Historical Timeline Node**  | `--bg-input` (`#1B1C22`)            | `12px` circle with `2px solid #3D414D` border                                                |
| **Salary & Dates**            | `--font-sans` (`Inter`)             | `font-variant-numeric: tabular-nums` for vertical alignment across timeline cards            |

---

## 2. Two-Column Employee Profile Grid

- **Desktop (`>= 960px`):** `display: grid; grid-template-columns: 320px 1fr; gap: 2rem;` inside `.workspace-shell`.
  - **Left Column:** Personal metadata, hire/separation dates, and linked `app_user` badge (`S3-DBA-03`).
  - **Right Column:** Chronological Job Timeline component (`S3-UIX-03`).
- **Tablet / Mobile (`< 960px`):** Collapses to a single-column vertical stack (`grid-template-columns: 1fr`).

---

## 3. HR Role & Per-Action Visibility Matrix (`S3-DEV-08`)

- **Strict DOM Removal:** Never render sensitive salary strings or unauthorized action buttons hidden via CSS (`display: none`); omit them from rendered markup unless the session holds the matching right:
  - `View Job History` -> Required to view timeline entries and `salary` values.
  - `Add / Edit / Delete Job History` -> Controls `[ + Record Change ]`, `[Edit]`, and `[Delete]` on timeline nodes.
  - `Add / Edit / Delete Employee, Department, Job` -> Controls module creation, edit modals, and archive/delete triggers.
