-- S4-DBA-02: Payment balance view
-- Computes per-transaction and per-customer payment balances while
-- excluding soft-deleted sales and voided payments.

CREATE OR REPLACE VIEW public.v_sale_payment_balances AS
WITH line_totals AS (
  SELECT
    d.sale_id,
    ROUND(
      COALESCE(
        SUM(
          CASE
            WHEN COALESCE(d.is_deleted, false) = false
              THEN COALESCE(d.quantity, 0)::numeric * COALESCE(d.unit_price, 0)::numeric
            ELSE 0::numeric
          END
        ),
        0::numeric
      ),
      2
    )::numeric(14, 2) AS sale_total
  FROM public.sale_detail d
  GROUP BY d.sale_id
),
payment_totals AS (
  SELECT
    p.sale_id,
    ROUND(
      COALESCE(
        SUM(
          CASE
            WHEN COALESCE(p.is_void, false) = false
              AND COALESCE(LOWER(p.status), 'posted') <> 'void'
              THEN COALESCE(p.amount, p.payment_amount, 0)::numeric
            ELSE 0::numeric
          END
        ),
        0::numeric
      ),
      2
    )::numeric(14, 2) AS total_paid,
    COUNT(*) FILTER (
      WHERE COALESCE(p.is_void, false) = false
        AND COALESCE(LOWER(p.status), 'posted') <> 'void'
    )::integer AS payment_count,
    MAX(COALESCE(p.payment_date, p.created_at::date)) FILTER (
      WHERE COALESCE(p.is_void, false) = false
        AND COALESCE(LOWER(p.status), 'posted') <> 'void'
    ) AS last_payment_date
  FROM public.sale_payment p
  GROUP BY p.sale_id
)
SELECT
  s.id AS sale_id,
  s.transaction_no,
  s.sale_date,
  s.customer_id,
  s.salesperson_id,
  COALESCE(lt.sale_total, s.total_amount, 0)::numeric(14, 2) AS sale_total,
  COALESCE(pt.total_paid, 0)::numeric(14, 2) AS total_paid,
  GREATEST(
    ROUND(
      (COALESCE(lt.sale_total, s.total_amount, 0)::numeric - COALESCE(pt.total_paid, 0)::numeric),
      2
    ),
    0::numeric
  )::numeric(14, 2) AS balance_due,
  COALESCE(pt.payment_count, 0)::integer AS payment_count,
  pt.last_payment_date,
  CASE
    WHEN COALESCE(lt.sale_total, s.total_amount, 0) <= 0 AND COALESCE(pt.total_paid, 0) <= 0
      THEN 'unbilled'
    WHEN (COALESCE(lt.sale_total, s.total_amount, 0)::numeric - COALESCE(pt.total_paid, 0)::numeric) <= 0
      THEN 'paid'
    WHEN COALESCE(pt.total_paid, 0) > 0
      THEN 'partial'
    ELSE 'unpaid'
  END AS payment_status
FROM public.sale s
LEFT JOIN line_totals lt
  ON lt.sale_id = s.id
LEFT JOIN payment_totals pt
  ON pt.sale_id = s.id
WHERE COALESCE(s.is_deleted, false) = false
  AND COALESCE(LOWER(s.status), 'active') <> 'deleted';

CREATE OR REPLACE VIEW public.v_customer_payment_balances AS
SELECT
  c.id AS customer_id,
  COALESCE(c.name, c.customer_name, '') AS customer_name,
  COUNT(spb.sale_id)::integer AS transaction_count,
  ROUND(COALESCE(SUM(spb.sale_total), 0)::numeric, 2)::numeric(14, 2) AS total_billed,
  ROUND(COALESCE(SUM(spb.total_paid), 0)::numeric, 2)::numeric(14, 2) AS total_paid,
  ROUND(COALESCE(SUM(spb.balance_due), 0)::numeric, 2)::numeric(14, 2) AS balance_due,
  MAX(spb.last_payment_date) AS last_payment_date,
  CASE
    WHEN COALESCE(SUM(spb.sale_total), 0) <= 0 AND COALESCE(SUM(spb.total_paid), 0) <= 0
      THEN 'unbilled'
    WHEN COALESCE(SUM(spb.balance_due), 0) <= 0
      THEN 'paid'
    WHEN COALESCE(SUM(spb.total_paid), 0) > 0
      THEN 'partial'
    ELSE 'unpaid'
  END AS payment_status
FROM public.customer c
LEFT JOIN public.v_sale_payment_balances spb
  ON spb.customer_id = c.id
WHERE COALESCE(c.is_deleted, false) = false
GROUP BY
  c.id,
  c.name,
  c.customer_name;
