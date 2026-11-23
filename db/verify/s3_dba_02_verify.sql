-- S3-DBA-02 Verification: Unique index existence and duplicate check

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'jobhistory'
  AND indexname = 'uq_jobhistory_empno_effdate';

SELECT
  empno,
  effdate,
  COUNT(*) AS entry_count
FROM jobhistory
WHERE COALESCE(is_deleted, FALSE) = FALSE
GROUP BY empno, effdate
HAVING COUNT(*) > 1;
