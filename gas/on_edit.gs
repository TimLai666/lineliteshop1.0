function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  let value;
  if (row > 1) {
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
      if (col === 1 && row > 1) {
        // **新增商品時，確保商品名稱唯一，若名稱已存在則恢復原值並顯示警告訊息**
        // **新增商品後，自動將庫存設為0並將狀態設為「下架」**

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

        // 如果是新增商品，則自動將狀態設為「下架」
        if (!e.oldValue) {
          sheet.getRange(row, 4).setValue(0); // 假設狀態在第5列
          sheet.getRange(row, 5).setValue('下架'); // 假設狀態在第5列
        }
      } else if (col === 5 && row > 1) {
        // **若未設定價格或價格小於等於0，不允許「下架」以外的狀態**
        // **若庫存小於等於0，不允許「有現貨」**

        const price = sheet.getRange(row, 3).getValue();
        const inventory = sheet.getRange(row, 4).getValue();
        const status = value;
        if (status !== '下架' && price <= 0) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '未設定價格或價格小於等於0時，商品狀態只能為「下架」！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }

        if (status === '有現貨' && inventory <= 0) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '庫存小於等於0時，商品狀態不能設為「有現貨」！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }
      }
      break;
  }
}