/**
 * S4-DEV-08: Audit log viewer for superadmin.
 */

function toDateOnlyString(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function canViewAuditLog(user = {}) {
  const role = String(user?.role || user?.user_role || "").trim().toLowerCase();
  return role === "superadmin" || role === "super_admin";
}

export function normalizeAuditLogEntry(entry = {}, index = 0) {
  const timestamp = String(
    entry?.created_at ?? entry?.timestamp ?? entry?.logged_at ?? entry?.occurred_at ?? ""
  ).trim();

  return {
    id: entry?.id ?? entry?.log_id ?? `audit-${index + 1}`,
    timestamp,
    date: toDateOnlyString(timestamp),
    actor: String(
      entry?.actor ?? entry?.actor_name ?? entry?.performed_by ?? entry?.user_email ?? entry?.username ?? "system"
    ).trim(),
    action: String(entry?.action ?? entry?.event_type ?? entry?.operation ?? "").trim(),
    entity: String(entry?.entity ?? entry?.table_name ?? entry?.resource ?? entry?.target_table ?? "").trim(),
    record_id: String(entry?.record_id ?? entry?.entity_id ?? entry?.target_id ?? "").trim(),
    summary: String(entry?.summary ?? entry?.description ?? entry?.details ?? "").trim(),
  };
}

export function filterAuditLogs(logs = [], filters = {}) {
  const actorFilter = String(filters?.actor ?? "").trim().toLowerCase();
  const actionFilter = String(filters?.action ?? filters?.eventType ?? "all").trim().toLowerCase();
  const entityFilter = String(filters?.entity ?? filters?.tableName ?? "all").trim().toLowerCase();
  const searchQuery = String(filters?.search ?? filters?.query ?? "").trim().toLowerCase();
  const startDate = toDateOnlyString(filters?.startDate ?? filters?.start_date ?? "");
  const endDate = toDateOnlyString(filters?.endDate ?? filters?.end_date ?? "");

  return (logs || [])
    .map((item, idx) => normalizeAuditLogEntry(item, idx))
    .filter((row) => {
      if (actorFilter && !row.actor.toLowerCase().includes(actorFilter)) {
        return false;
      }

      if (actionFilter && actionFilter !== "all" && row.action.toLowerCase() !== actionFilter) {
        return false;
      }

      if (entityFilter && entityFilter !== "all" && row.entity.toLowerCase() !== entityFilter) {
        return false;
      }

      if (startDate && (!row.date || row.date < startDate)) {
        return false;
      }

      if (endDate && (!row.date || row.date > endDate)) {
        return false;
      }

      if (searchQuery) {
        const haystack = [
          row.actor,
          row.action,
          row.entity,
          row.record_id,
          row.summary,
          row.timestamp,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchQuery)) {
          return false;
        }
      }

      return true;
    });
}

export function buildAuditLogViewerState(user = {}, logs = [], filters = {}) {
  const authorized = canViewAuditLog(user);
  if (!authorized) {
    return {
      authorized: false,
      error: "Access denied: audit log viewer is restricted to superadmin.",
      totalCount: 0,
      rows: [],
    };
  }

  const rows = filterAuditLogs(logs, filters);
  return {
    authorized: true,
    error: null,
    totalCount: rows.length,
    rows,
  };
}
