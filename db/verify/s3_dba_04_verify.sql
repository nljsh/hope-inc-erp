-- S3-DBA-04 Verification: Inspect foreign keys and soft-delete triggers for employee, department, and job

SELECT
  ref_tbl.relname AS referenced_table,
  src_tbl.relname AS referencing_table,
  c.conname AS constraint_name,
  CASE c.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE c.confdeltype::text
  END AS on_delete_action,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class src_tbl ON src_tbl.oid = c.conrelid
JOIN pg_class ref_tbl ON ref_tbl.oid = c.confrelid
WHERE c.contype = 'f'
  AND ref_tbl.relname IN ('employee', 'department', 'job')
ORDER BY referenced_table, referencing_table, constraint_name;

SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('employee', 'department', 'job')
  AND trigger_name LIKE 'trg_%_prevent_soft_delete_children'
ORDER BY table_name, trigger_name;
