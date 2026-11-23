# S4-DBA-06: Final DB Review — Rebuild from Migrations, Backup & Docs

- **Project:** Hope, Inc. ERP (`hope-inc-erp`)
- **Sprint / Week / Due:** Sprint 4, Week 8, Due Day 9
- **Role:** DB Admin

---

## 1. Rebuild from Migrations Runbook

1. Confirm a clean Git state and verify migration/SQL scripts are present in order without secrets or `.env` files committed.
2. Target a fresh local/staging PostgreSQL or Supabase environment before applying migrations.
3. Apply migrations and Sprint 4 SQL deliverables in sequence:
   - Base schema & HR migrations (Sprints 1–3)
   - `db/sprint4/s4-dba-01-query-sales-totals-line-amounts.sql` (`v_sale_line_amounts`, `v_sale_totals`)
   - `db/sprint4/s4-dba-02-payment-balance-view.sql` (`v_sale_payment_balances`, `v_customer_payment_balances`)
   - `db/sprint4/s4-dba-03-report-queries-master-hr-top-n.sql` (`v_report_product_master_list`, `v_report_all_employees`, `v_report_active_employees`, `v_report_employee_job_history`, `fn_report_top_customers`, `fn_report_top_products`, `fn_report_top_sales`)
   - `db/sprint4/s4-dba-04-audit-log-query-with-filters.sql` (`v_audit_logs`, `fn_query_audit_logs`)
   - `db/sprint4/s4-dba-05-verify-delete-rules-sales-details-payments.sql` (`v_sale_delete_eligibility`, `fn_prevent_delete_sale_with_children()`, `trg_prevent_delete_sale_with_children`)
4. Run smoke checks against all views, functions, and delete guard triggers to confirm zero syntax or dependency errors.

---

## 2. Backup & Snapshot Procedure

- **Pre-Change / Release Backup:** Capture a schema + data dump (`pg_dump --schema-only` and full/logical backup) before applying or promoting Sprint 4 changes to staging/production.
- **Storage & Hygiene:** Keep backups in an approved backup location outside Git (`*.sql` dumps / `.backup` archives) and never commit credentials, connection strings, or service-role keys.
- **Restore Verification:** Confirm the backup artifact is non-empty and restorable into a test database prior to sign-off.

---

## 3. Sprint 4 Database Objects & Verification Summary

| Deliverable | Objects Provided | Purpose |
| :--- | :--- | :--- |
| `S4-DBA-01` | `v_sale_line_amounts`, `v_sale_totals` | Line-level amounts and sale header totals |
| `S4-DBA-02` | `v_sale_payment_balances`, `v_customer_payment_balances` | Transaction and customer payment balances & status |
| `S4-DBA-03` | `v_report_*` views & `fn_report_top_*` functions | Master list, active/all employees, job history, Top N reports |
| `S4-DBA-04` | `v_audit_logs`, `fn_query_audit_logs` | Filtered audit log queries |
| `S4-DBA-05` | `v_sale_delete_eligibility`, `trg_prevent_delete_sale_with_children` | Delete rule verification and guard for sales with details/payments |
| `S4-DBA-06` | Final DB review runbook & checklist | Rebuild, backup, and documentation verification |

---

## 4. Final DB Review Checklist

- [x] Clean rebuild steps documented from migrations
- [x] Backup and restore verification steps documented
- [x] Sprint 4 views, report functions, audit log query, and sale delete rules documented
- [ ] Live environment rebuild & backup snapshot executed on target database (environment-dependent / pending live run)
