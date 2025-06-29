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