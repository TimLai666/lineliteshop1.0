const API_ORDER_STATUS_PENDING = "pending";
const API_ORDER_STATUS_IN_PROGRESS = "in_progress";
const API_ORDER_STATUS_COMPLETED = "completed";
const API_ORDER_STATUS_CANCELLED = "cancelled";

const SHEET_ORDER_STATUS_PENDING = "待處理";
const SHEET_ORDER_STATUS_IN_PROGRESS = "進行中";
const SHEET_ORDER_STATUS_COMPLETED = "已完成";
const SHEET_ORDER_STATUS_CANCELLED = "取消";

const PRODUCT_STATUS_AVAILABLE = "有現貨";
const PRODUCT_STATUS_SOLD_OUT = "已售完";
const PRODUCT_STATUS_UNAVAILABLE = "暫時無法供貨";
const PRODUCT_STATUS_UNLISTED = "下架";

const NON_SELLABLE_PRODUCT_STATUSES = [
  PRODUCT_STATUS_SOLD_OUT,
  PRODUCT_STATUS_UNAVAILABLE,
  PRODUCT_STATUS_UNLISTED,
];

function withInventoryLock(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function normalizeQuantityValue(quantity) {
  if (typeof quantity === "number") {
    return quantity;
  }

  if (typeof quantity === "string" && quantity.trim() !== "") {
    return parseInt(quantity, 10);
  }

  return NaN;
}

function normalizeNumberValue(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return 0;
}

function normalizeApiOrderStatus(status) {
  const normalized = normalizeHeaderName(status).toLowerCase();
  if (!normalized) {
    return "";
  }

  if (normalized === "pending" || normalized === SHEET_ORDER_STATUS_PENDING.toLowerCase()) {
    return API_ORDER_STATUS_PENDING;
  }

  if (
    normalized === "in_progress" ||
    normalized === "confirmed" ||
    normalized === "preparing" ||
    normalized === SHEET_ORDER_STATUS_IN_PROGRESS.toLowerCase() ||
    normalized === "已確認" ||
    normalized === "製作中"
  ) {
    return API_ORDER_STATUS_IN_PROGRESS;
  }

  if (
    normalized === "completed" ||
    normalized === "delivered" ||
    normalized === SHEET_ORDER_STATUS_COMPLETED.toLowerCase() ||
    normalized === "已送達"
  ) {
    return API_ORDER_STATUS_COMPLETED;
  }

  if (
    normalized === "cancelled" ||
    normalized === SHEET_ORDER_STATUS_CANCELLED.toLowerCase() ||
    normalized === "已取消"
  ) {
    return API_ORDER_STATUS_CANCELLED;
  }

  return "";
}

function normalizeSheetOrderStatus(status) {
  const normalized = normalizeApiOrderStatus(status);
  return normalized ? toSheetOrderStatus(normalized) : normalizeHeaderName(status);
}

function toSheetOrderStatus(status) {
  switch (normalizeApiOrderStatus(status)) {
    case API_ORDER_STATUS_PENDING:
      return SHEET_ORDER_STATUS_PENDING;
    case API_ORDER_STATUS_IN_PROGRESS:
      return SHEET_ORDER_STATUS_IN_PROGRESS;
    case API_ORDER_STATUS_COMPLETED:
      return SHEET_ORDER_STATUS_COMPLETED;
    case API_ORDER_STATUS_CANCELLED:
      return SHEET_ORDER_STATUS_CANCELLED;
    default:
      return normalizeHeaderName(status);
  }
}

function toApiOrderStatus(status) {
  const normalized = normalizeApiOrderStatus(status);
  return normalized || normalizeHeaderName(status);
}

function isCancelledStatus(status) {
  return normalizeApiOrderStatus(status) === API_ORDER_STATUS_CANCELLED;
}

function getProductSnapshot(requiredFields) {
  const headerMap = getProductHeaderMap(
    requiredFields || ["name", "price", "stock", "status"],
  );
  const values = productSheet.getDataRange().getValues();

  return {
    headerMap: headerMap,
    rows: values,
  };
}

function buildProductRecordFromRow(row, rowNumber, headerMap) {
  return {
    rowNumber: rowNumber,
    name: normalizeHeaderName(row[headerMap.name - 1]),
    price: normalizeNumberValue(row[headerMap.price - 1]),
    stock: normalizeNumberValue(row[headerMap.stock - 1]),
    status: normalizeHeaderName(row[headerMap.status - 1]),
  };
}

function findProductRecordByName(productName, productSnapshot) {
  const normalizedName = normalizeHeaderName(productName).toLowerCase();
  if (!normalizedName) {
    return null;
  }

  for (let i = 1; i < productSnapshot.rows.length; i++) {
    const record = buildProductRecordFromRow(
      productSnapshot.rows[i],
      i + 1,
      productSnapshot.headerMap,
    );

    if (record.name.toLowerCase() === normalizedName) {
      return record;
    }
  }

  return null;
}

function isProductSellable(status) {
  const normalizedStatus = normalizeHeaderName(status);
  return !NON_SELLABLE_PRODUCT_STATUSES.includes(normalizedStatus);
}

function determineProductStatusByStock(currentStatus, nextStock) {
  const normalizedStatus = normalizeHeaderName(currentStatus);
  const numericStock = normalizeNumberValue(nextStock);

  if (numericStock <= 0 && isProductSellable(normalizedStatus)) {
    return PRODUCT_STATUS_SOLD_OUT;
  }

  if (numericStock > 0 && normalizedStatus === PRODUCT_STATUS_SOLD_OUT) {
    return PRODUCT_STATUS_AVAILABLE;
  }

  return normalizedStatus;
}

function applyProductStockStatusRule(rowNumber, headerMap) {
  const resolvedHeaderMap = headerMap || getProductHeaderMap(["stock", "status"]);
  const stockRange = productSheet.getRange(rowNumber, resolvedHeaderMap.stock);
  const statusRange = productSheet.getRange(rowNumber, resolvedHeaderMap.status);

  const currentStock = normalizeNumberValue(stockRange.getValue());
  const currentStatus = normalizeHeaderName(statusRange.getValue());
  const nextStatus = determineProductStatusByStock(currentStatus, currentStock);

  if (nextStatus && nextStatus !== currentStatus) {
    statusRange.setValue(nextStatus);
  }

  return nextStatus;
}

function aggregateOrderItems(orderItems) {
  const aggregatedMap = {};
  const aggregatedItems = [];

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    throw new Error("訂單商品不能為空");
  }

  orderItems.forEach((item) => {
    const productName = normalizeHeaderName(item && item.product);
    const quantity = normalizeQuantityValue(item && item.quantity);

    if (!productName) {
      throw new Error("商品名稱不能為空");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`商品數量必須為正整數: ${productName}`);
    }

    if (!aggregatedMap[productName]) {
      aggregatedMap[productName] = {
        product: productName,
        quantity: 0,
      };
      aggregatedItems.push(aggregatedMap[productName]);
    }

    aggregatedMap[productName].quantity += quantity;
  });

  return aggregatedItems;
}

