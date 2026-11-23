-- S3-DBA-01 Verification: View existence and current assignment selection

SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'v_employee_current_assignment';

SELECT
  empno,
  lastname,
  firstname,
  current_jobcode,
  current_jobdesc,
  current_deptcode,
  current_deptname,
  current_effdate
FROM v_employee_current_assignment
ORDER BY empno
LIMIT 10;
