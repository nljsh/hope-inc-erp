-- S3-DBA-02: Prevent duplicate effective dates (effdate) per employee (empno) in jobhistory

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM jobhistory
    WHERE COALESCE(is_deleted, FALSE) = FALSE
    GROUP BY empno, effdate
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique index uq_jobhistory_empno_effdate: duplicate (empno, effdate) rows exist in jobhistory.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_jobhistory_empno_effdate
  ON jobhistory (empno, effdate)
  WHERE COALESCE(is_deleted, FALSE) = FALSE;
