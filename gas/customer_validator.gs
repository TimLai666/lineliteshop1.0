/**
 * 顧客驗證相關函數
 */

/**
 * 檢查顧客是否存在
 * @param {string} customerId - 顧客ID
 * @return {Object} 檢查結果 { exists: boolean, customerRow: number, customerInfo: Object }
 */
function checkCustomerExists(customerId) {
    if (!customerId || customerId.trim() === '') {
        return {
            exists: false,
            customerRow: null,
            customerInfo: null,
            errorMessage: '顧客ID不能為空'
        };
    }

    // 更穩定的查找方法：只在A欄查找顧客ID
    const lastRow = customerSheet.getLastRow();
    const customerIds = customerSheet.getRange(1, 1, lastRow, 1).getValues();

    let customerRow = null;
    for (let i = 0; i < customerIds.length; i++) {
        if (customerIds[i][0] && customerIds[i][0].toString().trim() === customerId.toString().trim()) {
            customerRow = i + 1; // Google Sheets 的行數從1開始
            break;
        }
    }

    if (!customerRow) {
        return {
            exists: false,
            customerRow: null,
            customerInfo: null,
            errorMessage: `找不到顧客ID: ${customerId}`
        };
    }

    // 批次獲取顧客基本資訊 (假設表格結構: ID, 姓名, 生日, 電話, 電子郵件, 備註)
    const customerData = customerSheet.getRange(customerRow, 1, 1, 6).getValues()[0];
    const customerInfo = {
        id: customerData[0],
        name: customerData[1],
        birthday: customerData[2], // 生日在第三列
        phone: customerData[3],
        email: customerData[4],
        note: customerData[5] // 備註在第六列
    };

    return {
        exists: true,
        customerRow: customerRow,
        customerInfo: customerInfo,
        errorMessage: null
    };
}

