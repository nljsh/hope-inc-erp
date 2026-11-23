/**
 * S4-DEV-07: Sales soft delete and restore with status and stamp;
 * Sale and Sale Detail rights enforced.
 */

export const SALE_RIGHTS = Object.freeze({
  SALE_VIEW: "sale_view",
  SALE_CREATE: "sale_create",
  SALE_EDIT: "sale_edit",
  SALE_DELETE: "sale_delete",
  SALE_RESTORE: "sale_restore",
  SALE_DETAIL_VIEW: "sale_detail_view",
  SALE_DETAIL_MANAGE: "sale_detail_manage",
});

function normalizeRightName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function hasSaleAccess(user = {}, action = "view", scope = "sale") {
  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "superadmin" || role === "admin") {
    return true;
  }

  const rawRights = Array.isArray(user?.rights)
    ? user.rights
    : Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  const rightsSet = new Set(rawRights.map(normalizeRightName).filter(Boolean));
  const normalizedAction = String(action || "view").trim().toLowerCase();
  const normalizedScope = String(scope || "sale").trim().toLowerCase();

  if (rightsSet.has("sales_full_access") || rightsSet.has("sale_all") || rightsSet.has("all_sales")) {
    return true;
  }

  if (normalizedScope === "sale_detail" || normalizedScope === "detail" || normalizedScope === "line_item") {
    if (normalizedAction === "view" || normalizedAction === "read") {
      return (
        rightsSet.has(SALE_RIGHTS.SALE_DETAIL_VIEW) ||
        rightsSet.has(SALE_RIGHTS.SALE_DETAIL_MANAGE) ||
        rightsSet.has(SALE_RIGHTS.SALE_VIEW)
      );
    }
    return rightsSet.has(SALE_RIGHTS.SALE_DETAIL_MANAGE) || rightsSet.has(SALE_RIGHTS.SALE_EDIT);
  }

  const byAction = {
    view: [SALE_RIGHTS.SALE_VIEW, SALE_RIGHTS.SALE_CREATE, SALE_RIGHTS.SALE_EDIT, SALE_RIGHTS.SALE_DELETE, SALE_RIGHTS.SALE_RESTORE],
    create: [SALE_RIGHTS.SALE_CREATE, "sales_create"],
    edit: [SALE_RIGHTS.SALE_EDIT, "sales_edit"],
    delete: [SALE_RIGHTS.SALE_DELETE, "sale_soft_delete", "sales_delete"],
    restore: [SALE_RIGHTS.SALE_RESTORE, SALE_RIGHTS.SALE_DELETE, "sale_soft_delete", "sales_restore"],
  };

  const allowedKeys = byAction[normalizedAction] || [SALE_RIGHTS.SALE_VIEW];
  return allowedKeys.some((key) => rightsSet.has(key));
}

function getActorLabel(user = {}) {
  return String(
    user?.username ||
      user?.email ||
      user?.full_name ||
      user?.name ||
      user?.id ||
      "system"
  ).trim();
}

export function softDeleteSale(sale = {}, context = {}) {
  const user = context?.user ?? {};
  const timestamp = String(context?.timestamp || new Date().toISOString()).trim();
  const reason = String(context?.reason || "").trim();

  if (!hasSaleAccess(user, "delete", "sale")) {
    return {
      allowed: false,
      reason: "Permission denied: missing Sale delete right.",
      sale,
    };
  }

  if (!sale || sale.is_deleted || String(sale.status || "").toLowerCase() === "deleted") {
    return {
      allowed: false,
      reason: "Sale transaction is already deleted.",
      sale,
    };
  }

  const actor = getActorLabel(user);
  const updatedSale = {
    ...sale,
    status: "deleted",
    is_deleted: true,
    deleted_at: timestamp,
    deleted_by: actor,
    delete_reason: reason || sale.delete_reason || "",
    updated_at: timestamp,
    updated_by: actor,
  };

  return {
    allowed: true,
    action: "soft_delete",
    sale: updatedSale,
    stamp: {
      status: "deleted",
      stamped_at: timestamp,
      stamped_by: actor,
    },
  };
}

export function restoreSale(sale = {}, context = {}) {
  const user = context?.user ?? {};
  const timestamp = String(context?.timestamp || new Date().toISOString()).trim();

  if (!hasSaleAccess(user, "restore", "sale")) {
    return {
      allowed: false,
      reason: "Permission denied: missing Sale restore right.",
      sale,
    };
  }

  if (!sale || (!sale.is_deleted && String(sale.status || "").toLowerCase() !== "deleted")) {
    return {
      allowed: false,
      reason: "Sale transaction is not deleted.",
      sale,
    };
  }

  const actor = getActorLabel(user);
  const restoredStatus = sale.previous_status && sale.previous_status !== "deleted"
    ? sale.previous_status
    : "active";

  const restoredSale = {
    ...sale,
    status: restoredStatus,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    restored_at: timestamp,
    restored_by: actor,
    updated_at: timestamp,
    updated_by: actor,
  };

  return {
    allowed: true,
    action: "restore",
    sale: restoredSale,
    stamp: {
      status: restoredStatus,
      stamped_at: timestamp,
      stamped_by: actor,
    },
  };
}
