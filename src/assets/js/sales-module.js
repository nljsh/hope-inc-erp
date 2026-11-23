/**
 * S4-DEV-01: Sales list with search and New Sale header
 * (auto-numbered transaction, customer and salesperson drop-downs).
 */

export function generateSaleTransactionNumber(existingSales = [], prefix = "SAL", date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const stamp = `${prefix}-${year}${month}${day}`;

  let maxSeq = 0;
  for (const sale of existingSales || []) {
    const code = String(sale?.transaction_no || sale?.sale_no || sale?.code || "");
    if (code.startsWith(stamp + "-")) {
      const tail = Number.parseInt(code.slice(stamp.length + 1), 10);
      if (!Number.isNaN(tail) && tail > maxSeq) {
        maxSeq = tail;
      }
    }
  }

  return `${stamp}-${String(maxSeq + 1).padStart(4, "0")}`;
}

export function filterSalesList(sales = [], query = "", filters = {}) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const statusFilter = String(filters?.status || "all").toLowerCase();
  const customerIdFilter = filters?.customerId ? String(filters.customerId) : "";
  const salespersonIdFilter = filters?.salespersonId ? String(filters.salespersonId) : "";

  return (sales || []).filter((sale) => {
    if (statusFilter !== "all") {
      const currentStatus = String(sale?.status || "active").toLowerCase();
      if (currentStatus !== statusFilter) {
        return false;
      }
    }

    if (customerIdFilter && String(sale?.customer_id ?? "") !== customerIdFilter) {
      return false;
    }

    if (salespersonIdFilter && String(sale?.salesperson_id ?? sale?.employee_id ?? "") !== salespersonIdFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      sale?.transaction_no,
      sale?.sale_no,
      sale?.customer_name,
      sale?.salesperson_name,
      sale?.notes,
      sale?.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function buildDropdownOptions(records = [], { valueKey = "id", labelKey = "name", fallbackLabel = "Unnamed" } = {}) {
  return (records || [])
    .filter((item) => item && item[valueKey] !== undefined && item[valueKey] !== null && !item.is_deleted)
    .map((item) => ({
      value: item[valueKey],
      label: String(item[labelKey] || fallbackLabel).trim(),
    }));
}

export function createNewSaleHeader(input = {}, existingSales = []) {
  const customerId = input.customer_id ?? input.customerId ?? "";
  const salespersonId = input.salesperson_id ?? input.salespersonId ?? "";
  const saleDate = input.sale_date || input.saleDate || new Date().toISOString().slice(0, 10);
  const transactionNo =
    String(input.transaction_no || input.transactionNo || "").trim() ||
    generateSaleTransactionNumber(existingSales, "SAL", new Date(`${saleDate}T00:00:00`));

  const errors = [];
  if (!String(customerId).trim()) {
    errors.push("Customer is required.");
  }
  if (!String(salespersonId).trim()) {
    errors.push("Salesperson is required.");
  }
  if (!String(saleDate).trim()) {
    errors.push("Sale date is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
    header: {
      transaction_no: transactionNo,
      customer_id: customerId,
      salesperson_id: salespersonId,
      sale_date: saleDate,
      status: "draft",
      notes: String(input.notes || "").trim(),
    },
  };
}
