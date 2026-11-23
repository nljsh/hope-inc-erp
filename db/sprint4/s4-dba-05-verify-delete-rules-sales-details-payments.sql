-- S4-DBA-05: Verify delete rules for sales with details or payments
-- Provides a read-only verification view for sale delete eligibility and a
-- trigger guard that prevents hard-deleting sales with details or payments.

CREATE OR REPLACE VIEW public.v_sale_delete_eligibility AS
WITH detail_counts AS (
  SELECT
    d.sale_id,
    COUNT(*)::integer AS total_detail_count,
    COUNT(*) FILTER (WHERE COALESCE(d.is_deleted, false) = false)::integer AS active_detail_count
  FROM public.sale_detail d
  GROUP BY d.sale_id
),
payment_counts AS (
  SELECT
    p.sale_id,
    COUNT(*)::integer AS total_payment_count,
    COUNT(*) FILTER (
      WHERE COALESCE(p.is_void, false) = false
        AND COALESCE(LOWER(p.status), 'posted') <> 'void'
    )::integer AS active_payment_count,
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
    )::numeric(14, 2) AS active_paid_amount
  FROM public.sale_payment p
  GROUP BY p.sale_id
)
SELECT
  s.id AS sale_id,
  s.transaction_no,
  COALESCE(s.status, 'active') AS current_status,
  COALESCE(s.is_deleted, false) AS is_deleted,
  COALESCE(dc.total_detail_count, 0)::integer AS total_detail_count,
  COALESCE(dc.active_detail_count, 0)::integer AS active_detail_count,
  COALESCE(pc.total_payment_count, 0)::integer AS total_payment_count,
  COALESCE(pc.active_payment_count, 0)::integer AS active_payment_count,
  COALESCE(pc.active_paid_amount, 0)::numeric(14, 2) AS active_paid_amount,
  (
    COALESCE(dc.active_detail_count, 0) = 0
    AND COALESCE(pc.active_payment_count, 0) = 0
  ) AS can_hard_delete,
  CASE
    WHEN COALESCE(dc.active_detail_count, 0) > 0 AND COALESCE(pc.active_payment_count, 0) > 0
      THEN 'Blocked: sale has active line items and active payments (use soft delete/void workflow)'
    WHEN COALESCE(dc.active_detail_count, 0) > 0
      THEN 'Blocked: sale has active line items (remove/soft-delete line items or use soft delete)'
    WHEN COALESCE(pc.active_payment_count, 0) > 0
      THEN 'Blocked: sale has recorded payments (void payments or use soft delete workflow)'
    ELSE 'Eligible for delete check'
  END AS delete_rule_status
FROM public.sale s
LEFT JOIN detail_counts dc
  ON dc.sale_id = s.id
LEFT JOIN payment_counts pc
  ON pc.sale_id = s.id;

CREATE OR REPLACE FUNCTION public.fn_prevent_delete_sale_with_children()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_detail_count integer := 0;
  v_payment_count integer := 0;
BEGIN
  SELECT COUNT(*)::integer
    INTO v_detail_count
  FROM public.sale_detail d
  WHERE d.sale_id = OLD.id
    AND COALESCE(d.is_deleted, false) = false;

  SELECT COUNT(*)::integer
    INTO v_payment_count
  FROM public.sale_payment p
  WHERE p.sale_id = OLD.id
    AND COALESCE(p.is_void, false) = false
    AND COALESCE(LOWER(p.status), 'posted') <> 'void';

  IF v_detail_count > 0 OR v_payment_count > 0 THEN
    RAISE EXCEPTION
      'Cannot delete sale % (id=%): % active detail row(s) and % active payment(s) exist. Soft-delete or void dependent records instead.',
      COALESCE(OLD.transaction_no, ''),
      OLD.id,
      v_detail_count,
      v_payment_count;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_sale_with_children ON public.sale;

CREATE TRIGGER trg_prevent_delete_sale_with_children
BEFORE DELETE ON public.sale
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_delete_sale_with_children();
