/**
 * S4-DEV-03: Record payment against a transaction.
 */

function roundCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function calculateTotalPaid(payments = []) {
  const sum = (payments || []).reduce((acc, payment) => {
    if (!payment || payment.is_void || payment.voided || payment.status === "void") {
      return acc;
    }
    const amt = Number(payment.amount ?? payment.payment_amount ?? 0);
    return acc + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  return roundCurrency(sum);
}

export function calculateTransactionBalance(saleTotal = 0, payments = []) {
  const total = roundCurrency(saleTotal);
  const paid = calculateTotalPaid(payments);
  return roundCurrency(Math.max(0, total - paid));
}

export function recordTransactionPayment(payments = [], input = {}, context = {}) {
  const saleId = input.sale_id ?? input.saleId ?? context.saleId ?? context.sale_id ?? "";
  const rawAmount = Number(input.amount ?? input.payment_amount);
  const paymentDate = String(
    input.payment_date ?? input.paymentDate ?? new Date().toISOString().slice(0, 10)
  ).trim();
  const paymentMethod = String(input.payment_method ?? input.paymentMethod ?? "cash").trim();
  const referenceNo = String(input.reference_no ?? input.referenceNo ?? "").trim();
  const notes = String(input.notes ?? "").trim();
  const allowOverpayment = Boolean(context.allowOverpayment);
  const saleTotal = context.saleTotal ?? context.sale_total;

  const errors = [];
  if (!String(saleId).trim()) {
    errors.push("Sale transaction is required.");
  }
  if (Number.isNaN(rawAmount) || rawAmount <= 0) {
    errors.push("Payment amount must be greater than zero.");
  }
  if (!paymentDate) {
    errors.push("Payment date is required.");
  }
  if (!paymentMethod) {
    errors.push("Payment method is required.");
  }

  const amount = roundCurrency(rawAmount);
  const currentPaid = calculateTotalPaid(payments);

  if (saleTotal !== undefined && saleTotal !== null && !allowOverpayment) {
    const remaining = calculateTransactionBalance(saleTotal, payments);
    if (amount > remaining + 0.0001) {
      errors.push(`Payment amount (${amount.toFixed(2)}) exceeds remaining balance (${remaining.toFixed(2)}).`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      payments,
      totalPaid: currentPaid,
      remainingBalance:
        saleTotal !== undefined && saleTotal !== null
          ? calculateTransactionBalance(saleTotal, payments)
          : undefined,
    };
  }

  const paymentRecord = {
    payment_id: input.payment_id ?? input.id ?? `pay-${Date.now()}-${payments.length + 1}`,
    sale_id: saleId,
    amount,
    payment_date: paymentDate,
    payment_method: paymentMethod,
    reference_no: referenceNo,
    notes,
    status: "posted",
  };

  const nextPayments = [...payments, paymentRecord];
  const nextTotalPaid = calculateTotalPaid(nextPayments);
  const nextRemainingBalance =
    saleTotal !== undefined && saleTotal !== null
      ? calculateTransactionBalance(saleTotal, nextPayments)
      : undefined;

  return {
    valid: true,
    errors: [],
    payment: paymentRecord,
    payments: nextPayments,
    totalPaid: nextTotalPaid,
    remainingBalance: nextRemainingBalance,
    isFullyPaid: nextRemainingBalance !== undefined ? nextRemainingBalance === 0 : undefined,
  };
}
