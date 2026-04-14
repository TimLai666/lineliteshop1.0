function onEdit(e) {
  if (!e || !e.range || !e.source) {
    return;
  }

  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  const value = row > 1 ? e.range.getValue() : null;

  // todo: 根據工作表名稱和欄位值進行處理
  switch (sheetName) {
    case '商品類別':
      if (col === 1 && row > 1) {
        // **新增商品類別時，確保名稱唯一，若名稱已存在則恢復原值並顯示警告訊息**

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
      } else if (col === 3 && row > 1) {
        // **當類別名稱不為空時，才能更改是否上架**

        categoryName = sheet.getRange(row, 1).getValue();
        if (!categoryName) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '類別名稱不能為空，請先輸入類別名稱！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }
      }
      break;
    case '商品': {
      const productHeaderMap = getProductHeaderMap(["name", "category", "price", "stock", "status"]);

      if (col === productHeaderMap.name && row > 1) {
        // **新增商品時，確保商品名稱唯一，若名稱已存在則恢復原值並顯示警告訊息**
        // **新增商品後，自動將庫存設為0並將狀態設為「下架」**

        // 處理商品的名稱編輯
        if (!value) return; // 如果值為空，則不處理

        // 檢查值是否唯一，如果不唯一則恢復原值並顯示警告
        if (!isUniqueInColumn(sheet, productHeaderMap.name, value, row)) {
          // 恢復原值
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '此商品名稱已存在，請輸入不同的名稱！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }

        // 如果是新增商品，則自動將狀態設為「下架」
        if (!e.oldValue) {
          sheet.getRange(row, productHeaderMap.stock).setValue(0);
          sheet.getRange(row, productHeaderMap.status).setValue('下架');
        }
      } else if (col === productHeaderMap.stock && row > 1) {
        withInventoryLock(() => {
          applyProductStockStatusRule(row, productHeaderMap);
        });
      } else if ((col === productHeaderMap.category || col === productHeaderMap.status) && row > 1) {
        // **商品名稱不為空時，才能設定類別或狀態**

        const productName = sheet.getRange(row, productHeaderMap.name).getValue();
        if (!productName) {
          e.range.setValue(e.oldValue || '');
          // 顯示警告訊息
          SpreadsheetApp.getUi().alert('錯誤', '商品名稱不能為空，請先輸入商品名稱！', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }

        if (col === productHeaderMap.status) {
          // **若未設定價格或價格小於等於0，只允許特定狀態**
          // **若庫存小於等於0，只允許特定狀態且不能設為「有現貨」**

          const price = sheet.getRange(row, productHeaderMap.price).getValue();
          const stock = sheet.getRange(row, productHeaderMap.stock).getValue();
          const status = value;

          // 定義允許的狀態
          const allowedStatuses = ['下架', '已售完', '暫時無法供貨'];

          // 當價格小於等於0時，只允許特定狀態
          if (price <= 0 && !allowedStatuses.includes(status)) {
            // 恢復原值
            const recoveryValue = e.oldValue && allowedStatuses.includes(e.oldValue) ? e.oldValue : '';
            e.range.setValue(recoveryValue);
            // 顯示警告訊息
            SpreadsheetApp.getUi().alert('錯誤', '未設定價格或價格小於等於0時，商品狀態只能為「下架」、「已售完」或「暫時無法供貨」！', SpreadsheetApp.getUi().ButtonSet.OK);
            return;
          }

          // 當庫存小於等於0時，只允許特定狀態且不能設為「有現貨」
          if (stock <= 0 && !allowedStatuses.includes(status)) {
            // 恢復原值
            e.range.setValue(e.oldValue || '');
            // 顯示警告訊息
            SpreadsheetApp.getUi().alert('錯誤', '庫存小於等於0時，商品狀態只能設為「下架」、「已售完」或「暫時無法供貨」！', SpreadsheetApp.getUi().ButtonSet.OK);
            return;
          }

          // 額外的檢查：庫存小於等於0時，不能設為「有現貨」
          if (status === '有現貨' && stock <= 0) {
            // 恢復原值
            e.range.setValue(e.oldValue || '');
            // 顯示警告訊息
            SpreadsheetApp.getUi().alert('錯誤', '庫存小於等於0時，商品狀態不能設為「有現貨」！', SpreadsheetApp.getUi().ButtonSet.OK);
            return;
          }
        }
      }
      break;
    }
    case '訂單': {
      const orderHeaderMap = getOrderHeaderMap(["status"]);
      const isSingleCellEdit = e.range.getNumRows() === 1 && e.range.getNumColumns() === 1;

      if (row <= 1 || col !== orderHeaderMap.status) {
        break;
      }

      if (!isSingleCellEdit || !Object.prototype.hasOwnProperty.call(e, "oldValue")) {
        SpreadsheetApp.getUi().alert(
          '提醒',
          '批次貼上或沒有舊狀態的編輯不會自動同步庫存，請立即 Undo 後逐筆修改。',
          SpreadsheetApp.getUi().ButtonSet.OK,
        );
        break;
      }

      const previousStatus = e.oldValue;
      const nextStatus = e.value !== undefined ? e.value : value;
      const normalizedNextStatus = normalizeApiOrderStatus(nextStatus);

      if (!normalizedNextStatus) {
        e.range.setValue(previousStatus || '');
        SpreadsheetApp.getUi().alert(
          '錯誤',
          '訂單狀態不合法，請使用「待處理 / 進行中 / 已完成 / 取消」。',
          SpreadsheetApp.getUi().ButtonSet.OK,
        );
        break;
      }

      try {
        withInventoryLock(() => {
          const transitionResult = applyOrderStatusTransition(row, previousStatus, nextStatus);
          e.range.setValue(transitionResult.nextSheetStatus);
        });
      } catch (error) {
        e.range.setValue(previousStatus || '');
        SpreadsheetApp.getUi().alert(
          '錯誤',
          error.message,
          SpreadsheetApp.getUi().ButtonSet.OK,
        );
      }
      break;
    }
  }
}
