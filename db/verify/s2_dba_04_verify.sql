-- =====================================================================
-- S2-DBA-04: Verify child-record delete checks for customer and product
-- Confirms customer_bu_check and product_bu_check triggers exist and
-- block soft deletes when active child rows exist, while allowing
-- soft delete + restore when no active child rows exist.
-- =====================================================================

-- 1. Confirm BEFORE UPDATE triggers for child checks are attached
SELECT tgrelid::regclass AS table_name,
       tgname            AS trigger_name,
       pg_get_triggerdef(oid) AS trigger_def
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid::regclass::text IN ('customer', 'product')
  AND tgname LIKE '%_bu_check'
ORDER BY table_name, tgname;

-- 2. Verify a customer with active sales cannot be soft-deleted
BEGIN;
    UPDATE customer
    SET is_deleted = true
    WHERE custno = (
        SELECT s.custno
        FROM sales s
        WHERE NOT s.is_deleted
        LIMIT 1
    );
ROLLBACK;

-- 3. Verify a product with active pricehist/salesdetail cannot be soft-deleted
BEGIN;
    UPDATE product
    SET is_deleted = true
    WHERE prodcode = (
        SELECT ph.prodcode
        FROM pricehist ph
        WHERE NOT ph.is_deleted
        LIMIT 1
    );
ROLLBACK;

-- 4. Verify an unreferenced customer and product CAN be soft-deleted and restored
BEGIN;
    INSERT INTO customer (custno, custname, address, payterm)
    VALUES ('C9990', 'Orphan Test Cust', 'Manila', 'COD');

    UPDATE customer SET is_deleted = true  WHERE custno = 'C9990';
    UPDATE customer SET is_deleted = false WHERE custno = 'C9990';

    INSERT INTO product (prodcode, description, unit)
    VALUES ('XM0001', 'Orphan Test Prod', 'ea');

    UPDATE product SET is_deleted = true  WHERE prodcode = 'XM0001';
    UPDATE product SET is_deleted = false WHERE prodcode = 'XM0001';
ROLLBACK;
