-- S3-DBA-06 Verification: Confirm HR indexes exist on public tables

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('department', 'job', 'employee', 'jobhistory')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
