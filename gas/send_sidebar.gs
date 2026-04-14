const lineBackendUrl = "https://lineliteshop.hazelnut-paradise.com/api/line/message";

function showSendSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("SendSidebar")
    .setTitle("訊息發送")
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getGroupingFields() {
  return ["RFM會員類型", "CAI購買行為趨勢", "象限分類"];
}

function getDistinctGroupValues(fieldName) {
  const header = getCustomerHeaderRow();
  const colIndex = header.indexOf(fieldName);

  let values = [];
  if (colIndex !== -1) {
    const col = colIndex + 1;
    const data = customerSheet
      .getRange(2, col, Math.max(0, customerSheet.getLastRow() - 1), 1)
      .getValues()
      .flat();
    values = data.filter((v) => v !== "" && v !== null).map(String);
  } else if (fieldName === "RFM會員類型" && typeof rfmSheet !== "undefined") {
    values = rfmSheet
      .getDataRange()
      .getValues()
      .slice(1)
      .map((row) => row[1])
      .filter((v) => v !== "" && v !== null)
      .map(String);
  } else if (fieldName === "CAI購買行為趨勢" && typeof caiSheet !== "undefined") {
    values = caiSheet
      .getDataRange()
      .getValues()
      .slice(1)
      .map((row) => row[1])
      .filter((v) => v !== "" && v !== null)
      .map(String);
  }

  return Array.from(new Set(values)).sort();
}

function getLineRecipientField() {
  return settings.line_recipient_field || settings.LINE_RECIPIENT_FIELD || "id";
}

function findRecipientColumnIndex(header) {
  const preferredField = getLineRecipientField();
  const fieldKeyMap = {
    id: "id",
    phone: "phone",
    email: "email",
  };

  if (fieldKeyMap[preferredField]) {
    const mappedIndex = resolveCustomerColumnIndex(header, fieldKeyMap[preferredField]);
    if (mappedIndex) {
      return mappedIndex;
    }
  }

  const aliases = [preferredField, "line_id", "lineId", "LINE_ID", "lineid", "line"];

  for (let i = 0; i < aliases.length; i++) {
    const idx = header.indexOf(aliases[i]);
    if (idx !== -1) {
      return idx + 1;
    }
  }

  const fallbackFields = ["id", "phone", "email"];
  for (let i = 0; i < fallbackFields.length; i++) {
    const fallbackIndex = resolveCustomerColumnIndex(header, fallbackFields[i]);
    if (fallbackIndex) {
      return fallbackIndex;
    }
  }

  return null;
}

function sendMessages(payload) {
  const { fieldName, groups, channel, subject, message } = payload;

  if (!groups || groups.length === 0) {
    return { status: "error", message: "請至少選擇一個分群值" };
  }

  const header = getCustomerHeaderRow();
  const colIndex = header.indexOf(fieldName);
  if (colIndex === -1) {
    return { status: "error", message: `找不到欄位: ${fieldName}` };
  }

  const headerMap = getCustomerHeaderMap();
  const recipientColumn = findRecipientColumnIndex(header);
  const rows = customerSheet
    .getRange(2, 1, Math.max(0, customerSheet.getLastRow() - 1), customerSheet.getLastColumn())
    .getValues();

  const results = [];

  rows.forEach((row) => {
    const value = row[colIndex];
    if (!value || groups.indexOf(String(value)) === -1) {
      return;
    }

    const customer = buildCustomerApiObjectFromRow(row, headerMap);
    customer.recipient = recipientColumn ? row[recipientColumn - 1] : "";

    const msg = expandTemplate(message, customer);

    if (channel === "email") {
      if (!customer.email) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "無電子郵件" });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "skipped", "無電子郵件");
        return;
      }

      try {
        MailApp.sendEmail({
          to: customer.email,
          subject: subject || "行銷通知",
          htmlBody: msg,
        });
        results.push({ id: customer.id, name: customer.name, status: "sent" });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "sent", "");
      } catch (error) {
        results.push({ id: customer.id, name: customer.name, status: "error", reason: error.message });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "error", error.message);
      }
      return;
    }

    if (channel === "line") {
      const backendToken = settings.token;
      if (!customer.recipient) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "無法取得 LINE 收件者" });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "skipped", "無法取得 LINE 收件者");
        return;
      }

      if (!backendToken) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "未設定 token" });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "skipped", "未設定 token");
        return;
      }

      try {
        const resp = UrlFetchApp.fetch(lineBackendUrl, {
          method: "post",
          contentType: "application/json",
          headers: { Authorization: "Bearer " + backendToken },
          payload: JSON.stringify({
            userId: String(customer.recipient),
            message: msg,
            notificationDisabled: false,
          }),
          muteHttpExceptions: true,
        });

        const code = resp.getResponseCode();
        const body = resp.getContentText();
        if (code >= 200 && code < 300) {
          results.push({ id: customer.id, name: customer.name, status: "sent", responseCode: code, responseBody: body });
          appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "sent", `code:${code}`);
        } else {
          results.push({ id: customer.id, name: customer.name, status: "error", reason: `HTTP ${code}: ${body}` });
          appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "error", `HTTP ${code}: ${body}`);
        }
      } catch (error) {
        results.push({ id: customer.id, name: customer.name, status: "error", reason: error.message });
        appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "error", error.message);
      }
      return;
    }

    results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "未知通道" });
    appendSendLog(new Date(), channel, fieldName, value, customer, subject || "", msg, "skipped", "未知通道");
  });

  return { status: "success", results };
}

function expandTemplate(tpl, customer) {
  if (!tpl) {
    return "";
  }

  let res = tpl;
  res = res.replace(/{{\s*customerName\s*}}/gi, customer.name || "");
  res = res.replace(/{{\s*customerEmail\s*}}/gi, customer.email || "");
  res = res.replace(/{{\s*customerPhone\s*}}/gi, customer.phone || "");
  return res;
}

function appendSendLog(time, channel, field, groupValue, customer, subject, message, status, note) {
  const sheetName = "發信紀錄";
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet
      .getRange(1, 1, 1, 9)
      .setValues([["時間", "通道", "分群欄位", "分群值", "顧客ID", "顧客姓名", "收件/目標", "狀態", "備註"]]);
  }

  const target = channel === "email"
    ? customer.email || ""
    : customer.recipient || customer.id || customer.phone || "";

  sheet.appendRow([time, channel, field, groupValue, customer.id, customer.name, target, status, note || ""]);
}
