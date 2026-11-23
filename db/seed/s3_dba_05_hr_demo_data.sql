-- S3-DBA-05: Idempotent HR demo data for department, job, employee, and jobhistory

INSERT INTO public.department (deptcode, deptname)
VALUES
  ('ACT', 'Accounting'),
  ('BR1', 'Sales Branch 1'),
  ('BR2', 'Sales Branch 2'),
  ('EXC', 'Executive'),
  ('HRD', 'Human Resource'),
  ('IT',  'Information Tech'),
  ('PAY', 'Payroll')
ON CONFLICT (deptcode) DO UPDATE
  SET deptname = EXCLUDED.deptname;

INSERT INTO public.job (jobcode, jobdesc)
VALUES
  ('PRES', 'President'),
  ('VP',   'Vice president'),
  ('MGR',  'Manager'),
  ('SA1',  'Sales Agent 1'),
  ('SA2',  'Sales Agent 2'),
  ('SPVR', 'Supervisor'),
  ('CLK1', 'Clerk 1')
ON CONFLICT (jobcode) DO NOTHING;

INSERT INTO public.employee (empno, lastname, firstname, gender, birthdate, hiredate, sepdate)
VALUES
  ('00001', 'Smith',   'John',   'M', '1985-02-20', '2010-05-11', NULL),
  ('00003', 'Smith',   'Jane',   'F', '1990-05-16', '2010-05-11', NULL),
  ('00004', 'Reyes',   'Marco',  'M', '1988-09-12', '2015-03-01', NULL),
  ('00005', 'Santos',  'Elena',  'F', '1992-11-04', '2018-07-16', NULL),
  ('00006', 'Mendoza', 'Lucas',  'M', '1987-01-25', '2014-06-10', '2024-08-30'),
  ('00007', 'Villanueva','Mia',   'F', '1995-04-19', '2021-01-11', NULL)
ON CONFLICT (empno) DO NOTHING;

-- Ensure referenced job codes exist if older audit data used PR1/PR2
INSERT INTO public.job (jobcode, jobdesc)
VALUES
  ('PR1', 'Programmer 1'),
  ('PR2', 'Programmer 2')
ON CONFLICT (jobcode) DO NOTHING;

INSERT INTO public.jobhistory (empno, jobcode, effdate, salary, deptcode)
VALUES
  ('00001', 'PR1',  '2010-05-11', 48000.00, 'IT'),
  ('00001', 'PR2',  '2010-12-01', 50000.00, 'IT'),
  ('00003', 'CLK1', '2010-05-11', 28000.00, 'HRD'),
  ('00003', 'SPVR', '2016-01-15', 38000.00, 'HRD'),
  ('00004', 'SA1',  '2015-03-01', 26000.00, 'BR1'),
  ('00004', 'SA2',  '2019-04-01', 34000.00, 'BR2'),
  ('00005', 'CLK1', '2018-07-16', 25000.00, 'ACT'),
  ('00005', 'MGR',  '2022-02-01', 46000.00, 'ACT'),
  ('00006', 'SA1',  '2014-06-10', 24000.00, 'BR1'),
  ('00007', 'CLK1', '2021-01-11', 24500.00, 'PAY')
ON CONFLICT (empno, effdate) DO NOTHING;