function applyInventoryMutations(journal) {
  const headerMap = getProductHeaderMap(["stock", "status"]);

  journal.forEach((mutation) => {
    productSheet.getRange(mutation.rowNumber, headerMap.stock).setValue(mutation.nextStock);
    if (mutation.nextStatus !== mutation.previousStatus) {
      productSheet.getRange(mutation.rowNumber, headerMap.status).setValue(mutation.nextStatus);
    }
  });
}

function restoreInventoryMutations(journal) {
  const headerMap = getProductHeaderMap(["stock", "status"]);

  for (let i = journal.length - 1; i >= 0; i--) {
    const mutation = journal[i];
    productSheet
      .getRange(mutation.rowNumber, headerMap.stock)
      .setValue(mutation.previousStock);
    productSheet
      .getRange(mutation.rowNumber, headerMap.status)
      .setValue(mutation.previousStatus);
  }
}

function validateAndReserveInventory(orderItems) {
  const aggregatedItems = aggregateOrderItems(orderItems);
  const productSnapshot = getProductSnapshot(["name", "price", "stock", "status"]);
  const journal = [];
  let totalAmount = 0;

  aggregatedItems.forEach((item) => {
    const productRecord = findProductRecordByName(item.product, productSnapshot);
    if (!productRecord) {
      throw new Error(`找不到商品: ${item.product}`);
    }

    if (!isProductSellable(productRecord.status)) {
      throw new Error(`商品目前不可販售: ${item.product}`);
    }

    if (productRecord.stock <= 0) {
      throw new Error(`商品庫存不足: ${item.product}`);
    }

    if (item.quantity > productRecord.stock) {
      throw new Error(`商品庫存不足: ${item.product}`);
    }

    const nextStock = productRecord.stock - item.quantity;
    const nextStatus = determineProductStatusByStock(productRecord.status, nextStock);

    journal.push({
      product: item.product,
      quantity: item.quantity,
      rowNumber: productRecord.rowNumber,
      previousStock: productRecord.stock,
      nextStock: nextStock,
      previousStatus: productRecord.status,
      nextStatus: nextStatus,
    });

    totalAmount += Number(productRecord.price) * item.quantity;
  });

  try {
    applyInventoryMutations(journal);
  } catch (error) {
    restoreInventoryMutations(journal);
    throw error;
  }

  return {
    totalAmount: totalAmount,
    journal: journal,
    items: aggregatedItems,
  };
}

