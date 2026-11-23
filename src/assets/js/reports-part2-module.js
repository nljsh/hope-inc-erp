/**
 * S4-DEV-05: Reports module, part 2:
 * Top Customers, Top Products, Top Sales
 * (date range, Top N, per-report rights, Print / Save as PDF).
 */

export const PART2_REPORT_KEYS = Object.freeze({
  TOP_CUSTOMERS: "top_customers",
  TOP_PRODUCTS: "top_products",
  TOP_SALES: "top_sales",
});

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

function isWithinDateRange(dateValue, startDate, endDate) {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);
  if (!start && !end) return true;

  const current = toDateOnlyString(dateValue);
  if (!current) return false;
  if (start && current < start) return false;
  if (end && current > end) return false;
  return true;
}

function normalizeTopN(topN, fallback = 10) {
  if (topN === null || topN === undefined || topN === "" || topN === "all") {
    return fallback;
  }
  const parsed = Number.parseInt(topN, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function roundCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function hasPart2ReportPermission(user = {}, reportKey = "") {
  const normalizedKey = String(reportKey || "").trim().toLowerCase();
  if (!normalizedKey) return false;

  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "superadmin" || role === "admin") {
    return true;
  }

  const rightsList = Array.isArray(user?.rights)
    ? user.rights
    : Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  const normalizedRights = new Set(
    rightsList.map((r) => String(r || "").trim().toLowerCase().replace(/[\s-]+/g, "_"))
  );

  if (normalizedRights.has("all_reports") || normalizedRights.has("view_all_reports")) {
    return true;
  }

  const aliasesByReport = {
    [PART2_REPORT_KEYS.TOP_CUSTOMERS]: [
      "report_top_customers",
      "top_customers",
      "view_top_customers",
    ],
    [PART2_REPORT_KEYS.TOP_PRODUCTS]: [
      "report_top_products",
      "top_products",
      "view_top_products",
    ],
    [PART2_REPORT_KEYS.TOP_SALES]: [
      "report_top_sales",
      "top_sales",
      "view_top_sales",
    ],
  };

  const candidates = aliasesByReport[normalizedKey] || [normalizedKey];
  return candidates.some((key) => normalizedRights.has(key));
}

export function buildTopCustomersReport(sales = [], options = {}) {
  const startDate = options?.startDate ?? options?.start_date ?? "";
  const endDate = options?.endDate ?? options?.end_date ?? "";
  const topN = normalizeTopN(options?.topN ?? options?.top_n, 10);

  const grouped = new Map();
  for (const sale of sales || []) {
    if (!sale || sale.is_deleted || String(sale.status || "").toLowerCase() === "void") {
      continue;
    }
    const saleDate = sale.sale_date ?? sale.transaction_date ?? sale.created_at ?? "";
    if (!isWithinDateRange(saleDate, startDate, endDate)) {
      continue;
    }

    const customerKey = String(sale.customer_id ?? sale.customer_name ?? "unknown");
    const current = grouped.get(customerKey) || {
      customer_id: sale.customer_id ?? "",
      customer_name: sale.customer_name ?? "Unknown Customer",
      order_count: 0,
      total_amount: 0,
    };

    const amount = Number(sale.total_amount ?? sale.grand_total ?? sale.amount ?? 0);
    current.order_count += 1;
    current.total_amount = roundCurrency(current.total_amount + (Number.isNaN(amount) ? 0 : amount));
    grouped.set(customerKey, current);
  }

  const rows = Array.from(grouped.values())
    .sort((a, b) => b.total_amount - a.total_amount || b.order_count - a.order_count)
    .slice(0, topN)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return {
    reportKey: PART2_REPORT_KEYS.TOP_CUSTOMERS,
    title: "Top Customers Report",
    filters: { startDate: toDateOnlyString(startDate), endDate: toDateOnlyString(endDate), topN },
    generatedAt: new Date().toISOString(),
    totalCount: rows.length,
    rows,
  };
}

export function buildTopProductsReport(saleLineItems = [], options = {}) {
  const startDate = options?.startDate ?? options?.start_date ?? "";
  const endDate = options?.endDate ?? options?.end_date ?? "";
  const topN = normalizeTopN(options?.topN ?? options?.top_n, 10);

  const grouped = new Map();
  for (const line of saleLineItems || []) {
    if (!line || line.is_deleted || line.sale_is_deleted) {
      continue;
    }
    const itemDate = line.sale_date ?? line.transaction_date ?? line.created_at ?? "";
    if (!isWithinDateRange(itemDate, startDate, endDate)) {
      continue;
    }

    const productKey = String(line.product_id ?? line.product_name ?? "unknown");
    const current = grouped.get(productKey) || {
      product_id: line.product_id ?? "",
      product_name: line.product_name ?? "Unknown Product",
      quantity_sold: 0,
      total_sales: 0,
    };

    const qty = Number(line.quantity ?? 0);
    const lineAmount =
      line.line_total !== undefined
        ? Number(line.line_total)
        : (Number.isNaN(qty) ? 0 : qty) * Number(line.unit_price ?? 0);

    current.quantity_sold = roundCurrency(current.quantity_sold + (Number.isNaN(qty) ? 0 : qty));
    current.total_sales = roundCurrency(current.total_sales + (Number.isNaN(lineAmount) ? 0 : lineAmount));
    grouped.set(productKey, current);
  }

  const rows = Array.from(grouped.values())
    .sort((a, b) => b.total_sales - a.total_sales || b.quantity_sold - a.quantity_sold)
    .slice(0, topN)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return {
    reportKey: PART2_REPORT_KEYS.TOP_PRODUCTS,
    title: "Top Products Report",
    filters: { startDate: toDateOnlyString(startDate), endDate: toDateOnlyString(endDate), topN },
    generatedAt: new Date().toISOString(),
    totalCount: rows.length,
    rows,
  };
}

export function buildTopSalesReport(sales = [], options = {}) {
  const startDate = options?.startDate ?? options?.start_date ?? "";
  const endDate = options?.endDate ?? options?.end_date ?? "";
  const topN = normalizeTopN(options?.topN ?? options?.top_n, 10);

  const filtered = (sales || [])
    .filter((sale) => {
      if (!sale || sale.is_deleted || String(sale.status || "").toLowerCase() === "void") {
        return false;
      }
      const saleDate = sale.sale_date ?? sale.transaction_date ?? sale.created_at ?? "";
      return isWithinDateRange(saleDate, startDate, endDate);
    })
    .map((sale) => ({
      transaction_no: sale.transaction_no ?? sale.sale_no ?? sale.id ?? "",
      sale_date: toDateOnlyString(sale.sale_date ?? sale.transaction_date ?? sale.created_at ?? ""),
      customer_name: sale.customer_name ?? "",
      salesperson_name: sale.salesperson_name ?? "",
      total_amount: roundCurrency(sale.total_amount ?? sale.grand_total ?? sale.amount ?? 0),
    }))
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, topN)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return {
    reportKey: PART2_REPORT_KEYS.TOP_SALES,
    title: "Top Sales Report",
    filters: { startDate: toDateOnlyString(startDate), endDate: toDateOnlyString(endDate), topN },
    generatedAt: new Date().toISOString(),
    totalCount: filtered.length,
    rows: filtered,
  };
}

export function printOrSavePart2ReportAsPdf(report = {}, context = {}) {
  const user = context?.user ?? {};
  const reportKey = report?.reportKey ?? context?.reportKey ?? "";

  if (!hasPart2ReportPermission(user, reportKey)) {
    return {
      allowed: false,
      action: "print_or_save_pdf",
      reason: "Missing permission for this report.",
    };
  }

  const targetWindow = context?.targetWindow ?? (typeof window !== "undefined" ? window : null);
  const previousTitle = targetWindow?.document ? targetWindow.document.title : "";

  if (targetWindow?.document && report?.title) {
    targetWindow.document.title = `${report.title} - Hope, Inc. ERP`;
  }

  if (typeof targetWindow?.print === "function") {
    targetWindow.print();
  }

  if (targetWindow?.document && report?.title) {
    targetWindow.document.title = previousTitle;
  }

  return {
    allowed: true,
    action: "print_or_save_pdf",
    reportKey,
    title: report?.title || "",
  };
}
