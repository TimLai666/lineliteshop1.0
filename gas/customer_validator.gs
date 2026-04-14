/**
 * Check whether a customer exists by ID.
 * Customer ID is still expected to live in column A.
 */
function checkCustomerExists(customerId) {
  if (!customerId || String(customerId).trim() === "") {
    return {
      exists: false,
      customerRow: null,
      customerInfo: null,
      errorMessage: "顧客ID不能為空",
    };
  }

  const lastRow = customerSheet.getLastRow();
  if (lastRow < 1) {
    return {
      exists: false,
      customerRow: null,
      customerInfo: null,
      errorMessage: `找不到顧客ID: ${customerId}`,
    };
  }

  const customerIds = customerSheet.getRange(1, 1, lastRow, 1).getValues();
  let customerRow = null;
  for (let i = 0; i < customerIds.length; i++) {
    if (
      customerIds[i][0] &&
      String(customerIds[i][0]).trim() === String(customerId).trim()
    ) {
      customerRow = i + 1;
      break;
    }
  }

  if (!customerRow) {
    return {
      exists: false,
      customerRow: null,
      customerInfo: null,
      errorMessage: `找不到顧客ID: ${customerId}`,
    };
  }

  const headerMap = getCustomerHeaderMap();
  const customerData = customerSheet
    .getRange(customerRow, 1, 1, customerSheet.getLastColumn())
    .getValues()[0];

  return {
    exists: true,
    customerRow,
    customerInfo: buildCustomerApiObjectFromRow(customerData, headerMap),
    errorMessage: null,
  };
}
