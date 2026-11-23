-- S3-DBA-01: Views/queries for employee current job and department

CREATE OR REPLACE VIEW v_employee_current_assignment AS
WITH ranked_history AS (
  SELECT
    jh.empno,
    jh.jobcode,
    jh.deptcode,
    jh.effdate,
    jh.salary,
    ROW_NUMBER() OVER (
      PARTITION BY jh.empno
      ORDER BY jh.effdate DESC, jh.jobcode DESC, jh.deptcode DESC
    ) AS rn
  FROM jobhistory jh
  WHERE COALESCE(jh.is_deleted, FALSE) = FALSE
)
SELECT
  e.empno,
  e.lastname,
  e.firstname,
  e.gender,
  e.birthdate,
  e.hiredate,
  e.sepdate,
  COALESCE(e.is_deleted, FALSE) AS is_deleted,
  CASE
    WHEN COALESCE(e.is_deleted, FALSE) = TRUE THEN 'deleted'
    WHEN e.sepdate IS NOT NULL THEN 'separated'
    ELSE 'active'
  END AS employment_status,
  rh.effdate AS current_effdate,
  rh.jobcode AS current_jobcode,
  j.jobdesc AS current_jobdesc,
  rh.deptcode AS current_deptcode,
  d.deptname AS current_deptname,
  rh.salary AS current_salary
FROM employee e
LEFT JOIN ranked_history rh
  ON rh.empno = e.empno
 AND rh.rn = 1
LEFT JOIN job j
  ON j.jobcode = rh.jobcode
 AND COALESCE(j.is_deleted, FALSE) = FALSE
LEFT JOIN department d
  ON d.deptcode = rh.deptcode
 AND COALESCE(d.is_deleted, FALSE) = FALSE
WHERE COALESCE(e.is_deleted, FALSE) = FALSE;
