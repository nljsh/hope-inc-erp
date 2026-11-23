# S2-UIX-03: Hi-Fi Mockup Specs & Developer Handoff Notes

- **Task ID:** `S2-UIX-03`
- **Sprint:** Sprint 2 (Week 3)
- **Role:** UI/UX Designer
- **Design System:** Hope Enterprise Obsidian Editorial (`src/assets/css/styles.css` & `dashboard.css`)
- **Scope:** Customer Lifecycle (`S2-DEV-01`–`03`), Product Catalog (`S2-DEV-04`–`06`), Price History (`S2-DEV-07`), and Per-Action Rights (`S2-DEV-08`)

---

## 1. Visual Design Tokens (`:root` in `styles.css`)

### Color Palette

| Token               | Hex Value | Usage                                                            |
| :------------------ | :-------- | :--------------------------------------------------------------- |
| `--bg-canvas`       | `#0E0E11` | Primary viewport background, primary CTA text                    |
| `--bg-card`         | `#14151A` | Elevated cards, modals, `.operator-pill`, table containers       |
| `--bg-input`        | `#1B1C22` | Text inputs, `<select>` dropdowns, search fields                 |
| `--border-hairline` | `#23252C` | 1px structural dividers, sidebar border, table row rules         |
| `--border-focus`    | `#3D414D` | Input `:focus` ring, hover states on secondary buttons           |
| `--text-primary`    | `#F3F4F6` | Page headings, primary table cells, active labels                |
| `--text-secondary`  | `#9CA3AF` | Body copy, subtitles, `.operator-pill` text                      |
| `--text-muted`      | `#6B7280` | `.sidebar-section-label`, timestamps, archived/historical badges |
| `--accent-emerald`  | `#34D399` | Verified operator indicator, `Active` / `Current` price status   |
| `--cta-bg`          | `#FFFFFF` | High-contrast primary action buttons (`+ Add Customer`, `Save`)  |
| `--cta-text`        | `#0E0E11` | Primary button label text                                        |

### Typography & Hierarchy

- **Display / Editorial Serif (`--font-serif`):** `'Instrument Serif', Georgia, serif` — Used for module titles (`2rem`–`2.25rem`, regular weight) and brand wordmark.
- **UI / Ledger Sans (`--font-sans`):** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` — Used for controls, forms, and tabular data (`tabular-nums` recommended for `custno`, `prodno`, dates, and currency amounts).
- **Micro-Labels / Overlines:** `0.66rem`–`0.70rem`, uppercase, `letter-spacing: 0.14em`–`0.16em`, `font-weight: 500`.

---

## 2. Layout & Spacing Specs (`dashboard.css`)

- **Workspace Shell (`.workspace-shell`):** `max-width: 1200px`, centered (`margin: 0 auto`), `padding: 2.5rem 2rem 4rem`, CSS Grid `grid-template-columns: 230px 1fr`, `gap: 3rem`.
- **Sidebar (`.workspace-sidebar`):** `230px` fixed column, `border-right: 1px solid var(--border-hairline)`, `padding-right: 1.5rem`.
- **Topbar Pill (`.operator-pill`):** `border-radius: 999px`, `padding: 0.42rem 0.85rem`, `1px solid var(--border-hairline)`, `background-color: var(--bg-card)`.

---

## 3. Component & Interaction Handoff Notes

### A. Data Tables (Customers & Products)

- **Container:** `background: var(--bg-card)`, `border: 1px solid var(--border-hairline)`, `border-radius: 8px`.
- **Header Row:** Uppercase micro-labels (`0.68rem`, `letter-spacing: 0.12em`, `--text-muted`), bottom border `1px solid var(--border-hairline)`.
- **Data Rows:** `padding: 0.875rem 1rem`, hover background `rgba(255, 255, 255, 0.02)`. Currency (`Current Price`) and dates (`effdate`) right-aligned or monospace-aligned for scannability.
- **Status Pills:**
  - `Active` / `Current`: Subtle emerald border/tint (`#34D399` at 15% opacity background, `#34D399` text).
  - `Archived` / `Historical`: Muted neutral pill (`#23252C` background, `#6B7280` text).
  - `Scheduled` (future `effdate`): Crisp hairline outline (`#3D414D` border, `#F3F4F6` text).

### B. Modals & Drawers (Create/Edit & Price History)

- **Backdrop:** `rgba(14, 14, 17, 0.78)` with `backdrop-filter: blur(4px)`.
- **Surface:** `background: var(--bg-card)`, `border: 1px solid var(--border-hairline)`, `border-radius: 10px`, `padding: 1.75rem`, max-width `480px` (Create/Edit) or `640px` (Price History).
- **Form Inputs:** `background: var(--bg-input)`, `border: 1px solid var(--border-hairline)`, `border-radius: 6px`, `padding: 0.65rem 0.85rem`, transitioning to `border-color: var(--border-focus)` on `:focus`.
- **Action Footer:** Right-aligned button group (`gap: 0.75rem`): secondary `Cancel` (`transparent` bg, `1px solid var(--border-hairline)`) + primary `Save` (`--cta-bg` `#FFFFFF`, `--cta-text` `#0E0E11`).

### C. Role-Based Action Visibility (`S2-DEV-08`)

- Remove unauthorized buttons from the DOM rather than merely disabling them so operators never see dead controls:
  - `+ Add Customer` / `+ Add Product` -> requires `.add`
  - `Edit` row action & Price History inline edit -> requires `.edit`
  - `Archive / Delete / Restore` -> requires `.delete`
