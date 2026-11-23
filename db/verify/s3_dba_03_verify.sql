-- S3-DBA-03 Verification: Foreign key linkage between app_user.empno and employee.empno

SELECT
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE c.conrelid = 'public.app_user'::regclass
  AND c.conname = 'fk_app_user_empno';

SELECT
  au.empno,
  e.empno AS matched_employee_empno,
  e.lastname,
  e.firstname
FROM public.app_user au
LEFT JOIN public.employee e
  ON e.empno = au.empno
WHERE au.empno IS NOT NULL
  AND e.empno IS NULL;
