-- S3-DBA-04: Guard soft-deletes on employee, department, and job when active children exist

CREATE OR REPLACE FUNCTION public.fn_prevent_soft_delete_with_active_children()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'employee' THEN
    IF COALESCE(NEW.is_deleted, FALSE) = TRUE AND COALESCE(OLD.is_deleted, FALSE) = FALSE THEN
      IF EXISTS (
        SELECT 1
        FROM public.jobhistory jh
        WHERE jh.empno = NEW.empno
          AND COALESCE(jh.is_deleted, FALSE) = FALSE
      ) THEN
        RAISE EXCEPTION 'Cannot delete employee % while active jobhistory records exist.', NEW.empno
          USING ERRCODE = '23503';
      END IF;

      IF to_regclass('public.app_user') IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.app_user au
        WHERE au.empno = NEW.empno
          AND COALESCE(au.is_deleted, FALSE) = FALSE
      ) THEN
        RAISE EXCEPTION 'Cannot delete employee % while active app_user records exist.', NEW.empno
          USING ERRCODE = '23503';
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'department' THEN
    IF COALESCE(NEW.is_deleted, FALSE) = TRUE AND COALESCE(OLD.is_deleted, FALSE) = FALSE THEN
      IF EXISTS (
        SELECT 1
        FROM public.jobhistory jh
        WHERE jh.deptcode = NEW.deptcode
          AND COALESCE(jh.is_deleted, FALSE) = FALSE
      ) THEN
        RAISE EXCEPTION 'Cannot delete department % while active jobhistory records exist.', NEW.deptcode
          USING ERRCODE = '23503';
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'job' THEN
    IF COALESCE(NEW.is_deleted, FALSE) = TRUE AND COALESCE(OLD.is_deleted, FALSE) = FALSE THEN
      IF EXISTS (
        SELECT 1
        FROM public.jobhistory jh
        WHERE jh.jobcode = NEW.jobcode
          AND COALESCE(jh.is_deleted, FALSE) = FALSE
      ) THEN
        RAISE EXCEPTION 'Cannot delete job % while active jobhistory records exist.', NEW.jobcode
          USING ERRCODE = '23503';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employee_prevent_soft_delete_children ON public.employee;
CREATE TRIGGER trg_employee_prevent_soft_delete_children
  BEFORE UPDATE OF is_deleted ON public.employee
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_soft_delete_with_active_children();

DROP TRIGGER IF EXISTS trg_department_prevent_soft_delete_children ON public.department;
CREATE TRIGGER trg_department_prevent_soft_delete_children
  BEFORE UPDATE OF is_deleted ON public.department
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_soft_delete_with_active_children();

DROP TRIGGER IF EXISTS trg_job_prevent_soft_delete_children ON public.job;
CREATE TRIGGER trg_job_prevent_soft_delete_children
  BEFORE UPDATE OF is_deleted ON public.job
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_soft_delete_with_active_children();
