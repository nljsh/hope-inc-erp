-- =====================================================================
-- S2-DBA-06: Search performance check and index tuning
-- Adds trigram GIN indexes (with pg_trgm) and expression/search indexes
-- for case-insensitive substring and filter queries on active customer
-- and product rows, then refreshes planner statistics.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Case-insensitive substring/search indexes for active customers
CREATE INDEX IF NOT EXISTS idx_customer_active_custname_trgm
    ON customer USING gin (lower(custname) gin_trgm_ops)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_customer_active_custno_trgm
    ON customer USING gin (lower(custno) gin_trgm_ops)
    WHERE NOT is_deleted;

-- Case-insensitive substring/search indexes for active products
CREATE INDEX IF NOT EXISTS idx_product_active_description_trgm
    ON product USING gin (lower(description) gin_trgm_ops)
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_product_active_prodcode_trgm
    ON product USING gin (lower(prodcode) gin_trgm_ops)
    WHERE NOT is_deleted;

-- Refresh planner statistics so query plans reflect current data distribution
ANALYZE customer;
ANALYZE product;
ANALYZE pricehist;
