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
    is_active: row[2] === "上架",
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

  const data = orderSheet.getDataRange().getValues();
  const orders = data.slice(1).map((row) => ({
    id: row[0],
    products: row[1]
      ? row[1].split(", ").map((item) => {
          const [product, quantity] = item.split("*");
          return { product, quantity: parseInt(quantity, 10) || 0 };
        })
      : [],
    customer_id: row[2],
    customer_name: row[3],
    status: row[4],
    time: row[5],
    totalAmount: row[6],
    customer_note: row[7],
    internal_note: row[8],
  }));

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: orders,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
