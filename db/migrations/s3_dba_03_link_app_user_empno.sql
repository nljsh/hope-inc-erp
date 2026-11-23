-- S3-DBA-03: Link app_user.empno to employee(empno)

DO $$
BEGIN
  IF to_regclass('public.app_user') IS NULL THEN
    RAISE EXCEPTION 'Table public.app_user does not exist; run Sprint 1 app_user migration first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_user'
      AND column_name = 'empno'
  ) THEN
    ALTER TABLE public.app_user
      ADD COLUMN empno VARCHAR(5);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.app_user au
    WHERE au.empno IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.employee e
        WHERE e.empno = au.empno
      )
  ) THEN
    RAISE EXCEPTION
      'Cannot add fk_app_user_empno: app_user contains empno values that do not exist in employee.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_app_user_empno'
      AND conrelid = 'public.app_user'::regclass
  ) THEN
    ALTER TABLE public.app_user
      ADD CONSTRAINT fk_app_user_empno
      FOREIGN KEY (empno)
      REFERENCES public.employee (empno)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_app_user_empno
  ON public.app_user (empno)
  WHERE empno IS NOT NULL;
