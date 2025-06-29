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

    const foundCell = customerSheet.createTextFinder(customerId).findNext();

    if (!foundCell) {
        return {
            exists: false,
            customerRow: null,
            customerInfo: null,
            errorMessage: `找不到顧客ID: ${customerId}`
        };
    }

    const customerRow = foundCell.getRow();

    // 獲取顧客基本資訊 (假設表格結構: ID, 姓名, 電話, 地址等)
    const customerInfo = {
        id: customerSheet.getRange(customerRow, 1).getValue(),
        name: customerSheet.getRange(customerRow, 2).getValue(),
        birthday: customerSheet.getRange(customerRow, 3).getValue(), // 假設生日在第三列
        phone: customerSheet.getRange(customerRow, 4).getValue(),
    };

    return {
        exists: true,
        customerRow: customerRow,
        customerInfo: customerInfo,
        errorMessage: null
    };
}

