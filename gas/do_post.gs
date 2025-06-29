// 處理 POST 請求
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  switch (data.action) {
    case 'ADD_ORDER':
      return addOrder(data);
    case 'UPDATE_ORDER':
      return updateOrder(data);
  }
}

// {
//   action: 'ADD_ORDER',
//     order: {
//     products: [{ product: '產品名', quantity: 數量 }]
//     customer_id: '',
//     customer_note: '顧客備註'
//   },
// }

function addOrder(data) {
  const order = data.order;
  const sheet = orderSheet;

  // 驗證所有產品是否存在，並計算總金額
  const validationResult = validateProductsAndCalculateTotal(order.products);

  if (!validationResult.isValid) {
    console.log(`錯誤：${validationResult.errorMessage}，取消添加訂單`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: validationResult.errorMessage
    }));
  }

  // 驗證顧客是否存在
  const customerValidation = checkCustomerExists(order.customer_id);

  if (!customerValidation.exists) {
    console.log(`錯誤：${customerValidation.errorMessage}，取消添加訂單`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: customerValidation.errorMessage
    }));
  }

  const totalAmount = validationResult.totalAmount;

  // 所有產品都找到了，開始添加訂單
  // 檢查是否有足夠的空間添加新訂單
  const lastRow = sheet.getLastRow();
  if (lastRow >= sheet.getMaxRows()) {
    sheet.insertRowAfter(lastRow);
  }

  const newRow = lastRow + 1;

  // 將產品格式化為 "產品名*數量" 的形式
  const products = order.products.map(item => `${item.product}*${item.quantity}`).join(', ');

  // 準備批次數據 - 分別處理不同欄位（跳過D欄的顧客姓名公式）
  // 表格結構：A=序號, B=產品, C=顧客ID, D=顧客姓名(公式), E=狀態, F=時間, G=總金額, H=備註

  // 設置 B、C 欄（產品和顧客ID）
  sheet.getRange(newRow, 2, 1, 2).setValues([[products, order.customer_id]]);

  // 設置 E、F、G、H 欄（狀態、時間、總金額、備註），跳過D欄避免覆蓋公式
  const orderData = [
    '待處理',                      // E欄：訂單狀態
    new Date(),                   // F欄：訂單時間
    totalAmount,                  // G欄：訂單總金額
    order.customer_note           // H欄：顧客備註
  ];
  sheet.getRange(newRow, 5, 1, 4).setValues([orderData]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}

// {
//   action: 'UPDATE_ORDER',
//     order: {
//     id: '訂單ID', // 假設有一個訂單ID來識別訂單
//     products: [{ product: '產品名', quantity: 數量 }]
//     customer_id: '',
//     customer_note: '顧客備註',
//     status: '訂單狀態', // 例如 '待處理', '進行中','已完成', '取消'
//     internal_note: '內部備註' // 可選
//   },
// }

function updateOrder(data) {
  const order = data.order;
  const sheet = orderSheet;
  const orderId = order.id;
  if (!order.id || !checkOrderExists(orderId)) return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: '訂單不存在或ID無效'
  }));

  if (order.status) {
    // 更新訂單狀態
    sheet.getRange(orderId + 1, 5).setValue(order.status); // 假設狀態在第5列
  }

  if (order.internal_note) {
    // 更新內部備註
    sheet.getRange(orderId + 1, 9).setValue(order.internal_note); // 假設內部備註在第8列
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}
