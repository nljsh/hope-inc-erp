-- =====================================================================
-- S2-DBA-06 Verification: Inspect indexes and run EXPLAIN ANALYZE on
-- typical search queries for active customers and products.
-- =====================================================================

-- 1. Confirm indexes exist on customer and product
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('customer', 'product')
ORDER BY tablename, indexname;

-- 2. Check execution plan for active customer search by name/code
EXPLAIN (ANALYZE, BUFFERS)
SELECT custno, custname, address, payterm
FROM customer
WHERE NOT is_deleted
  AND (
      lower(custname) LIKE '%demo%'
      OR lower(custno) LIKE '%c90%'
  )
ORDER BY custno;

-- 3. Check execution plan for active product search by description/code
EXPLAIN (ANALYZE, BUFFERS)
SELECT prodcode, description, unit
FROM product
WHERE NOT is_deleted
  AND (
      lower(description) LIKE '%item%'
      OR lower(prodcode) LIKE '%dm0%'
  )
ORDER BY prodcode;
