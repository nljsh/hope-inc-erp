-- =====================================================================
-- S2-DBA-02: Query: current price as of a given date
-- Returns active products and their effective price on or before p_as_of_date.
-- Products with no price on or before p_as_of_date return NULL for price/effdate.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_product_price_as_of(
    p_as_of_date DATE DEFAULT (now() AT TIME ZONE 'Asia/Manila')::date
)
RETURNS TABLE (
    prodcode       VARCHAR(6),
    description    VARCHAR(30),
    unit           VARCHAR(3),
    effective_date DATE,
    unitprice      NUMERIC(10, 2)
)
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT ON (p.prodcode)
           p.prodcode,
           p.description,
           p.unit,
           ph.effdate  AS effective_date,
           ph.unitprice
    FROM product p
    LEFT JOIN pricehist ph
           ON ph.prodcode = p.prodcode
          AND NOT ph.is_deleted
          AND ph.effdate <= p_as_of_date
    WHERE NOT p.is_deleted
    ORDER BY p.prodcode, ph.effdate DESC;
$$;

-- Direct query usage example (replace :as_of_date with a DATE literal like DATE '2010-07-12')
SELECT *
FROM fn_product_price_as_of(DATE '2010-07-12')
ORDER BY prodcode;
