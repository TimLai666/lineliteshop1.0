/**
 * 產品驗證相關函數
 */

/**
 * 高效能版本的產品驗證和總金額計算
 * @param {Array} products - 產品陣列，格式: [{ product: '產品名', quantity: 數量 }]
 * @return {Object} 驗證結果 { isValid: boolean, totalAmount: number, errorMessage: string }
 */
function validateProductsAndCalculateTotal(products) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return {
      isValid: false,
      totalAmount: 0,
      errorMessage: "產品清單不能為空",
    };
  }

  const productSnapshot = getProductDataRange();
  let totalAmount = 0;

  for (const productItem of products) {
    const productName = productItem.product;
    const quantity = productItem.quantity;

    if (!productName || typeof productName !== "string" || productName.trim() === "") {
      return {
        isValid: false,
        totalAmount: 0,
        errorMessage: "產品名稱不能為空",
      };
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return {
        isValid: false,
        totalAmount: 0,
        errorMessage: `數量必須是正數: ${productName}`,
      };
    }

    const productInfo = findProductInData(productName, productSnapshot);
    if (!productInfo.exists) {
      return {
        isValid: false,
        totalAmount: 0,
        errorMessage: `找不到產品: ${productName}`,
      };
    }

    totalAmount += Number(productInfo.price) * quantity;
  }

  return {
    isValid: true,
    totalAmount: totalAmount,
    errorMessage: null,
  };
}

/**
 * 一次性獲取產品資料範圍
 * @return {{headerMap: Object, rows: Array}} 產品欄位映射與資料列
 */
function getProductDataRange() {
  const headerMap = getProductHeaderMap(["name", "price"]);
  const values = productSheet.getDataRange().getValues();

  return {
    headerMap: headerMap,
    rows: values,
  };
}

/**
 * 在產品資料中查找產品
 * @param {string} productName - 產品名稱
 * @param {{headerMap: Object, rows: Array}} productSnapshot - 產品欄位映射與資料列
 * @return {Object} 查找結果 { exists: boolean, productRow: number, price: number }
 */
function findProductInData(productName, productSnapshot) {
  const headerMap = productSnapshot.headerMap;
  const rows = productSnapshot.rows;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cellValue = row[headerMap.name - 1];

    if (!cellValue) {
      continue;
    }

    if (cellValue.toString().trim().toLowerCase() === productName.trim().toLowerCase()) {
      return {
        exists: true,
        productRow: i + 1,
        price: row[headerMap.price - 1],
      };
    }
  }

  return {
    exists: false,
    productRow: null,
    price: null,
  };
}

/**
 * 檢查單一產品是否存在（保留原有接口）
 * @param {string} productName - 產品名稱
 * @return {Object} 檢查結果 { exists: boolean, productRow: number, price: number }
 */
function checkProductExists(productName) {
  if (!productName || typeof productName !== "string") {
    return {
      exists: false,
      productRow: null,
      price: null,
    };
  }

  const productSnapshot = getProductDataRange();
  return findProductInData(productName, productSnapshot);
}
