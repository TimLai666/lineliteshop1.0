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
//     product: []
//     customer_id: '',
//   },
// }

function addOrder(data) {
  const order = data.order;
  const sheet = orderSheet;

  // 檢查是否有足夠的空間添加新訂單
  const lastRow = sheet.getLastRow();
  if (lastRow >= sheet.getMaxRows()) {
    sheet.insertRowAfter(lastRow);
  }

  // 假設產品陣列是以逗號分隔的字符串形式存儲
  const products = order.product.join(', ');
  sheet.getRange(newRow, 2).setValue(products);

  // 設定顧客id
  const newRow = lastRow + 1;
  sheet.getRange(newRow, 3).setValue(order.customer_id);

  // 設置訂單狀態為 '待處理'
  sheet.getRange(newRow, 5).setValue('待處理');

  // 設置訂單時間為當前時間
  sheet.getRange(newRow, 6).setValue(new Date());

  // 計算訂單總金額
  const totalAmount = order.product.reduce((sum, productId) => {
    const productRow = productSheet.createTextFinder(productId).findNext().getRow();
    const price = productSheet.getRange(productRow, 3).getValue(); // 假設價格在第三列
    return sum + price;
  }, 0);
  sheet.getRange(newRow, 7).setValue(totalAmount);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}