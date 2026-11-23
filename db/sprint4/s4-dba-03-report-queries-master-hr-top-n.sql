-- S4-DBA-03: Report queries: master list, active/all employees,
-- employee job history, Top Customers/Products/Sales (date range, Top N).

-- 1. Product Master List
CREATE OR REPLACE VIEW public.v_report_product_master_list AS
SELECT
  ROW_NUMBER() OVER (ORDER BY COALESCE(p.sku, p.id::text), p.id) AS row_no,
  p.id AS product_id,
  COALESCE(p.sku, '') AS sku,
  COALESCE(p.name, '') AS product_name,
  COALESCE(p.unit, '') AS unit,
  COALESCE(p.current_price, p.unit_price, 0)::numeric(14, 2) AS current_price,
  COALESCE(p.status, CASE WHEN COALESCE(p.is_deleted, false) THEN 'deleted' ELSE 'active' END) AS status
FROM public.product p
WHERE COALESCE(p.is_deleted, false) = false;

-- 2. All Employees
CREATE OR REPLACE VIEW public.v_report_all_employees AS
SELECT
  ROW_NUMBER() OVER (ORDER BY COALESCE(e.empno, e.id::text), e.id) AS row_no,
  e.id AS employee_id,
  COALESCE(e.empno, '') AS empno,
  COALESCE(e.full_name, TRIM(CONCAT_WS(' ', e.first_name, e.last_name))) AS full_name,
  COALESCE(d.name, e.department_name, '') AS department_name,
  COALESCE(j.title, j.name, e.job_title, '') AS job_title,
  e.hire_date,
  e.separation_date,
  CASE
    WHEN COALESCE(e.is_deleted, false) = false
      AND e.separation_date IS NULL
      AND COALESCE(LOWER(e.status), 'active') NOT IN ('inactive', 'separated', 'terminated')
      THEN 'active'
    ELSE COALESCE(e.status, 'inactive')
  END AS employment_status
FROM public.employee e
LEFT JOIN public.department d
  ON d.id = e.department_id
LEFT JOIN public.job j
  ON j.id = e.job_id;

-- 3. Active Employees
CREATE OR REPLACE VIEW public.v_report_active_employees AS
SELECT
  ROW_NUMBER() OVER (ORDER BY empno, employee_id) AS row_no,
  employee_id,
  empno,
  full_name,
  department_name,
  job_title,
  hire_date,
  employment_status
FROM public.v_report_all_employees
WHERE employment_status = 'active';

-- 4. Employee Job History
CREATE OR REPLACE VIEW public.v_report_employee_job_history AS
SELECT
  ROW_NUMBER() OVER (ORDER BY COALESCE(e.empno, jh.employee_id::text), jh.effective_date DESC, jh.id DESC) AS row_no,
  jh.id AS job_history_id,
  jh.employee_id,
  COALESCE(e.empno, '') AS empno,
  COALESCE(e.full_name, TRIM(CONCAT_WS(' ', e.first_name, e.last_name))) AS employee_name,
  COALESCE(d.name, jh.department_name, '') AS department_name,
  COALESCE(j.title, j.name, jh.job_title, '') AS job_title,
  jh.effective_date,
  jh.end_date,
  COALESCE(jh.change_type, '') AS change_type
FROM public.jobhistory jh
LEFT JOIN public.employee e
  ON e.id = jh.employee_id
LEFT JOIN public.department d
  ON d.id = jh.department_id
LEFT JOIN public.job j
  ON j.id = jh.job_id;

-- 5. Top Customers (date range + Top N)
CREATE OR REPLACE FUNCTION public.fn_report_top_customers(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_top_n integer DEFAULT 10
)
RETURNS TABLE (
  rank_no bigint,
  customer_id bigint,
  customer_name text,
  order_count bigint,
  total_amount numeric(14, 2)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.total_amount), 0) DESC, COUNT(s.id) DESC, c.id) AS rank_no,
    c.id AS customer_id,
    COALESCE(c.name, c.customer_name, 'Unknown Customer')::text AS customer_name,
    COUNT(s.id) AS order_count,
    ROUND(COALESCE(SUM(s.total_amount), 0)::numeric, 2)::numeric(14, 2) AS total_amount
  FROM public.customer c
  JOIN public.sale s
    ON s.customer_id = c.id
  WHERE COALESCE(s.is_deleted, false) = false
    AND COALESCE(LOWER(s.status), 'active') <> 'void'
    AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
  GROUP BY c.id, c.name, c.customer_name
  ORDER BY total_amount DESC, order_count DESC, c.id
  LIMIT GREATEST(COALESCE(p_top_n, 10), 1);
$$;

-- 6. Top Products (date range + Top N)
CREATE OR REPLACE FUNCTION public.fn_report_top_products(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_top_n integer DEFAULT 10
)
RETURNS TABLE (
  rank_no bigint,
  product_id bigint,
  product_name text,
  quantity_sold numeric(14, 2),
  total_sales numeric(14, 2)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(SUM(COALESCE(d.quantity, 0)::numeric * COALESCE(d.unit_price, 0)::numeric), 0) DESC,
               COALESCE(SUM(d.quantity), 0) DESC,
               p.id
    ) AS rank_no,
    p.id AS product_id,
    COALESCE(p.name, p.product_name, 'Unknown Product')::text AS product_name,
    ROUND(COALESCE(SUM(d.quantity), 0)::numeric, 2)::numeric(14, 2) AS quantity_sold,
    ROUND(
      COALESCE(SUM(COALESCE(d.quantity, 0)::numeric * COALESCE(d.unit_price, 0)::numeric), 0)::numeric,
      2
    )::numeric(14, 2) AS total_sales
  FROM public.product p
  JOIN public.sale_detail d
    ON d.product_id = p.id
  JOIN public.sale s
    ON s.id = d.sale_id
  WHERE COALESCE(s.is_deleted, false) = false
    AND COALESCE(LOWER(s.status), 'active') <> 'void'
    AND COALESCE(d.is_deleted, false) = false
    AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
  GROUP BY p.id, p.name, p.product_name
  ORDER BY total_sales DESC, quantity_sold DESC, p.id
  LIMIT GREATEST(COALESCE(p_top_n, 10), 1);
$$;

-- 7. Top Sales (date range + Top N)
CREATE OR REPLACE FUNCTION public.fn_report_top_sales(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_top_n integer DEFAULT 10
)
RETURNS TABLE (
  rank_no bigint,
  sale_id bigint,
  transaction_no text,
  sale_date date,
  customer_name text,
  total_amount numeric(14, 2)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_amount, 0) DESC, s.sale_date DESC, s.id) AS rank_no,
    s.id AS sale_id,
    COALESCE(s.transaction_no, s.sale_no, s.id::text)::text AS transaction_no,
    s.sale_date,
    COALESCE(c.name, c.customer_name, 'Unknown Customer')::text AS customer_name,
    ROUND(COALESCE(s.total_amount, 0)::numeric, 2)::numeric(14, 2) AS total_amount
  FROM public.sale s
  LEFT JOIN public.customer c
    ON c.id = s.customer_id
  WHERE COALESCE(s.is_deleted, false) = false
    AND COALESCE(LOWER(s.status), 'active') <> 'void'
    AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
  ORDER BY total_amount DESC, s.sale_date DESC, s.id
  LIMIT GREATEST(COALESCE(p_top_n, 10), 1);
$$;
