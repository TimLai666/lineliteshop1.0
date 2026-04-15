function doGet(e) {
  if (!e.parameter.token || e.parameter.token !== settings.token) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Invalid or missing token",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (!e.parameter.sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Missing sheet parameter",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  switch (e.parameter.sheet) {
    case "CATEGORIES":
      return getCategories();
    case "PRODUCTS":
      return getProducts();
    case "CUSTOMERS":
      return getCustomers();
    case "ORDERS":
      return getOrders();
    default:
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "error",
          message: "Invalid sheet parameter",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCategories() {
  if (!categorySheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Sheet not found",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const data = categorySheet.getDataRange().getValues();
  const categories = data.slice(1).map((row) => ({
    name: row[0],
    description: row[1],
    is_active: row[2] === "是",
  }));

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: categories,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function getProducts() {
  if (!productSheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Sheet not found",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headerMap = getProductHeaderMap();
  const data = productSheet.getDataRange().getValues();
  const products = data.slice(1).map((row) => buildProductApiObjectFromRow(row, headerMap));

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: products,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function getCustomers() {
  if (!customerSheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Sheet not found",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headerMap = getCustomerHeaderMap();
  const data = customerSheet.getDataRange().getValues();
  const customers = data.slice(1).map((row) => buildCustomerApiObjectFromRow(row, headerMap));

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: customers,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function getOrders() {
  if (!orderSheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Sheet not found",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headerMap = getOrderHeaderMap();
  const data = orderSheet.getDataRange().getValues();
  const orders = data
    .slice(1)
    .map((row, index) => buildOrderObjectFromRow(row, index + 2, headerMap))
    .map((order) => ({
      id: order.id,
      products: order.products,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      status: order.status,
      time: order.time,
      totalAmount: order.total_amount,
      customer_note: order.customer_note,
      internal_note: order.internal_note,
    }));

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: orders,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
