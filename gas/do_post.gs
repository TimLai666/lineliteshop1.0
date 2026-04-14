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

function createJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function createErrorResponse(message) {
  return createJsonResponse({
    status: "error",
    message: message,
  });
}

function createSuccessResponse(payload) {
  return createJsonResponse(
    Object.assign(
      {
        status: "success",
      },
      payload || {},
    ),
  );
}

function getNextOrderId() {
  let maxId = 0;
  const headerMap = getOrderHeaderMap(["id"]);
  const lastRow = orderSheet.getLastRow();

  if (lastRow <= 1) {
    return 1;
  }

  const idRange = orderSheet
    .getRange(2, headerMap.id, lastRow - 1, 1)
    .getValues();

  idRange.forEach((row) => {
    const currentId = parseInt(row[0], 10);
    if (!isNaN(currentId) && currentId > maxId) {
      maxId = currentId;
    }
  });

  return maxId + 1;
}

function applyOrderRowTemplate(newRow, previousLastRow) {
  const maxColumns = orderSheet.getLastColumn();

  if (previousLastRow > 1) {
    const sourceRow = 3;
    const currentLastRow = orderSheet.getLastRow();

    if (currentLastRow >= sourceRow) {
      const sourceRange = orderSheet.getRange(sourceRow, 1, 1, maxColumns);
      const formulas = sourceRange.getFormulas()[0];

      formulas.forEach((formula, index) => {
        if (formula) {
          orderSheet.getRange(newRow, index + 1).setFormula(formula);
        }
      });

      const formatColumns = maxColumns - 1;
      if (formatColumns > 0) {
        const targetFormatRange = orderSheet.getRange(newRow, 1, 1, formatColumns);
        const sourceFormatRange = orderSheet.getRange(sourceRow, 1, 1, formatColumns);
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
      return;
    }
  }

  const formatColumns = maxColumns - 1;
  if (formatColumns > 0) {
    const headerRange = orderSheet.getRange(1, 1, 1, formatColumns);
    const targetRange = orderSheet.getRange(newRow, 1, 1, formatColumns);
    targetRange.setFontFamilies(headerRange.getFontFamilies());
    targetRange.setFontSizes(headerRange.getFontSizes());
    targetRange.setHorizontalAlignments(headerRange.getHorizontalAlignments());
    targetRange.setVerticalAlignments(headerRange.getVerticalAlignments());
    targetRange.setBackgrounds(headerRange.getBackgrounds());
    targetRange.setFontColors(headerRange.getFontColors());
  }
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
  const order = data.order || {};

  try {
    return withInventoryLock(() => {
      const customerValidation = checkCustomerExists(order.customer_id);
      if (!customerValidation.exists) {
        return createErrorResponse(customerValidation.errorMessage);
      }

      let inventoryResult = null;
      let insertedRow = null;

      try {
        inventoryResult = validateAndReserveInventory(order.products);

        const headerMap = getOrderHeaderMap();
        const previousLastRow = orderSheet.getLastRow();
        const newOrderId = order.id || getNextOrderId();

        orderSheet.insertRowAfter(1);
        insertedRow = 2;

        applyOrderRowTemplate(insertedRow, previousLastRow);
        writeOrderFields(
          insertedRow,
          {
            id: newOrderId,
            products: inventoryResult.items,
            customer_id: order.customer_id,
            status: SHEET_ORDER_STATUS_PENDING,
            time: new Date(),
            total_amount: inventoryResult.totalAmount,
            customer_note: order.customer_note || "",
            internal_note: order.internal_note || "",
          },
          headerMap,
          true,
        );

        return createSuccessResponse();
      } catch (error) {
        if (insertedRow) {
          orderSheet.deleteRow(insertedRow);
        }

        if (inventoryResult && inventoryResult.journal && inventoryResult.journal.length > 0) {
          restoreInventoryMutations(inventoryResult.journal);
        }

        return createErrorResponse(error.message);
      }
    });
  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function updateOrder(data) {
  const order = data.order || {};

  try {
    return withInventoryLock(() => {
      const rowToUpdate = findOrderRow(order.id);
      if (!order.id || rowToUpdate === -1) {
        return createErrorResponse("訂單不存在或缺少訂單ID");
      }

      const headerMap = getOrderHeaderMap();
      const existingOrder = getOrderByRow(rowToUpdate, headerMap);
      let transitionResult = null;

      try {
        const updates = {};

        if (Object.prototype.hasOwnProperty.call(order, "status")) {
          transitionResult = applyOrderStatusTransition(
            existingOrder,
            existingOrder.status,
            order.status,
          );
          updates.status = transitionResult.nextSheetStatus;
        }

        if (Object.prototype.hasOwnProperty.call(order, "total_amount")) {
          updates.total_amount = order.total_amount;
        }

        if (Object.prototype.hasOwnProperty.call(order, "internal_note")) {
          updates.internal_note = order.internal_note || "";
        }

        if (Object.keys(updates).length > 0) {
          writeOrderFields(rowToUpdate, updates, headerMap, true);
        }

        return createSuccessResponse();
      } catch (error) {
        if (transitionResult && transitionResult.journal && transitionResult.journal.length > 0) {
          restoreInventoryMutations(transitionResult.journal);
        }

        return createErrorResponse(error.message);
      }
    });
  } catch (error) {
    return createErrorResponse(error.message);
  }
}
