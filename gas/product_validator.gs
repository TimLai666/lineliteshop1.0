/**
 * 產品驗證相關函數
 */

/**
 * 高效能版本的產品驗證和總金額計算
 * @param {Array} products - 產品陣列，格式: [{ product: '產品名', quantity: 數量 }]
 * @return {Object} 驗證結果 { isValid: boolean, totalAmount: number, errorMessage: string }
 */
function validateProductsAndCalculateTotal(products) {
    // 檢查產品陣列是否有效
    if (!products || !Array.isArray(products) || products.length === 0) {
        return {
            isValid: false,
            totalAmount: 0,
            errorMessage: '產品清單不能為空'
        };
    }

    // 一次性讀取所有產品資料（A欄和C欄）
    const productData = getProductDataRange();

    let totalAmount = 0;

    for (const productItem of products) {
        const productName = productItem.product;
        const quantity = productItem.quantity;

        // 檢查產品名稱是否有效
        if (!productName || typeof productName !== 'string' || productName.trim() === '') {
            return {
                isValid: false,
                totalAmount: 0,
                errorMessage: '產品名稱不能為空'
            };
        }

        // 檢查數量是否有效
        if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
            return {
                isValid: false,
                totalAmount: 0,
                errorMessage: `數量必須是正數: ${productName}`
            };
        }

        // 在產品資料中查找產品
        const productInfo = findProductInData(productName, productData);

        if (!productInfo.exists) {
            return {
                isValid: false,
                totalAmount: 0,
                errorMessage: `找不到產品: ${productName}`
            };
        }

        // 計算小計
        totalAmount += productInfo.price * quantity;
    }

    return {
        isValid: true,
        totalAmount: totalAmount,
        errorMessage: null
    };
}

/**
 * 一次性獲取產品資料範圍
 * @return {Array} 產品資料陣列 [[產品名, 其他, 價格], ...]
 */
function getProductDataRange() {
    // 一次性讀取A欄和C欄的所有資料
    const range = productSheet.getRange('A:C');
    return range.getValues();
}

/**
 * 在產品資料中查找產品
 * @param {string} productName - 產品名稱
 * @param {Array} productData - 產品資料陣列
 * @return {Object} 查找結果 { exists: boolean, productRow: number, price: number }
 */
function findProductInData(productName, productData) {
    for (let i = 0; i < productData.length; i++) {
        const cellValue = productData[i][0];

        // 跳過空白儲存格
        if (!cellValue) continue;

        // 精確匹配產品名稱（不區分大小寫）
        if (cellValue.toString().trim().toLowerCase() === productName.trim().toLowerCase()) {
            return {
                exists: true,
                productRow: i + 1,
                price: productData[i][2] // C欄的價格
            };
        }
    }

    return {
        exists: false,
        productRow: null,
        price: null
    };
}

/**
 * 檢查單一產品是否存在（保留原有接口）
 * @param {string} productName - 產品名稱
 * @return {Object} 檢查結果 { exists: boolean, productRow: number, price: number }
 */
function checkProductExists(productName) {
    if (!productName || typeof productName !== 'string') {
        return {
            exists: false,
            productRow: null,
            price: null
        };
    }

    // 讀取產品資料並查找
    const productData = getProductDataRange();
    return findProductInData(productName, productData);
}
