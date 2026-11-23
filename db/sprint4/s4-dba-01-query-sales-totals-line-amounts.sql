-- S4-DBA-01: Query: sales totals and line amounts
-- Computes line-level extended amounts and header-level sale totals
-- while excluding soft-deleted/voided records when present.

CREATE OR REPLACE VIEW public.v_sale_line_amounts AS
SELECT
  d.id AS sale_detail_id,
  d.sale_id,
  s.transaction_no,
  s.sale_date,
  s.customer_id,
  s.salesperson_id,
  d.product_id,
  COALESCE(d.quantity, 0)::numeric(14, 2) AS quantity,
  COALESCE(d.unit_price, 0)::numeric(14, 2) AS unit_price,
  ROUND((COALESCE(d.quantity, 0)::numeric * COALESCE(d.unit_price, 0)::numeric), 2)::numeric(14, 2) AS line_amount
FROM public.sale_detail d
JOIN public.sale s
  ON s.id = d.sale_id
WHERE COALESCE(s.is_deleted, false) = false
  AND COALESCE(LOWER(s.status), 'active') <> 'deleted'
  AND COALESCE(d.is_deleted, false) = false;

CREATE OR REPLACE VIEW public.v_sale_totals AS
SELECT
  s.id AS sale_id,
  s.transaction_no,
  s.sale_date,
  s.customer_id,
  s.salesperson_id,
  COALESCE(LOWER(s.status), 'active') AS status,
  COUNT(d.sale_detail_id)::integer AS line_count,
  COALESCE(SUM(d.quantity), 0)::numeric(14, 2) AS total_quantity,
  COALESCE(SUM(d.line_amount), 0)::numeric(14, 2) AS sale_total
FROM public.sale s
LEFT JOIN public.v_sale_line_amounts d
  ON d.sale_id = s.id
WHERE COALESCE(s.is_deleted, false) = false
  AND COALESCE(LOWER(s.status), 'active') <> 'deleted'
GROUP BY
  s.id,
  s.transaction_no,
  s.sale_date,
  s.customer_id,
  s.salesperson_id,
  s.status;
