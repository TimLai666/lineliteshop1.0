function installableTriggerOnEdit(e) {
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();
    const col = e.range.getColumn();
    const row = e.range.getRow();
    let value;
    if (row > 1) {
        value = e.range.getValue();
    }

    switch (sheetName) {
        case "訂單":
            // todo: 可優化 只有某些欄位更新時不執行
            // 執行RFM, CAI, 購物籃等計算並存儲結果
            doAllCalculationsAndStoreResults()
            break;
    }
}