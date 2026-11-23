# S2-UIX-02: Product Catalog & Price History Wireframes

- **Task ID:** `S2-UIX-02`
- **Sprint:** Sprint 2 (Week 3)
- **Role:** UI/UX Designer
- **Target View:** `src/pages/dashboard.html` (`data-module="products"` — _Product Catalog_)
- **Related Tasks:** `S2-DEV-04` (Product list), `S2-DEV-05` (Product create/edit), `S2-DEV-06` (Product soft delete/restore), `S2-DEV-07` (Price history CRUD), `S2-DEV-08` (Current-price display & per-action rights)

---

## 1. Module Architecture & User Flows

All Product Catalog and Price History workflows render inside `.workspace-shell` when **Product Catalog** (`data-module="products"`) is active in `.workspace-sidebar`:

1. **Product Catalog List (`S2-DEV-04`, `S2-DEV-08`)** — Searchable, filterable product table displaying the **Current Active Price** resolved as of today (`S2-DBA-02`).
2. **Create / Edit Product Modal (`S2-DEV-05`)** — Form drawer/modal enforcing valid measurement `unit` constraints (`S2-DBA-03`).
3. **Price History Modal / Drawer (`S2-DEV-07`)** — Chronological pricing ledger per product allowing operators to add, edit, or delete effective-dated unit prices.
4. **Soft Delete & Restore Flow (`S2-DEV-06`)** — Archive/restore controls with child-record checks (`S2-DBA-04`).

---

## 2. Wireframe 1: Product Catalog List (`S2-DEV-04` & `S2-DEV-08`)

```text
+---------------------------------------------------------------------------------------+

| [Hope ENTERPRISE]                                 [OPERATOR · VERIFIED]  [Sign Out]   |
+-----------------------+---------------------------------------------------------------+

| OPERATIONS LEDGER     |  PRODUCT CATALOG                             [ + Add Product ]* |
|                       |  SKU registry, unit measurements, and effective pricing.      |
|  Executive Overview   |                                                               |
|  Customer Lifecycle   |  [ Search product code or description... ]    [ Active     v ] |
| >Product Catalog      |                                                               |
|  Employee Registries  |  +---------+--------------------+------+---------------+------+ |
|  Sales Ledgers        |  | Prod No | Description        | Unit | Current Price | Act. | |
|  Reports              |  +---------+--------------------+------+---------------+------+ |
|  User Management      |  | P-001   | Industrial Valve   | PCS  | $145.00       | [..] | |
|                       |  | P-002   | Copper Piping 2m   | BOX  | $82.50        | [..] | |
|                       |  +---------+--------------------+------+---------------+------+ |
|                       |  Showing 1–2 of 18 active products          [< Prev] [Next >] |
+-----------------------+---------------------------------------------------------------+
* [+ Add Product] rendered only when user holds `product.add` permission (`S2-DEV-08`).
* Row actions `[..]`: Price History | Edit (`product.edit`) | Delete/Restore (`product.delete`).
```

### Key UX & Permission Rules

- **Current Price Column (`S2-DEV-08`, `S2-DBA-02`):** Displays the latest effective unit price (`effdate <= CURRENT_DATE`), or `No Price Set` muted badge if no historical price exists yet.
- **Per-Action Rights (`S2-DEV-08`):**
  - Hide `+ Add Product` when `product.add` is false.
  - Hide `Edit` row action when `product.edit` is false.
  - Hide `Delete / Restore` row action when `product.delete` is false.

---

## 3. Wireframe 2: Create / Edit Product Modal (`S2-DEV-05`)

```text
+-------------------------------------------------------+

|  Add Product  (or Edit Product: P-001)           [X]  |
+-------------------------------------------------------+

|  PRODUCT NUMBER (`prodno`)                            |
|  [ P-003 (Auto-assigned / Read-only on Edit)       ]  |
|                                                       |
|  DESCRIPTION *                                        |
|  [                                                 ]  |
|                                                       |
|  UNIT OF MEASURE (`unit`) *                           |
|  [ Select unit (PCS, BOX, KG, SET, MTR)          v ]  |
|                                                       |
|                      [ Cancel ]   [ Save Product ]    |
+-------------------------------------------------------+
```

### Field Validation Rules (`S2-DBA-03`)

- **Description:** Required; inline error shown if left empty.
- **Unit (`unit`):** Constrained `<select>` matching valid DB check values (`PCS`, `BOX`, `KG`, `SET`, `MTR`) so operators cannot enter arbitrary unit strings.

---

## 4. Wireframe 3: Price History Drawer / Modal (`S2-DEV-07`)

```text
+-------------------------------------------------------------------+

|  Price History — P-001: Industrial Valve                     [X]  |
+-------------------------------------------------------------------+

|  ADD / EDIT EFFECTIVE PRICE*                                      |
|  Effective Date *         Unit Price (\$) *                        |
|  [ 2026-04-01       ]     [ 150.00           ]   [ + Save Price ] |
|                                                                   |
|  HISTORICAL & SCHEDULED PRICES                                    |
|  +----------------+---------------+------------+----------------+ |
|  | Effective Date | Unit Price    | Status     | Actions        | |
|  +----------------+---------------+------------+----------------+ |
|  | 2026-04-01     | \$150.00       | Scheduled  | [Edit] [Del]*  | |
|  | 2026-01-15     | \$145.00       | Current    | [Edit] [Del]*  | |
|  | 2025-09-01     | \$138.00       | Historical | [Edit] [Del]*  | |
|  +----------------+---------------+------------+----------------+ |
|                                                       [ Close ]   |
+-------------------------------------------------------------------+
* Add/Edit/Delete controls gated by per-action price history rights (`S2-DEV-08`).
```

### Price History UX Rules

- **Status Badges:** Visually distinguishes `Current` (active price today), `Scheduled` (future `effdate`), and `Historical` (past superseded prices).
- **Duplicate Date Guard:** Prevents saving two entries with the exact same `effdate` for the same product, prompting the operator to edit the existing entry instead.
