const ORDER_FIELD_HEADERS = {
  id: ["訂單ID", "訂單編號", "ID"],
  products: ["商品", "產品", "商品列表"],
  customer_id: ["顧客 ID", "顧客ID", "customer_id"],
  customer_name: ["顧客姓名", "顧客名稱", "customer_name"],
  status: ["狀態", "訂單狀態"],
  time: ["訂單時間", "時間", "time"],
  total_amount: ["總金額", "totalAmount", "total_amount"],
  customer_note: ["顧客備註", "備註", "customer_note"],
  internal_note: ["內部備註", "internal_note"],
};

const DEFAULT_ORDER_COLUMNS = {
  id: 1,
  products: 2,
  customer_id: 3,
  customer_name: 4,
  status: 5,
  time: 6,
  total_amount: 7,
  customer_note: 8,
  internal_note: 9,
};

function getOrderHeaderRow() {
  const lastColumn = orderSheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error("訂單工作表缺少標題列");
  }

  return orderSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function resolveOrderColumnIndex(headerRow, fieldKey) {
  const expectedHeaders = ORDER_FIELD_HEADERS[fieldKey];
  if (!expectedHeaders) {
    return null;
  }

  for (let i = 0; i < headerRow.length; i++) {
    const normalizedHeader = normalizeHeaderName(headerRow[i]);
    if (expectedHeaders.includes(normalizedHeader)) {
      return i + 1;
    }
  }

  return null;
}

function getOrderHeaderMap(requiredFields) {
  const headerRow = getOrderHeaderRow();
  const headerMap = {};

  Object.keys(DEFAULT_ORDER_COLUMNS).forEach((fieldKey) => {
    headerMap[fieldKey] =
      resolveOrderColumnIndex(headerRow, fieldKey) || DEFAULT_ORDER_COLUMNS[fieldKey];
  });

  (requiredFields || Object.keys(DEFAULT_ORDER_COLUMNS)).forEach((fieldKey) => {
    if (!headerMap[fieldKey]) {
      throw new Error(`訂單工作表缺少必要欄位: ${fieldKey}`);
    }
  });

  headerMap._headerRow = headerRow;
  return headerMap;
}

function parseOrderProductsCell(cellValue) {
  if (!cellValue) {
    return [];
  }

  return String(cellValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [product, quantity] = item.split("*");
      return {
        product: normalizeHeaderName(product),
        quantity: parseInt(quantity, 10) || 0,
      };
    });
}

function serializeOrderProducts(orderItems) {
  return (orderItems || [])
    .map((item) => `${normalizeHeaderName(item.product)}*${parseInt(item.quantity, 10)}`)
    .join(", ");
}

function buildOrderObjectFromRow(row, rowNumber, headerMap) {
  return {
    rowNumber: rowNumber,
    id: row[headerMap.id - 1],
    productsCell: row[headerMap.products - 1],
    products: parseOrderProductsCell(row[headerMap.products - 1]),
    customer_id: row[headerMap.customer_id - 1],
    customer_name: row[headerMap.customer_name - 1],
    status: row[headerMap.status - 1],
    time: row[headerMap.time - 1],
    total_amount: row[headerMap.total_amount - 1],
    customer_note: row[headerMap.customer_note - 1],
    internal_note: row[headerMap.internal_note - 1],
  };
}

function getOrderByRow(rowNumber, headerMap) {
  const resolvedHeaderMap = headerMap || getOrderHeaderMap();
  const lastColumn = orderSheet.getLastColumn();
  const row = orderSheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
  return buildOrderObjectFromRow(row, rowNumber, resolvedHeaderMap);
}

function buildOrderWriteMap(order) {
  return {
    id: order.id,
    products: Object.prototype.hasOwnProperty.call(order, "products")
      ? serializeOrderProducts(order.products || [])
      : order.productsCell,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    status: order.status,
    time: order.time,
    total_amount: order.total_amount,
    customer_note: order.customer_note,
    internal_note: order.internal_note,
  };
}

function writeOrderFields(rowNumber, order, headerMap, onlyProvidedFields) {
  const resolvedHeaderMap = headerMap || getOrderHeaderMap();
  const writeMap = buildOrderWriteMap(order);

  Object.keys(writeMap).forEach((fieldKey) => {
    const columnIndex = resolvedHeaderMap[fieldKey];
    if (!columnIndex) {
      return;
    }

    if (onlyProvidedFields && !Object.prototype.hasOwnProperty.call(order, fieldKey)) {
      return;
    }

    orderSheet.getRange(rowNumber, columnIndex).setValue(writeMap[fieldKey]);
  });
}
