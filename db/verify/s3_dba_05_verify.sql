-- S3-DBA-05 Verification: Check HR demo data counts and sample records

SELECT 'department' AS table_name, COUNT(*) AS row_count FROM public.department
UNION ALL
SELECT 'job'        AS table_name, COUNT(*) AS row_count FROM public.job
UNION ALL
SELECT 'employee'   AS table_name, COUNT(*) AS row_count FROM public.employee
UNION ALL
SELECT 'jobhistory' AS table_name, COUNT(*) AS row_count FROM public.jobhistory
ORDER BY table_name;

SELECT
  empno,
  jobcode,
  effdate,
  salary,
  deptcode
FROM public.jobhistory
ORDER BY empno, effdate;
