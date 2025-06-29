function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  let value;
  if (col === 1 && row > 1) {
    value = e.range.getValue();
  }

  // todo: 根據工作表名稱和欄位值進行處理
  switch (sheetName) {
    case '商品類別':
      // **新增商品類別時，確保名稱唯一，若名稱已存在則恢復原值並顯示警告訊息**
      if (col === 1 && row > 1) {
        // 處理商品類別的名稱編輯
        if (!value) return; // 如果值為空，則不處理

        // 檢查值是否唯一，如果不唯一則恢復原值並顯示警告
        if (!isUniqueInColumn(sheet, 1, value, row)) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '此商品類別名稱已存在，請輸入不同的名稱！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }
      }
      break;
    case '商品':
      // **新增商品時，確保商品名稱唯一，若名稱已存在則恢復原值並顯示警告訊息**
      if (col === 1 && row > 1) {
        // 處理商品的名稱編輯
        if (!value) return; // 如果值為空，則不處理

        // 檢查值是否唯一，如果不唯一則恢復原值並顯示警告
        if (!isUniqueInColumn(sheet, 1, value, row)) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '此商品名稱已存在，請輸入不同的名稱！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }
      }
      break;
  }
}