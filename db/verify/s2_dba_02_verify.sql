-- 1. Check products with multiple price history dates (e.g., PC0001 has 2010-05-15 and 2010-07-12)
--    Before 2010-07-12 -> 2010-05-15 price; on/after 2010-07-12 -> 2010-07-12 price
SELECT prodcode, effective_date, unitprice
FROM fn_product_price_as_of(DATE '2010-06-01')
WHERE prodcode IN ('PC0001', 'PC0002')
UNION ALL
SELECT prodcode, effective_date, unitprice
FROM fn_product_price_as_of(DATE '2010-07-12')
WHERE prodcode IN ('PC0001', 'PC0002')
ORDER BY prodcode, effective_date;

-- 2. Confirm products without a price as of a given date still appear with NULL unitprice
SELECT prodcode, description, effective_date, unitprice
FROM fn_product_price_as_of(DATE '2010-01-01')
WHERE unitprice IS NULL
ORDER BY prodcode
LIMIT 10;

-- 3. Confirm row count matches active products (product_active)
SELECT
    (SELECT count(*) FROM product_active) AS active_products,
    (SELECT count(*) FROM fn_product_price_as_of(CURRENT_DATE)) AS priced_query_rows;