function replenishInventory(orderItems) {
  const aggregatedItems = aggregateOrderItems(orderItems);
  const productSnapshot = getProductSnapshot(["name", "stock", "status"]);
  const journal = [];

  aggregatedItems.forEach((item) => {
    const productRecord = findProductRecordByName(item.product, productSnapshot);
    if (!productRecord) {
      throw new Error(`找不到商品: ${item.product}`);
    }

    const nextStock = productRecord.stock + item.quantity;
    const nextStatus = determineProductStatusByStock(productRecord.status, nextStock);

    journal.push({
      product: item.product,
      quantity: item.quantity,
      rowNumber: productRecord.rowNumber,
      previousStock: productRecord.stock,
      nextStock: nextStock,
      previousStatus: productRecord.status,
      nextStatus: nextStatus,
    });
  });

  try {
    applyInventoryMutations(journal);
  } catch (error) {
    restoreInventoryMutations(journal);
    throw error;
  }

  return {
    journal: journal,
    items: aggregatedItems,
  };
}

function resolveOrderContext(orderRowOrOrder) {
  if (typeof orderRowOrOrder === "number") {
    return getOrderByRow(orderRowOrOrder, getOrderHeaderMap());
  }

  if (orderRowOrOrder && typeof orderRowOrOrder === "object") {
    if (Array.isArray(orderRowOrOrder.products)) {
      return {
        products: orderRowOrOrder.products,
        rowNumber: orderRowOrOrder.rowNumber || null,
      };
    }

    if (orderRowOrOrder.rowNumber) {
      return getOrderByRow(orderRowOrOrder.rowNumber, getOrderHeaderMap());
    }
  }

  throw new Error("缺少有效的訂單內容");
}

function applyOrderStatusTransition(orderRowOrOrder, previousStatus, nextStatus) {
  const previousApiStatus = normalizeApiOrderStatus(previousStatus);
  const nextApiStatus = normalizeApiOrderStatus(nextStatus);

  if (!nextApiStatus) {
    throw new Error("訂單狀態不合法");
  }

  if (!previousApiStatus) {
    throw new Error("舊訂單狀態不合法");
  }

  if (previousApiStatus === nextApiStatus) {
    return {
      changedInventory: false,
      journal: [],
      nextSheetStatus: toSheetOrderStatus(nextApiStatus),
      nextApiStatus: nextApiStatus,
    };
  }

  const order = resolveOrderContext(orderRowOrOrder);

  if (!isCancelledStatus(previousApiStatus) && isCancelledStatus(nextApiStatus)) {
    const replenishResult = replenishInventory(order.products);
    return {
      changedInventory: true,
      journal: replenishResult.journal,
      nextSheetStatus: toSheetOrderStatus(nextApiStatus),
      nextApiStatus: nextApiStatus,
    };
  }

  if (isCancelledStatus(previousApiStatus) && !isCancelledStatus(nextApiStatus)) {
    const reserveResult = validateAndReserveInventory(order.products);
    return {
      changedInventory: true,
      journal: reserveResult.journal,
      nextSheetStatus: toSheetOrderStatus(nextApiStatus),
      nextApiStatus: nextApiStatus,
      totalAmount: reserveResult.totalAmount,
    };
  }

  return {
    changedInventory: false,
    journal: [],
    nextSheetStatus: toSheetOrderStatus(nextApiStatus),
    nextApiStatus: nextApiStatus,
  };
}
