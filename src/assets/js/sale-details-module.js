/**
 * S4-DEV-02: Sale details: add, edit and delete line items (product, quantity);
 * auto-fill unit price from price history as of sales date.
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

export function resolveUnitPriceAsOfDate(priceHistory = [], productId, saleDate, fallbackPrice = 0) {
  const targetProductId = String(productId ?? "").trim();
  const targetDate = toDateOnlyString(saleDate);

  if (!targetProductId || !targetDate) {
    return Number(fallbackPrice) || 0;
  }

  const eligible = (priceHistory || [])
    .filter((entry) => {
      if (!entry || entry.is_deleted) return false;
      const entryProductId = String(entry.product_id ?? entry.productId ?? "").trim();
      const effectiveDate = toDateOnlyString(
        entry.effective_date ?? entry.effectiveDate ?? entry.start_date ?? entry.created_at
      );
      if (entryProductId !== targetProductId || !effectiveDate) {
        return false;
      }
      return effectiveDate <= targetDate;
    })
    .sort((a, b) => {
      const dateA = toDateOnlyString(a.effective_date ?? a.effectiveDate ?? a.start_date ?? a.created_at);
      const dateB = toDateOnlyString(b.effective_date ?? b.effectiveDate ?? b.start_date ?? b.created_at);
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const idA = Number(a.id ?? 0);
      const idB = Number(b.id ?? 0);
      return idB - idA;
    });

  if (eligible.length > 0) {
    const rawPrice = eligible[0].unit_price ?? eligible[0].unitPrice ?? eligible[0].price;
    const numericPrice = Number(rawPrice);
    if (!Number.isNaN(numericPrice) && numericPrice >= 0) {
      return numericPrice;
    }
  }

  return Number(fallbackPrice) || 0;
}

export function computeLineAmount(quantity, unitPrice) {
  const qty = Number(quantity);
  const price = Number(unitPrice);
  if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(price) || price < 0) {
    return 0;
  }
  return Math.round(qty * price * 100) / 100;
}

export function addSaleLineItem(lineItems = [], input = {}, context = {}) {
  const productId = input.product_id ?? input.productId ?? "";
  const quantity = Number(input.quantity);
  const saleDate = context.saleDate ?? context.sale_date ?? input.sale_date ?? "";
  const priceHistory = context.priceHistory ?? [];
  const products = context.products ?? [];

  const matchedProduct = (products || []).find(
    (p) => String(p?.id ?? p?.product_id ?? "") === String(productId)
  );
  const fallbackPrice =
    input.unit_price ??
    input.unitPrice ??
    matchedProduct?.unit_price ??
    matchedProduct?.current_price ??
    matchedProduct?.price ??
    0;

  const autoUnitPrice =
    input.unit_price !== undefined && input.unit_price !== null && input.unit_price !== "" && !input.autoPrice
      ? Number(input.unit_price)
      : resolveUnitPriceAsOfDate(priceHistory, productId, saleDate, fallbackPrice);

  const errors = [];
  if (!String(productId).trim()) {
    errors.push("Product is required.");
  }
  if (Number.isNaN(quantity) || quantity <= 0) {
    errors.push("Quantity must be greater than zero.");
  }
  if (Number.isNaN(autoUnitPrice) || autoUnitPrice < 0) {
    errors.push("Valid unit price is required.");
  }

  if (errors.length > 0) {
    return { valid: false, errors, items: lineItems };
  }

  const lineAmount = computeLineAmount(quantity, autoUnitPrice);
  const newItem = {
    line_id: input.line_id ?? input.id ?? `line-${Date.now()}-${lineItems.length + 1}`,
    product_id: productId,
    product_name: input.product_name ?? matchedProduct?.name ?? matchedProduct?.product_name ?? "",
    quantity,
    unit_price: autoUnitPrice,
    line_total: lineAmount,
  };

  return {
    valid: true,
    errors: [],
    item: newItem,
    items: [...lineItems, newItem],
  };
}

export function editSaleLineItem(lineItems = [], targetKey, patch = {}, context = {}) {
  const saleDate = context.saleDate ?? context.sale_date ?? patch.sale_date ?? "";
  const priceHistory = context.priceHistory ?? [];
  const products = context.products ?? [];

  let updatedFlag = false;
  const nextItems = (lineItems || []).map((item) => {
    const itemKey = item.line_id ?? item.id ?? item.product_id;
    if (String(itemKey) !== String(targetKey)) {
      return item;
    }

    updatedFlag = true;
    const nextProductId = patch.product_id ?? patch.productId ?? item.product_id;
    const productChanged = String(nextProductId) !== String(item.product_id);
    const matchedProduct = (products || []).find(
      (p) => String(p?.id ?? p?.product_id ?? "") === String(nextProductId)
    );

    const nextQuantity =
      patch.quantity !== undefined ? Number(patch.quantity) : Number(item.quantity);

    let nextUnitPrice;
    if (patch.unit_price !== undefined && patch.unit_price !== null && patch.unit_price !== "") {
      nextUnitPrice = Number(patch.unit_price);
    } else if (productChanged || patch.repriceAsOfSaleDate) {
      nextUnitPrice = resolveUnitPriceAsOfDate(priceHistory, nextProductId, saleDate, item.unit_price);
    } else {
      nextUnitPrice = Number(item.unit_price);
    }

    return {
      ...item,
      product_id: nextProductId,
      product_name:
        patch.product_name ??
        matchedProduct?.name ??
        matchedProduct?.product_name ??
        (productChanged ? "" : item.product_name),
      quantity: nextQuantity,
      unit_price: nextUnitPrice,
      line_total: computeLineAmount(nextQuantity, nextUnitPrice),
    };
  });

  return {
    updated: updatedFlag,
    items: nextItems,
  };
}

export function deleteSaleLineItem(lineItems = [], targetKey) {
  return (lineItems || []).filter((item) => {
    const itemKey = item.line_id ?? item.id ?? item.product_id;
    return String(itemKey) !== String(targetKey);
  });
}

export function calculateSaleTotal(lineItems = []) {
  const total = (lineItems || []).reduce((sum, item) => {
    const amount =
      item?.line_total !== undefined
        ? Number(item.line_total)
        : computeLineAmount(item?.quantity, item?.unit_price);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  return Math.round(total * 100) / 100;
}
