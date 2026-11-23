-- =====================================================================
-- S2-DBA-03: Validation constraints (payTerms, unit)
-- Verifies and idempotently enforces allowed values for customer.payterm
-- and product.unit (plus pricehist.unitprice > 0).
-- =====================================================================

-- 1. Enforce payment terms on customer ('COD', '30D', '45D')
ALTER TABLE customer
    DROP CONSTRAINT IF EXISTS pay_ck;

ALTER TABLE customer
    ADD CONSTRAINT pay_ck
    CHECK (payterm IN ('COD', '30D', '45D'));

-- 2. Enforce unit codes on product ('pc', 'ea', 'mtr', 'pkg', 'ltr')
ALTER TABLE product
    DROP CONSTRAINT IF EXISTS unit_ck;

ALTER TABLE product
    ADD CONSTRAINT unit_ck
    CHECK (unit IN ('pc', 'ea', 'mtr', 'pkg', 'ltr'));

-- 3. Enforce positive unit price on pricehist
ALTER TABLE pricehist
    DROP CONSTRAINT IF EXISTS unitp_ck;

ALTER TABLE pricehist
    ADD CONSTRAINT unitp_ck
    CHECK (unitprice > 0);
