# S2-UIX-01: Customer Lifecycle Module Wireframes

- **Task ID:** `S2-UIX-01`
- **Sprint:** Sprint 2 (Week 3)
- **Role:** UI/UX Designer
- **Target View:** `src/pages/dashboard.html` (`data-module="customers"` — _Customer Lifecycle_)
- **Related Tasks:** `S2-DEV-01` (Customer list), `S2-DEV-02` (Create/Edit form), `S2-DEV-03` (Soft delete/restore)

---

## 1. Module Architecture & User Flows

All Customer Lifecycle workflows render inside the `.workspace-shell` main content pane when **Customer Lifecycle** (`data-module="customers"`) is active in `.workspace-sidebar`:

1. **Customer Directory (`S2-DEV-01`)** — Searchable, filterable table of active and soft-deleted customer accounts.
2. **Create / Edit Customer Modal (`S2-DEV-02`)** — Form drawer/modal with `payTerms` validation constraints (`S2-DBA-03`).
3. **Soft Delete & Restore Flow (`S2-DEV-03`)** — Permission-gated archive and restore actions with active child-record safeguards (`S2-DBA-04`).

---

## 2. Wireframe 1: Customer Directory View (`S2-DEV-01`)

```text
+---------------------------------------------------------------------------------------+

| [Hope ENTERPRISE]                                 [OPERATOR · VERIFIED]  [Sign Out]   |
+-----------------------+---------------------------------------------------------------+

| OPERATIONS LEDGER     |  CUSTOMER LIFECYCLE                          [ + Add Customer ]* |
|                       |  Unified client accounts, billing terms, and ledger status.    |
|  Executive Overview   |                                                               |
| >Customer Lifecycle   |  [ Search customer code, name, or address... ] [ Active   v ] |
|  Product Catalog      |                                                               |
|  Employee Registries  |  +---------+--------------------+----------------+-------+------+ |
|  Sales Ledgers        |  | Cust No | Customer Name      | Address        | Terms | Act. | |
|  Reports              |  +---------+--------------------+----------------+-------+------+ |
|  User Management      |  | C-001   | Acme Corporation   | 120 Main St    | NET30 | [..] | |
|                       |  | C-002   | Northstar Retail   | 45 Oak Ave     | COD   | [..] | |
|                       |  +---------+--------------------+----------------+-------+------+ |
|                       |  Showing 1–2 of 24 active records           [< Prev] [Next >] |
+-----------------------+---------------------------------------------------------------+
* [+ Add Customer] rendered only when user holds `customer.add` permission (`S2-DEV-08`).
```

### Key UX & Permission Rules

- **Search & Status Filter:** Real-time keyword filtering (`custno`, `custname`, `address`) paired with a status dropdown (`Active` default, `Deleted / Archived`, `All`).
- **Per-Action Rights (`S2-DEV-08`):**
  - Hide `+ Add Customer` button when `customer.add` is false.
  - Hide `Edit` row action when `customer.edit` is false.
  - Hide `Delete / Restore` row action when `customer.delete` is false.

---

## 3. Wireframe 2: Create / Edit Customer Modal (`S2-DEV-02`)

```text
+-------------------------------------------------------+

|  Add Customer  (or Edit Customer: C-001)         [X]  |
+-------------------------------------------------------+

|  CUSTOMER NUMBER (`custno`)                           |
|  [ C-003 (Auto-assigned / Read-only on Edit)       ]  |
|                                                       |
|  CUSTOMER NAME (`custname`) *                         |
|  [                                                 ]  |
|                                                       |
|  ADDRESS                                              |
|  [                                                 ]  |
|                                                       |
|  PAYMENT TERMS (`payTerms`) *                         |
|  [ Select valid payment terms (COD, NET15, NET30) v]  |
|                                                       |
|                     [ Cancel ]   [ Save Customer ]    |
+-------------------------------------------------------+
```

### Field Validation Rules (`S2-DBA-03`)

- **Customer Name:** Required field; highlights border and displays inline helper message if submitted empty.
- **Payment Terms (`payTerms`):** Constrained `<select>` matching valid database check constraints (`COD`, `NET15`, `NET30`, `NET60`) to prevent invalid free-text submissions.

---

## 4. Wireframe 3: Soft Delete & Restore Interaction (`S2-DEV-03`)

- **Soft Delete:** Selecting `Delete` on an active customer opens a confirmation modal. If active sales transactions reference the customer (`S2-DBA-04`), deletion is blocked with an explanatory alert; otherwise, the record is marked soft-deleted (`deleted_at`) and hidden from the default `Active` list.
- **Restore:** Filtering by `Deleted / Archived` displays soft-deleted rows with a muted `Archived` pill badge and a `Restore` action button for users with `customer.delete` rights.
