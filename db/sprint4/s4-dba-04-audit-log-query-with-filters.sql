-- S4-DBA-04: Audit log query with filters
-- Provides a normalized view and parameterized query function for
-- filtering audit logs by actor, action, entity/table, date range, and search text.

CREATE OR REPLACE VIEW public.v_audit_logs AS
SELECT
  al.id AS audit_log_id,
  COALESCE(al.created_at, al.timestamp, al.logged_at, now()) AS occurred_at,
  COALESCE(al.created_at, al.timestamp, al.logged_at, now())::date AS event_date,
  COALESCE(al.actor, al.actor_name, al.performed_by, al.user_email, 'system')::text AS actor,
  COALESCE(al.action, al.event_type, al.operation, '')::text AS action,
  COALESCE(al.entity, al.table_name, al.resource, '')::text AS entity,
  COALESCE(al.record_id::text, al.entity_id::text, '')::text AS record_id,
  COALESCE(al.summary, al.description, al.details::text, '')::text AS summary
FROM public.audit_log al;

CREATE OR REPLACE FUNCTION public.fn_query_audit_logs(
  p_actor text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_entity text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 200
)
RETURNS TABLE (
  audit_log_id bigint,
  occurred_at timestamptz,
  event_date date,
  actor text,
  action text,
  entity text,
  record_id text,
  summary text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.audit_log_id,
    v.occurred_at,
    v.event_date,
    v.actor,
    v.action,
    v.entity,
    v.record_id,
    v.summary
  FROM public.v_audit_logs v
  WHERE (
      p_actor IS NULL
      OR btrim(p_actor) = ''
      OR LOWER(v.actor) LIKE '%' || LOWER(btrim(p_actor)) || '%'
    )
    AND (
      p_action IS NULL
      OR btrim(p_action) = ''
      OR LOWER(p_action) = 'all'
      OR LOWER(v.action) = LOWER(btrim(p_action))
    )
    AND (
      p_entity IS NULL
      OR btrim(p_entity) = ''
      OR LOWER(p_entity) = 'all'
      OR LOWER(v.entity) = LOWER(btrim(p_entity))
    )
    AND (p_start_date IS NULL OR v.event_date >= p_start_date)
    AND (p_end_date IS NULL OR v.event_date <= p_end_date)
    AND (
      p_search IS NULL
      OR btrim(p_search) = ''
      OR (
        LOWER(v.actor) LIKE '%' || LOWER(btrim(p_search)) || '%'
        OR LOWER(v.action) LIKE '%' || LOWER(btrim(p_search)) || '%'
        OR LOWER(v.entity) LIKE '%' || LOWER(btrim(p_search)) || '%'
        OR LOWER(v.record_id) LIKE '%' || LOWER(btrim(p_search)) || '%'
        OR LOWER(v.summary) LIKE '%' || LOWER(btrim(p_search)) || '%'
      )
    )
  ORDER BY v.occurred_at DESC, v.audit_log_id DESC
  LIMIT GREATEST(COALESCE(p_limit, 200), 1);
$$;
