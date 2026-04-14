const CUSTOMER_FIELD_HEADERS = {
  id: "顧客 ID",
  name: "姓名",
  birthday: "生日",
  phone: "電話",
  email: "Email",
  occupation: "職業",
  gender: "性別",
  income_range: "月收入區間",
  household_size: "同住人口數",
  note: "附註",
};

const REQUIRED_CUSTOMER_FIELDS = ["id", "name", "birthday", "phone", "email"];

function normalizeHeaderName(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function getCustomerHeaderRow() {
  const lastColumn = customerSheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error("顧客工作表缺少標題列");
  }

  return customerSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function resolveCustomerColumnIndex(headerRow, fieldKey) {
  const expectedHeader = CUSTOMER_FIELD_HEADERS[fieldKey];
  if (!expectedHeader) {
    return null;
  }

  for (let i = 0; i < headerRow.length; i++) {
    if (normalizeHeaderName(headerRow[i]) === expectedHeader) {
      return i + 1;
    }
  }

  return null;
}

function getCustomerHeaderMap(requiredFields) {
  const headerRow = getCustomerHeaderRow();
  const headerMap = {};

  Object.keys(CUSTOMER_FIELD_HEADERS).forEach((fieldKey) => {
    const columnIndex = resolveCustomerColumnIndex(headerRow, fieldKey);
    if (columnIndex) {
      headerMap[fieldKey] = columnIndex;
    }
  });

  (requiredFields || REQUIRED_CUSTOMER_FIELDS).forEach((fieldKey) => {
    if (!headerMap[fieldKey]) {
      throw new Error(`顧客工作表缺少必要欄位: ${CUSTOMER_FIELD_HEADERS[fieldKey]}`);
    }
  });

  headerMap._headerRow = headerRow;
  return headerMap;
}

function buildCustomerObjectFromRow(row, headerMap) {
  const customer = {};

  Object.keys(CUSTOMER_FIELD_HEADERS).forEach((fieldKey) => {
    const columnIndex = headerMap[fieldKey];
    customer[fieldKey] = columnIndex ? row[columnIndex - 1] : "";
  });

  return customer;
}

function buildCustomerApiObjectFromRow(row, headerMap) {
  const customer = buildCustomerObjectFromRow(row, headerMap);
  return {
    id: customer.id || "",
    name: customer.name || "",
    birthday: customer.birthday || "",
    phone: customer.phone || "",
    email: customer.email || "",
    occupation: customer.occupation || "",
    gender: customer.gender || "",
    income_range: customer.income_range || "",
    household_size: customer.household_size || "",
    note: customer.note || "",
  };
}

function buildCustomerWriteMap(customer) {
  return {
    id: customer.id || "",
    name: customer.name || "",
    birthday: customer.birthday || "",
    phone: customer.phone || "",
    email: customer.email || "",
    occupation: customer.occupation || "",
    gender: customer.gender || "",
    income_range: customer.income_range || "",
    household_size: customer.household_size || "",
    note: customer.note || "",
  };
}

function writeCustomerFields(rowNumber, customer, headerMap, onlyProvidedFields) {
  const writeMap = buildCustomerWriteMap(customer);

  Object.keys(writeMap).forEach((fieldKey) => {
    const columnIndex = headerMap[fieldKey];
    if (!columnIndex) {
      return;
    }

    if (onlyProvidedFields && !Object.prototype.hasOwnProperty.call(customer, fieldKey)) {
      return;
    }

    customerSheet.getRange(rowNumber, columnIndex).setValue(writeMap[fieldKey]);
  });
}
