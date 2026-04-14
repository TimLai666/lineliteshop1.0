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
    const column = colIndex + 1;
    values = customerSheet
      .getRange(2, column, Math.max(0, customerSheet.getLastRow() - 1), 1)
      .getValues()
      .flat()
      .filter((value) => value !== "" && value !== null)
      .map(String);
  } else if (fieldName === "RFM會員類型" && typeof rfmSheet !== "undefined") {
    values = rfmSheet
      .getDataRange()
      .getValues()
      .slice(1)
      .map((row) => row[1])
      .filter((value) => value !== "" && value !== null)
      .map(String);
  } else if (fieldName === "CAI購買行為趨勢" && typeof caiSheet !== "undefined") {
    values = caiSheet
      .getDataRange()
      .getValues()
      .slice(1)
      .map((row) => row[1])
      .filter((value) => value !== "" && value !== null)
      .map(String);
  }

  return Array.from(new Set(values)).sort();
}

function getLineRecipientField() {
  return settings.line_recipient_field || settings.LINE_RECIPIENT_FIELD || "顧客 ID";
}

function findRecipientColumnIndex(headerRow) {
  const preferredHeader = normalizeHeaderName(getLineRecipientField());
  for (let i = 0; i < headerRow.length; i++) {
    if (normalizeHeaderName(headerRow[i]) === preferredHeader) {
      return i + 1;
    }
  }

  return null;
}

function sendMessages(payload) {
  const { fieldName, groups, channel, subject, message } = payload;

  if (!groups || groups.length === 0) {
    return { status: "error", message: "請至少選擇一個分群值" };
  }

  const headerRow = getCustomerHeaderRow();
  const groupColumnIndex = headerRow.indexOf(fieldName);
  if (groupColumnIndex === -1) {
    return { status: "error", message: `找不到欄位: ${fieldName}` };
  }

  const headerMap = getCustomerHeaderMap();
  const recipientColumnIndex = findRecipientColumnIndex(headerRow);
  if (!recipientColumnIndex) {
    return { status: "error", message: `找不到收件欄位: ${getLineRecipientField()}` };
  }

  const rows = customerSheet
    .getRange(2, 1, Math.max(0, customerSheet.getLastRow() - 1), customerSheet.getLastColumn())
    .getValues();

  const results = [];

  rows.forEach((row) => {
    const groupValue = row[groupColumnIndex];
    if (!groupValue || groups.indexOf(String(groupValue)) === -1) {
      return;
    }

    const customer = buildCustomerApiObjectFromRow(row, headerMap);
    customer.recipient = row[recipientColumnIndex - 1] || "";

    const expandedMessage = expandTemplate(message, customer);

    if (channel === "email") {
      if (!customer.email) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "無電子郵件" });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "skipped", "無電子郵件");
        return;
      }

      try {
        MailApp.sendEmail({
          to: customer.email,
          subject: subject || "行銷通知",
          htmlBody: expandedMessage,
        });
        results.push({ id: customer.id, name: customer.name, status: "sent" });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "sent", "");
      } catch (error) {
        results.push({ id: customer.id, name: customer.name, status: "error", reason: error.message });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "error", error.message);
      }
      return;
    }

    if (channel === "line") {
      const backendToken = settings.token;
      if (!customer.recipient) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "無法取得 LINE 收件者" });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "skipped", "無法取得 LINE 收件者");
        return;
      }

      if (!backendToken) {
        results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "未設定 token" });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "skipped", "未設定 token");
        return;
      }

      try {
        const response = UrlFetchApp.fetch(lineBackendUrl, {
          method: "post",
          contentType: "application/json",
          headers: { Authorization: "Bearer " + backendToken },
          payload: JSON.stringify({
            userId: String(customer.recipient),
            message: expandedMessage,
            notificationDisabled: false,
          }),
          muteHttpExceptions: true,
        });

        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();
        if (responseCode >= 200 && responseCode < 300) {
          results.push({ id: customer.id, name: customer.name, status: "sent", responseCode, responseBody });
          appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "sent", `code:${responseCode}`);
        } else {
          results.push({ id: customer.id, name: customer.name, status: "error", reason: `HTTP ${responseCode}: ${responseBody}` });
          appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "error", `HTTP ${responseCode}: ${responseBody}`);
        }
      } catch (error) {
        results.push({ id: customer.id, name: customer.name, status: "error", reason: error.message });
        appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "error", error.message);
      }
      return;
    }

    results.push({ id: customer.id, name: customer.name, status: "skipped", reason: "未知通道" });
    appendSendLog(new Date(), channel, fieldName, groupValue, customer, subject || "", expandedMessage, "skipped", "未知通道");
  });

  return { status: "success", results };
}

function expandTemplate(tpl, customer) {
  if (!tpl) {
    return "";
  }

  let result = tpl;
  result = result.replace(/{{\s*customerName\s*}}/gi, customer.name || "");
  result = result.replace(/{{\s*customerEmail\s*}}/gi, customer.email || "");
  result = result.replace(/{{\s*customerPhone\s*}}/gi, customer.phone || "");
  return result;
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
    : customer.recipient || "";

  sheet.appendRow([time, channel, field, groupValue, customer.id, customer.name, target, status, note || ""]);
}
