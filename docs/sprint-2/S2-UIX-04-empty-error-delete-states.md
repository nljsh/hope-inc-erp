# S2-UIX-04: Empty, Error & Confirm-Delete States

- **Task ID:** `S2-UIX-04`
- **Sprint:** Sprint 2 (Week 3)
- **Role:** UI/UX Designer
- **Design System:** Hope Enterprise Obsidian Editorial (`styles.css` & `dashboard.css`)
- **Modules Covered:** Customer Lifecycle (`S2-DEV-01`–`03`), Product Catalog (`S2-DEV-04`–`06`), Price History (`S2-DEV-07`)

---

## 1. Empty States

### A. Initial Empty Module (Zero Records in Database)

Displayed inside `.workspace-shell` when a ledger has no records yet:

```text
+-----------------------------------------------------------------------+

|                                                                       |
|                         [ Ledger Icon / Badge ]                       |
|                                                                       |
|                    No customers registered yet.                       |
|      Create your first client profile to begin tracking sales         |
|                ledgers and payment terms.                             |
|                                                                       |
|                        [ + Add Customer ]*                            |
|                                                                       |
+-----------------------------------------------------------------------+
* Primary CTA rendered only when user holds `.add` permission (`S2-DEV-08`).
```

- **Product Catalog Copy:** _"No products in catalog yet. Add your first SKU and unit of measure to begin managing effective prices."_ + `[ + Add Product ]*`
- **Price History Copy:** _"No price history recorded for this SKU. Add an initial effective price above to activate pricing."_
- **Styling Tokens:** Centered container (`padding: 3.5rem 1.5rem`), `background: var(--bg-card)`, `border: 1px dashed var(--border-hairline)`, heading in `var(--text-primary)`, helper copy in `var(--text-secondary)` (`max-width: 38ch`).

### B. Zero Search / Filter Results

Displayed when active search keywords or status filters (`Active` / `Archived`) match `0` rows:

- **Copy:** _"No matching records found for “[query]”. Try clearing filters or checking archived entries."_
- **Action:** Secondary button `[ Reset Filters ]` (`1px solid var(--border-hairline)`, `color: var(--text-primary)`).

---

## 2. Error & Validation States

### A. Inline Form Validation (`S2-DBA-03`)

Triggered on blur or form submit when required fields or enum constraints fail:

- **Input Border:** `border-color: #F87171` (soft coral red) replacing `var(--border-hairline)`.
- **Inline Helper Text:** `0.78rem`, `color: #FCA5A5`, positioned `0.35rem` below the field:
  - _Missing Customer Name:_ `"Customer name is required."`
  - _Invalid/Empty Payment Terms:_ `"Select a valid payment term (COD, NET15, NET30, NET60)."`
  - _Missing Product Description:_ `"Product description is required."`
  - _Invalid/Empty Unit:_ `"Select a valid unit of measure (PCS, BOX, KG, SET, MTR)."`
  - _Invalid Price / Duplicate Date:_ `"Unit price must be greater than 0.00."` / `"An entry already exists for this effective date."`

### B. Banner / Toast Error (Network, Auth, or DB Constraint Failure)

Displayed at the top of the active workspace card or modal:

- **Surface:** `background: rgba(248, 113, 113, 0.10)`, `border: 1px solid rgba(248, 113, 113, 0.35)`, `border-radius: 6px`, `padding: 0.75rem 1rem`, `color: #FECACA`.
- **Fallback Copy:** _"Unable to save changes. Please verify your connection and permissions, then try again."_

---

## 3. Confirm-Delete & Blocked-Delete States (`S2-DEV-03`, `S2-DEV-06`, `S2-DBA-04`)

### A. Standard Soft-Delete Confirmation Modal (Customers & Products)

```text
+-------------------------------------------------------+

|  Archive Customer: Acme Corporation (C-001)?      [X] |
+-------------------------------------------------------+

|  This record will be moved to Archived status and     |
|  hidden from active selection lists. Historical       |
|  ledgers remain intact and can be restored later.     |
|                                                       |
|                    [ Cancel ]   [ Archive Record ]    |
+-------------------------------------------------------+
```

- **Confirm Button Styling:** Destructive/caution fill (`background: #DC2626`, `color: #FFFFFF`) or high-contrast caution outline so operators never confuse archive/delete with a neutral save action.

### B. Hard-Delete Confirmation (Price History Entry — `S2-DEV-07`)

- **Heading:** _"Delete price entry for [Effective Date]?"_
- **Body:** _"This will permanently remove the $[Price] rate effective [Date] and recalculate the active price if applicable."_
- **Actions:** `[ Cancel ]` + `[ Delete Price Entry ]` (`#DC2626`).

### C. Blocked Delete Warning (`S2-DBA-04` Child-Record Safeguard)

Displayed when an operator attempts to delete/archive a Customer or Product that still has active dependent child records:

- **Heading:** _"Cannot Archive [Record Name]"_
- **Body:** _"This record is currently referenced by active sales or ledger entries. Resolve or reassign dependent records before archiving."_
- **Actions:** Single `[ Understood ]` button (confirm button removed so invalid state cannot be forced).
