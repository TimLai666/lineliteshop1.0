function checkOrderExists(orderId) {
    const orders = orderSheet.getDataRange().getValues();

    // 檢查訂單是否存在
    for (let i = 1; i < orders.length; i++) {
        if (orders[i][0] === orderId) { // 假設訂單ID在第一列
            return true;
        }
    }
    return false;
}

function findOrderRow(orderId) {
    const orders = orderSheet.getDataRange().getValues();

    // 查找訂單所在的行數
    for (let i = 1; i < orders.length; i++) {
        if (orders[i][0] === orderId) { // 假設訂單ID在第一列
            return i + 1; // 返回實際的行數（Google Sheets 從 1 開始計算）
        }
    }
    return -1; // 如果找不到訂單，返回 -1
}