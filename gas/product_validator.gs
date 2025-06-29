/**
 * 產品驗證相關函數
 */

/**
 * 驗證訂單中的所有產品是否存在，並計算總金額
 * @param {Array} products - 產品陣列，格式: [{ product: '產品名', quantity: 數量 }]
 * @return {Object} 驗證結果 { isValid: boolean, totalAmount: number, errorMessage: string }
 */
function validateProductsAndCalculateTotal(products) {
    let totalAmount = 0;

    for (const productItem of products) {
        const productName = productItem.product;
        const quantity = productItem.quantity;

        // 檢查產品是否存在
        const foundCell = productSheet.createTextFinder(productName).findNext();
        if (!foundCell) {
            console.log(`錯誤：找不到產品 "${productName}"`);
            return {
                isValid: false,
                totalAmount: 0,
                errorMessage: `找不到產品: ${productName}`
            };
        }

        // 獲取產品價格並計算小計
        const productRow = foundCell.getRow();
        const price = productSheet.getRange(productRow, 3).getValue(); // 假設價格在第三列
        totalAmount += price * quantity;
    }

    return {
        isValid: true,
        totalAmount: totalAmount,
        errorMessage: null
    };
}

/**
 * 檢查單一產品是否存在
 * @param {string} productName - 產品名稱
 * @return {Object} 檢查結果 { exists: boolean, productRow: number, price: number }
 */
function checkProductExists(productName) {
    const foundCell = productSheet.createTextFinder(productName).findNext();

    if (!foundCell) {
        return {
            exists: false,
            productRow: null,
            price: null
        };
    }

    const productRow = foundCell.getRow();
    const price = productSheet.getRange(productRow, 3).getValue();

    return {
        exists: true,
        productRow: productRow,
        price: price
    };
}
