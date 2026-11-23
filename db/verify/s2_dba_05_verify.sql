-- 1. Confirm demo customers and active vs. soft-deleted state
SELECT custno, custname, payterm, is_deleted, stamp
FROM customer
WHERE custno IN ('C9001', 'C9002')
ORDER BY custno;

-- 2. Confirm demo products and active vs. soft-deleted state
SELECT prodcode, description, unit, is_deleted, stamp
FROM product
WHERE prodcode IN ('DM0001', 'DM0002', 'DM0003')
ORDER BY prodcode;

-- 3. Confirm price history rows for DM0001
SELECT effdate, prodcode, unitprice, is_deleted, stamp
FROM pricehist
WHERE prodcode = 'DM0001'
ORDER BY effdate;
