SELECT table_schema, table_name
FROM information_schema.views
WHERE table_name IN ('customer_active', 'product_active')
ORDER BY table_name;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('customer', 'product', 'pricehist')
ORDER BY tablename, indexname;

SELECT
    (SELECT count(*) FROM customer WHERE NOT is_deleted) AS base_active_customers,
    (SELECT count(*) FROM customer_active)            AS view_active_customers,
    (SELECT count(*) FROM product WHERE NOT is_deleted)  AS base_active_products,
    (SELECT count(*) FROM product_active)             AS view_active_products;
