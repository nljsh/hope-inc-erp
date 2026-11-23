-- S3-DBA-06: Performance indexes for HR tables (department, job, employee, jobhistory)

CREATE INDEX IF NOT EXISTS idx_employee_lastname_firstname
  ON public.employee (lastname, firstname)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;

CREATE INDEX IF NOT EXISTS idx_employee_hiredate
  ON public.employee (hiredate)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;

CREATE INDEX IF NOT EXISTS idx_employee_sepdate
  ON public.employee (sepdate)
  WHERE sepdate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobhistory_empno_effdate_desc
  ON public.jobhistory (empno, effdate DESC)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;

CREATE INDEX IF NOT EXISTS idx_jobhistory_deptcode
  ON public.jobhistory (deptcode)
  WHERE deptcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobhistory_jobcode
  ON public.jobhistory (jobcode);

CREATE INDEX IF NOT EXISTS idx_department_deptname
  ON public.department (deptname)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;

CREATE INDEX IF NOT EXISTS idx_job_jobdesc
  ON public.job (jobdesc)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;
