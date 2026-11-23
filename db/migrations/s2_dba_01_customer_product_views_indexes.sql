-- =====================================================================
-- S2-DBA-01: Customer and product active views, indexes
-- Target: PostgreSQL (applied after HopeDB_audit.sql baseline)
-- =====================================================================

CREATE OR REPLACE VIEW customer_active AS
SELECT *
FROM customer
WHERE NOT is_deleted;

CREATE OR REPLACE VIEW product_active AS
SELECT *
FROM product
WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_customer_active_custname
    ON customer (custname)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_customer_active_payterm
    ON customer (payterm)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_product_active_description
    ON product (description)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_product_active_unit
    ON product (unit)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_pricehist_active_prod_effdate
    ON pricehist (prodcode, effdate DESC)
    INCLUDE (unitprice)
    WHERE NOT is_deleted;
