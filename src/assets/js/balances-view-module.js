/**
 * S4-DEV-06: Balance view per transaction and customer.
 */

function roundCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

function isVoidedPayment(payment = {}) {
  return Boolean(
    !payment ||
      payment.is_void ||
      payment.voided ||
      String(payment.status || "").trim().toLowerCase() === "void"
  );
}

function isExcludedSale(sale = {}) {
  return Boolean(
    !sale ||
      sale.is_deleted ||
      String(sale.status || "").trim().toLowerCase() === "void"
  );
}

export function derivePaymentStatus(totalAmount = 0, paidAmount = 0) {
  const total = roundCurrency(totalAmount);
  const paid = roundCurrency(paidAmount);
  const balance = roundCurrency(total - paid);

  if (total <= 0 && paid <= 0) return "unbilled";
  if (balance <= 0.0001) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

export function buildTransactionBalanceRows(sales = [], payments = []) {
  const paymentsBySale = new Map();

  for (const payment of payments || []) {
    if (isVoidedPayment(payment)) continue;
    const saleKey = String(payment.sale_id ?? payment.saleId ?? payment.transaction_id ?? "").trim();
    if (!saleKey) continue;

    const amt = Number(payment.amount ?? payment.payment_amount ?? 0);
    const prev = paymentsBySale.get(saleKey) || 0;
    paymentsBySale.set(saleKey, roundCurrency(prev + (Number.isNaN(amt) ? 0 : amt)));
  }

  return (sales || [])
    .filter((sale) => !isExcludedSale(sale))
    .map((sale) => {
      const saleKey = String(sale.id ?? sale.sale_id ?? sale.transaction_no ?? "").trim();
      const totalAmount = roundCurrency(sale.total_amount ?? sale.grand_total ?? sale.amount ?? 0);
      const paidAmount = roundCurrency(paymentsBySale.get(saleKey) ?? sale.paid_amount ?? 0);
      const balanceDue = roundCurrency(Math.max(0, totalAmount - paidAmount));

      return {
        sale_id: sale.id ?? sale.sale_id ?? "",
        transaction_no: sale.transaction_no ?? sale.sale_no ?? "",
        sale_date: sale.sale_date ?? sale.transaction_date ?? "",
        customer_id: sale.customer_id ?? "",
        customer_name: sale.customer_name ?? "Unknown Customer",
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_due: balanceDue,
        payment_status: derivePaymentStatus(totalAmount, paidAmount),
      };
    });
}

export function buildCustomerBalanceRows(sales = [], payments = [], customers = []) {
  const txRows = buildTransactionBalanceRows(sales, payments);
  const customerLookup = new Map();

  for (const cust of customers || []) {
    if (!cust) continue;
    const key = String(cust.id ?? cust.customer_id ?? "").trim();
    if (key) {
      customerLookup.set(key, cust);
    }
  }

  const grouped = new Map();

  for (const row of txRows) {
    const custKey = String(row.customer_id || row.customer_name || "unknown");
    const masterCust = customerLookup.get(String(row.customer_id ?? "").trim());
    const current = grouped.get(custKey) || {
      customer_id: row.customer_id ?? "",
      customer_name:
        masterCust?.name ?? masterCust?.customer_name ?? row.customer_name ?? "Unknown Customer",
      transaction_count: 0,
      total_billed: 0,
      total_paid: 0,
      balance_due: 0,
      payment_status: "unpaid",
    };

    current.transaction_count += 1;
    current.total_billed = roundCurrency(current.total_billed + row.total_amount);
    current.total_paid = roundCurrency(current.total_paid + row.paid_amount);
    current.balance_due = roundCurrency(Math.max(0, current.total_billed - current.total_paid));
    current.payment_status = derivePaymentStatus(current.total_billed, current.total_paid);

    grouped.set(custKey, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.balance_due - a.balance_due);
}

export function filterBalanceRows(rows = [], query = "", statusFilter = "all") {
  const q = String(query || "").trim().toLowerCase();
  const normalizedStatus = String(statusFilter || "all").trim().toLowerCase();

  return (rows || []).filter((row) => {
    if (normalizedStatus !== "all") {
      if (String(row?.payment_status || "").toLowerCase() !== normalizedStatus) {
        return false;
      }
    }

    if (!q) return true;

    const searchable = [
      row?.transaction_no,
      row?.customer_name,
      row?.payment_status,
      row?.sale_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });
}
