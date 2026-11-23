# S2-TST-01: Customer Module Test Cases

- **Task ID:** `S2-TST-01`
- **Sprint / Week:** Sprint 2 / Week 3
- **Role:** Tester
- **Related Tasks:** `S2-DEV-01`, `S2-DEV-02`, `S2-DBA-01`, `S2-DBA-03`, `S2-UIX-01`, `S2-UIX-04`

---

## 1. Scope

Verify Customer list display, search and filter behavior, customer creation and editing, database validation constraints (`payTerms`), and UI empty/error states.

---

## 2. Test Cases

| Test ID     | Scenario                                             | Preconditions                                                                              | Steps                                                                                                               | Expected Result                                                                                                  | Status  |
| :---------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- | :------ |
| `TC-CUS-01` | View active customer list                            | Logged in with Customer View permission; active customers exist (`S2-DBA-01`, `S2-DBA-05`) | 1. Navigate to the **Customer** module.                                                                             | Active customers display with accurate columns; soft-deleted customers do not appear in the default active list. | Pending |
| `TC-CUS-02` | Search customer by name/code                         | Multiple customers exist in DB                                                             | 1. Enter a partial customer name or code in the search bar.<br>2. Submit or wait for live filter.                   | Only matching active customers are displayed.                                                                    | Pending |
| `TC-CUS-03` | Filter customers (e.g., payment terms / status)      | Customers with varied attributes exist                                                     | 1. Apply a filter option in the Customer list.<br>2. Clear/reset filter.                                            | Filtered results match selected criteria; clearing restores the full active list.                                | Pending |
| `TC-CUS-04` | Empty search/filter state                            | Logged in on Customer screen                                                               | 1. Search for a non-existent string (e.g., `ZZZZ-NO-MATCH`).                                                        | Clean empty-state message renders (`S2-UIX-04`) with no console/server error.                                    | Pending |
| `TC-CUS-05` | Create new customer (valid data)                     | Logged in with Customer Add permission                                                     | 1. Click **Add Customer**.<br>2. Enter valid customer details including valid `payTerms` (`S2-DBA-03`).<br>3. Save. | Customer is saved in DB, success feedback appears, and the new record appears in the active customer list.       | Pending |
| `TC-CUS-06` | Create customer validation (missing required fields) | Logged in with Customer Add permission                                                     | 1. Open **Add Customer** form.<br>2. Leave required fields blank.<br>3. Click **Save**.                             | Form blocks submission and shows clear field-level validation errors.                                            | Pending |
| `TC-CUS-07` | Payment terms (`payTerms`) constraint check          | Logged in with Customer Add/Edit permission                                                | 1. Attempt to submit an invalid or disallowed `payTerms` value (`S2-DBA-03`).                                       | Both UI validation and DB constraint reject invalid `payTerms` with an informative error message.                | Pending |
| `TC-CUS-08` | Edit existing customer                               | Existing active customer record; user has Customer Edit permission                         | 1. Click **Edit** on a customer.<br>2. Update contact/address/`payTerms` fields.<br>3. Save.                        | Updated values persist after page reload and match database state.                                               | Pending |
