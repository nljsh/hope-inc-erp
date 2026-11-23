-- 1. Inspect active CHECK constraints on customer, product, and pricehist
SELECT conrelid::regclass AS table_name,
       conname           AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN ('customer', 'product', 'pricehist')
ORDER BY table_name, conname;

-- 2. Test valid values inside a rolled-back transaction
BEGIN;
    INSERT INTO customer (custno, custname, address, payterm)
    VALUES ('C9901', 'Valid Terms Co', 'Makati City', '30D');

    INSERT INTO product (prodcode, description, unit)
    VALUES ('VM0001', 'Valid Unit Item', 'ea');

    INSERT INTO pricehist (effdate, prodcode, unitprice)
    VALUES (DATE '2026-11-01', 'VM0001', 25.00);
ROLLBACK;

-- 3. Manual negative checks (run one at a time; both should fail with check violation)
-- INSERT INTO customer (custno, custname, address, payterm) VALUES ('C9902', 'Bad Term Co', 'Pasig', '90D');
-- INSERT INTO product  (prodcode, description, unit)          VALUES ('VM0002', 'Bad Unit Item', 'box');
