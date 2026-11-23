-- S3-DBA-01 Query: Current job and department for employees
-- Replace :empno or :deptcode as needed when running ad-hoc checks.

SELECT
  empno,
  lastname,
  firstname,
  employment_status,
  hiredate,
  sepdate,
  current_jobcode,
  current_jobdesc,
  current_deptcode,
  current_deptname,
  current_effdate,
  current_salary
FROM v_employee_current_assignment
ORDER BY empno;
