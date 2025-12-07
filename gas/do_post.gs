// 處理 POST 請求
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // 驗證 token
  if (!data.token || data.token !== settings.token) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid or missing token'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  switch (data.action) {
    case 'ADD_CUSTOMER':
      return addCustomer(data);
    case 'UPDATE_CUSTOMER':
      return updateCustomer(data);
    case 'ADD_ORDER':
      return addOrder(data);
    case 'UPDATE_ORDER':
      return updateOrder(data);
    default:
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
  }
}


// {
//   action: 'ADD_CUSTOMER',
//   customer: {
//     id: 'C001',
//     name: '顧客姓名',
//     birthday: '顧客生日', // 格式: YYYY-MM-DD
//     phone: '顧客電話',
//     email: '顧客電子郵件'
//   }
// }

function addCustomer(data) {
  const customer = data.customer;
  const sheet = customerSheet;

  // 檢查顧客ID是否已存在
  const existingCustomer = checkCustomerExists(customer.id);
  if (existingCustomer.exists) {
    console.log(`錯誤：顧客ID ${customer.id} 已存在，取消添加顧客`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: `顧客ID ${customer.id} 已存在`
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 檢查顧客姓名是否為空
  if (!customer.name || customer.name.trim() === '') {
    console.log('錯誤：顧客姓名不能為空，取消添加顧客');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '顧客姓名不能為空'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 檢查生日格式是否正確
  if (customer.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(customer.birthday)) {
    console.log('錯誤：顧客生日格式不正確，應為 YYYY-MM-DD');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '顧客生日格式不正確，應為 YYYY-MM-DD'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 檢查電話格式是否正確（假設電話格式為數字）
  if (customer.phone && !/^\d+$/.test(customer.phone)) {
    console.log('錯誤：顧客電話格式不正確，應為數字');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '顧客電話格式不正確，應為數字'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 檢查email
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    console.log('錯誤：顧客電子郵件格式不正確');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '顧客電子郵件格式不正確'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 所有檢查通過，開始添加顧客
  const lastRow = sheet.getLastRow();
  if (lastRow >= sheet.getMaxRows()) {
    sheet.insertRowAfter(lastRow);
  }

  const newRow = lastRow + 1;

  // 設置 A、B、C、D 欄（ID、姓名、生日、電話）
  sheet.getRange(newRow, 1, 1, 5).setValues([[customer.id, customer.name, customer.birthday, customer.phone, customer.email]]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// {
//   action: 'UPDATE_CUSTOMER',
//   customer: {
//     id: 'C001', // 顧客ID
//     name: '新顧客姓名', // 可選
//     birthday: '新顧客生日', // 格式: YYYY-MM-DD，可選
//     phone: '新顧客電話' // 可選
//     email: '新顧客電子郵件' // 可選
//   }
// }

function updateCustomer(data) {
  const customer = data.customer;
  const sheet = customerSheet;

  // 檢查顧客ID是否存在
  const existingCustomer = checkCustomerExists(customer.id);
  if (!existingCustomer.exists) {
    console.log(`錯誤：顧客ID ${customer.id} 不存在，取消更新顧客`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: `顧客ID ${customer.id} 不存在`
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const rowToUpdate = existingCustomer.customerRow;

  // 更新顧客姓名
  if (customer.name) {
    if (customer.name.trim() === '') {
      console.log('錯誤：顧客姓名不能為空，取消更新顧客');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '顧客姓名不能為空'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowToUpdate, 2).setValue(customer.name);
  }

  // 更新顧客生日
  if (customer.birthday) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customer.birthday)) {
      console.log('錯誤：顧客生日格式不正確，應為 YYYY-MM-DD');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '顧客生日格式不正確，應為 YYYY-MM-DD'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowToUpdate, 3).setValue(customer.birthday);
  }

  // 更新顧客電話
  if (customer.phone) {
    if (!/^\d+$/.test(customer.phone)) {
      console.log('錯誤：顧客電話格式不正確，應為數字');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '顧客電話格式不正確，應為數字'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowToUpdate, 4).setValue(customer.phone);
  }

  // 更新顧客電子郵件
  if (customer.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      console.log('錯誤：顧客電子郵件格式不正確');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '顧客電子郵件格式不正確'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowToUpdate, 5).setValue(customer.email);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
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
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 驗證顧客是否存在
  const customerValidation = checkCustomerExists(order.customer_id);

  if (!customerValidation.exists) {
    console.log(`錯誤：${customerValidation.errorMessage}，取消添加訂單`);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: customerValidation.errorMessage
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const totalAmount = validationResult.totalAmount;

  // 計算新的訂單 ID（所有 A 欄 ID 的最大值 + 1）
  let maxId = 0;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) { // 假設第一行是標題行
    const idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idRange.length; i++) {
      const currentId = parseInt(idRange[i][0]);
      if (!isNaN(currentId) && currentId > maxId) {
        maxId = currentId;
      }
    }
  }
  const newOrderId = data.order.id || maxId + 1;

  // 在第二行插入新訂單（第一行是標題行）
  sheet.insertRowAfter(1);
  const newRow = 2;

  // 將產品格式化為 "產品名*數量" 的形式
  const products = order.products.map(item => `${item.product}*${item.quantity}`).join(', ');

  // 準備批次數據 - 分別處理不同欄位
  // 表格結構：A=ID, B=產品, C=顧客ID, D=顧客姓名(公式), E=狀態, F=時間, G=總金額, H=備註

  // 設置 A、B、C 欄（ID、產品和顧客ID）
  sheet.getRange(newRow, 1, 1, 3).setValues([[newOrderId, products, order.customer_id]]);

  // 設置 E、F、G、H 欄（狀態、時間、總金額、備註）
  const orderData = [
    '待處理',                      // E欄：訂單狀態
    new Date(),                   // F欄：訂單時間
    totalAmount,                  // G欄：訂單總金額
    order.customer_note           // H欄：顧客備註
  ];
  sheet.getRange(newRow, 5, 1, 4).setValues([orderData]);

  // 複製所有欄位的公式和格式（從參考行複製到新行）
  if (lastRow > 1) { // 有數據行可以參考
    // 插入新行後，原有的數據行會向下移動
    // 原本第2行的數據會變成第3行
    const sourceRow = 3; // 固定使用第3行作為參考（插入後的第一筆原有資料）

    const maxColumns = sheet.getLastColumn();

    // 檢查參考行是否真的存在資料
    const currentLastRow = sheet.getLastRow();
    if (currentLastRow >= sourceRow) {
      // 複製公式
      const sourceRange = sheet.getRange(sourceRow, 1, 1, maxColumns);
      const formulas = sourceRange.getFormulas()[0];
      for (let col = 0; col < formulas.length; col++) {
        if (formulas[col]) {
          sheet.getRange(newRow, col + 1).setFormula(formulas[col]);
        }
      }

      // 複製格式（除了最後一欄）
      const formatColumns = maxColumns - 1;
      if (formatColumns > 0) {
        const targetFormatRange = sheet.getRange(newRow, 1, 1, formatColumns);
        const sourceFormatRange = sheet.getRange(sourceRow, 1, 1, formatColumns);

        // 直接複製格式，不需要包裝在陣列中
        targetFormatRange.setBackgrounds(sourceFormatRange.getBackgrounds());
        targetFormatRange.setFontColors(sourceFormatRange.getFontColors());
        targetFormatRange.setFontFamilies(sourceFormatRange.getFontFamilies());
        targetFormatRange.setFontSizes(sourceFormatRange.getFontSizes());
        targetFormatRange.setFontWeights(sourceFormatRange.getFontWeights());
        targetFormatRange.setFontStyles(sourceFormatRange.getFontStyles());
        targetFormatRange.setHorizontalAlignments(sourceFormatRange.getHorizontalAlignments());
        targetFormatRange.setVerticalAlignments(sourceFormatRange.getVerticalAlignments());
        targetFormatRange.setWraps(sourceFormatRange.getWraps());
      }
    }
  } else {
    // 如果是第一次添加訂單，從標題行複製基本格式
    const maxColumns = sheet.getLastColumn();
    const formatColumns = maxColumns - 1; // 除了最後一欄

    if (formatColumns > 0) {
      const headerRange = sheet.getRange(1, 1, 1, formatColumns);
      const targetRange = sheet.getRange(newRow, 1, 1, formatColumns);

      // 複製標題行的基本格式作為模板
      targetRange.setFontFamilies(headerRange.getFontFamilies());
      targetRange.setFontSizes(headerRange.getFontSizes());
      targetRange.setHorizontalAlignments(headerRange.getHorizontalAlignments());
      targetRange.setVerticalAlignments(headerRange.getVerticalAlignments());
      targetRange.setBackgrounds(headerRange.getBackgrounds());
      targetRange.setFontColors(headerRange.getFontColors());
    }
  }

  // 執行RFM, CAI, 購物籃等計算並存儲結果
  doAllCalculationsAndStoreResults()

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// {
//   action: 'UPDATE_ORDER',
//     order: {
//     id: '訂單ID', // 假設有一個訂單ID來識別訂單
//     total_amount: 100, // 可選，更新總金額
//     status: '訂單狀態', // 例如 '待處理', '進行中','已完成', '取消'
//     internal_note: '內部備註' // 可選
//   },
// }

function updateOrder(data) {
  const order = data.order;
  const sheet = orderSheet;
  const orderId = order.id;
  const rowToUpdate = findOrderRow(orderId);
  if (!order.id || rowToUpdate === -1) return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: '訂單不存在或ID無效'
  })).setMimeType(ContentService.MimeType.JSON);

  if (order.status) {
    // 更新訂單狀態
    sheet.getRange(rowToUpdate, 5).setValue(order.status); // 假設狀態在第5列
  }

  if (order.total_amount) {
    // 更新訂單總金額
    sheet.getRange(rowToUpdate, 7).setValue(order.total_amount); // 假設總金額在第7列
  }

  if (order.internal_note) {
    // 更新內部備註
    sheet.getRange(rowToUpdate, 9).setValue(order.internal_note); // 假設內部備註在第8列
  }

  // todo: 可優化 只有某些欄位更新時不執行
  // 執行RFM, CAI, 購物籃等計算並存儲結果
  doAllCalculationsAndStoreResults()

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
