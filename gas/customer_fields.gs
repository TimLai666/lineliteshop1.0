const CUSTOMER_FIELD_ALIASES = {
  id: ["顧客ID", "顧客 ID", "ID", "id"],
  name: ["姓名", "name", "Name"],
  birthday: ["生日", "birthday", "Birthday"],
  phone: ["電話", "phone", "Phone"],
  email: ["Email", "email", "電子郵件", "電子郵件地址"],
  occupation: ["職業", "occupation", "Occupation"],
  gender: ["性別", "gender", "Gender"],
  income_range: ["月收入區間", "income_range", "incomeRange", "Income Range"],
  household_size: ["同住人口數", "household_size", "householdSize", "Household Size"],
  note: ["附註", "備註", "note", "Note"],
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
  const aliases = CUSTOMER_FIELD_ALIASES[fieldKey] || [fieldKey];
  for (let i = 0; i < headerRow.length; i++) {
    const headerName = normalizeHeaderName(headerRow[i]);
    if (aliases.indexOf(headerName) !== -1) {
      return i + 1;
    }
  }
  return null;
}

function getCustomerHeaderMap(requiredFields) {
  const headerRow = getCustomerHeaderRow();
  const headerMap = {};

  Object.keys(CUSTOMER_FIELD_ALIASES).forEach((fieldKey) => {
    const columnIndex = resolveCustomerColumnIndex(headerRow, fieldKey);
    if (columnIndex) {
      headerMap[fieldKey] = columnIndex;
    }
  });

  (requiredFields || REQUIRED_CUSTOMER_FIELDS).forEach((fieldKey) => {
    if (!headerMap[fieldKey]) {
      const aliases = CUSTOMER_FIELD_ALIASES[fieldKey] || [fieldKey];
      throw new Error(`顧客工作表缺少必要欄位: ${aliases[0]}`);
    }
  });

  headerMap._headerRow = headerRow;
  return headerMap;
}

function buildCustomerObjectFromRow(row, headerMap) {
  const customer = {};
  Object.keys(CUSTOMER_FIELD_ALIASES).forEach((fieldKey) => {
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
