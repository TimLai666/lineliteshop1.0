const PRODUCT_FIELD_HEADERS = {
  name: "商品名稱",
  category: "類別",
  price: "價格",
  stock: "庫存",
  status: "狀態",
  description: "商品說明",
  image: "照片",
};

const REQUIRED_PRODUCT_FIELDS = ["name", "category", "price", "stock", "status", "description"];

function getProductHeaderRow() {
  const lastColumn = productSheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error("商品工作表缺少標題列");
  }

  return productSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function resolveProductColumnIndex(headerRow, fieldKey) {
  const expectedHeader = PRODUCT_FIELD_HEADERS[fieldKey];
  if (!expectedHeader) {
    return null;
  }

  for (let i = 0; i < headerRow.length; i++) {
    if (normalizeHeaderName(headerRow[i]) === expectedHeader) {
      return i + 1;
    }
  }

  return null;
}

function getProductHeaderMap(requiredFields) {
  const headerRow = getProductHeaderRow();
  const headerMap = {};

  Object.keys(PRODUCT_FIELD_HEADERS).forEach((fieldKey) => {
    const columnIndex = resolveProductColumnIndex(headerRow, fieldKey);
    if (columnIndex) {
      headerMap[fieldKey] = columnIndex;
    }
  });

  (requiredFields || REQUIRED_PRODUCT_FIELDS).forEach((fieldKey) => {
    if (!headerMap[fieldKey]) {
      throw new Error(`商品工作表缺少必要欄位: ${PRODUCT_FIELD_HEADERS[fieldKey]}`);
    }
  });

  headerMap._headerRow = headerRow;
  return headerMap;
}

function extractProductImageUrl(cellValue) {
  if (!cellValue) {
    return "";
  }

  if (typeof cellValue === "string") {
    return cellValue;
  }

  if (typeof cellValue.getContentUrl === "function") {
    return cellValue.getContentUrl() || "";
  }

  return "";
}

function buildProductApiObjectFromRow(row, headerMap) {
  return {
    name: headerMap.name ? row[headerMap.name - 1] : "",
    category: headerMap.category ? row[headerMap.category - 1] : "",
    price: headerMap.price ? row[headerMap.price - 1] : "",
    stock: headerMap.stock ? row[headerMap.stock - 1] : "",
    status: headerMap.status ? row[headerMap.status - 1] : "",
    description: headerMap.description ? row[headerMap.description - 1] : "",
    image_url: headerMap.image ? extractProductImageUrl(row[headerMap.image - 1]) : "",
  };
}
