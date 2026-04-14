function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (!data.token || data.token !== settings.token) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Invalid or missing token",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  switch (data.action) {
    case "ADD_CUSTOMER":
      return addCustomer(data);
    case "UPDATE_CUSTOMER":
      return updateCustomer(data);
    case "ADD_ORDER":
      return addOrder(data);
    case "UPDATE_ORDER":
      return updateOrder(data);
    default:
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "error",
          message: "Invalid action",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
  }
}

function validateCustomerPayload(customer, isUpdate) {
  if (!customer || typeof customer !== "object") {
    return "缺少 customer payload";
  }

  if (!customer.id || String(customer.id).trim() === "") {
    return "顧客ID不能為空";
  }

  if (!isUpdate && (!customer.name || String(customer.name).trim() === "")) {
    return "顧客姓名不能為空";
  }

  if (
    Object.prototype.hasOwnProperty.call(customer, "birthday") &&
    customer.birthday &&
    !/^\d{4}-\d{2}-\d{2}$/.test(String(customer.birthday))
  ) {
    return "顧客生日格式不正確，應為 YYYY-MM-DD";
  }

  if (
    Object.prototype.hasOwnProperty.call(customer, "phone") &&
    customer.phone &&
    !/^\d+$/.test(String(customer.phone))
  ) {
    return "顧客電話格式不正確，應為數字";
  }

  if (
    Object.prototype.hasOwnProperty.call(customer, "email") &&
    customer.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email))
  ) {
    return "顧客電子郵件格式不正確";
  }

  return null;
}

function addCustomer(data) {
  const customer = data.customer || {};
  const validationMessage = validateCustomerPayload(customer, false);
  if (validationMessage) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: validationMessage,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const existingCustomer = checkCustomerExists(customer.id);
  if (existingCustomer.exists) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: `顧客ID ${customer.id} 已存在`,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headerMap = getCustomerHeaderMap();
  const lastRow = customerSheet.getLastRow();
  if (lastRow >= customerSheet.getMaxRows()) {
    customerSheet.insertRowAfter(lastRow);
  }

  const newRow = lastRow + 1;
  writeCustomerFields(newRow, customer, headerMap, false);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function updateCustomer(data) {
  const customer = data.customer || {};
  const validationMessage = validateCustomerPayload(customer, true);
  if (validationMessage) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: validationMessage,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const existingCustomer = checkCustomerExists(customer.id);
  if (!existingCustomer.exists) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: `顧客ID ${customer.id} 不存在`,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headerMap = getCustomerHeaderMap();
  writeCustomerFields(existingCustomer.customerRow, customer, headerMap, true);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function addOrder(data) {
  const order = data.order;
  const sheet = orderSheet;

  const validationResult = validateProductsAndCalculateTotal(order.products);
  if (!validationResult.isValid) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: validationResult.errorMessage,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const customerValidation = checkCustomerExists(order.customer_id);
  if (!customerValidation.exists) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: customerValidation.errorMessage,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const totalAmount = validationResult.totalAmount;

  let maxId = 0;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idRange.length; i++) {
      const currentId = parseInt(idRange[i][0], 10);
      if (!isNaN(currentId) && currentId > maxId) {
        maxId = currentId;
      }
    }
  }
  const newOrderId = data.order.id || maxId + 1;

  sheet.insertRowAfter(1);
  const newRow = 2;

  const products = order.products
    .map((item) => `${item.product}*${item.quantity}`)
    .join(", ");

  sheet
    .getRange(newRow, 1, 1, 3)
    .setValues([[newOrderId, products, order.customer_id]]);

  const orderData = [
    "待處理",
    new Date(),
    totalAmount,
    order.customer_note,
  ];
  sheet.getRange(newRow, 5, 1, 4).setValues([orderData]);

  if (lastRow > 1) {
    const sourceRow = 3;
    const maxColumns = sheet.getLastColumn();
    const currentLastRow = sheet.getLastRow();
    if (currentLastRow >= sourceRow) {
      const sourceRange = sheet.getRange(sourceRow, 1, 1, maxColumns);
      const formulas = sourceRange.getFormulas()[0];
      for (let col = 0; col < formulas.length; col++) {
        if (formulas[col]) {
          sheet.getRange(newRow, col + 1).setFormula(formulas[col]);
        }
      }

      const formatColumns = maxColumns - 1;
      if (formatColumns > 0) {
        const targetFormatRange = sheet.getRange(newRow, 1, 1, formatColumns);
        const sourceFormatRange = sheet.getRange(sourceRow, 1, 1, formatColumns);
        targetFormatRange.setBackgrounds(sourceFormatRange.getBackgrounds());
        targetFormatRange.setFontColors(sourceFormatRange.getFontColors());
        targetFormatRange.setFontFamilies(sourceFormatRange.getFontFamilies());
        targetFormatRange.setFontSizes(sourceFormatRange.getFontSizes());
        targetFormatRange.setFontWeights(sourceFormatRange.getFontWeights());
        targetFormatRange.setFontStyles(sourceFormatRange.getFontStyles());
        targetFormatRange.setHorizontalAlignments(
          sourceFormatRange.getHorizontalAlignments(),
        );
        targetFormatRange.setVerticalAlignments(
          sourceFormatRange.getVerticalAlignments(),
        );
        targetFormatRange.setWraps(sourceFormatRange.getWraps());
      }
    }
  } else {
    const maxColumns = sheet.getLastColumn();
    const formatColumns = maxColumns - 1;

    if (formatColumns > 0) {
      const headerRange = sheet.getRange(1, 1, 1, formatColumns);
      const targetRange = sheet.getRange(newRow, 1, 1, formatColumns);
      targetRange.setFontFamilies(headerRange.getFontFamilies());
      targetRange.setFontSizes(headerRange.getFontSizes());
      targetRange.setHorizontalAlignments(headerRange.getHorizontalAlignments());
      targetRange.setVerticalAlignments(headerRange.getVerticalAlignments());
      targetRange.setBackgrounds(headerRange.getBackgrounds());
      targetRange.setFontColors(headerRange.getFontColors());
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function updateOrder(data) {
  const order = data.order;
  const rowToUpdate = findOrderRow(order.id);
  if (!order.id || rowToUpdate === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "訂單不存在或缺少訂單ID",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (order.status) {
    orderSheet.getRange(rowToUpdate, 5).setValue(order.status);
  }

  if (order.total_amount) {
    orderSheet.getRange(rowToUpdate, 7).setValue(order.total_amount);
  }

  if (order.internal_note) {
    orderSheet.getRange(rowToUpdate, 9).setValue(order.internal_note);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
