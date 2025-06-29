// 處理 POST 請求
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  switch (data.action) {
    case 'ADD_ORDER':
      return addOrder(data);
  }
}

// {
//   action: 'ADD_ORDER',
//     order: {
//     product: [{ product: '產品名', quantity: 數量 }]
//     customer_id: '',
//     note: '顧客備註'
//   },
// }

function addOrder(data) {
  const order = data.order;
  const sheet = orderSheet;

  // 驗證所有產品是否存在，並計算總金額
  const validationResult = validateProductsAndCalculateTotal(order.product);

  if (!validationResult.isValid) {
    console.log(`錯誤：${validationResult.errorMessage}，取消添加訂單`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: validationResult.errorMessage
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
  const products = order.product.map(item => `${item.product}*${item.quantity}`).join(', ');
  sheet.getRange(newRow, 2).setValue(products);

  // 設定顧客id
  sheet.getRange(newRow, 3).setValue(order.customer_id);

  // 設定顧客備註
  if (order.note) {
    sheet.getRange(newRow, 8).setValue(order.note);
  }

  // 設置訂單狀態為 '待處理'
  sheet.getRange(newRow, 5).setValue('待處理');

  // 設置訂單時間為當前時間
  sheet.getRange(newRow, 6).setValue(new Date());

  // 設置訂單總金額
  sheet.getRange(newRow, 7).setValue(totalAmount);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}