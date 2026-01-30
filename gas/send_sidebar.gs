/**
 * 發信側欄相關功能
 */

const lineBackendUrl = "https://lineliteshop.hazelnut-paradise.com/api/line/message"

function showSendSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('SendSidebar')
        .setTitle('發信側欄')
        .setWidth(350);
    SpreadsheetApp.getUi().showSidebar(html);
}

function getGroupingFields() {
    // 可擴充的欄位名稱
    return ['RFM會員類型', 'CAI購買行為趨勢', '象限分類'];
}

function getDistinctGroupValues(fieldName) {
    // 先嘗試在 `顧客` 表格中尋找欄名
    const header = customerSheet.getRange(1, 1, 1, customerSheet.getLastColumn()).getValues()[0];
    const colIndex = header.indexOf(fieldName);

    let values = [];
    if (colIndex !== -1) {
        const col = colIndex + 1;
        const data = customerSheet.getRange(2, col, Math.max(0, customerSheet.getLastRow() - 1), 1).getValues().flat();
        values = data.filter(v => v !== '' && v !== null).map(String);
    } else {
        // fallback：如果欄位不在顧客表，嘗試從 RFM 或 CAI sheet 取得
        if (fieldName === 'RFM會員類型' && typeof rfmSheet !== 'undefined') {
            const data = rfmSheet.getDataRange().getValues().slice(1).map(r => r[1]);
            values = data.filter(v => v !== '' && v !== null).map(String);
        } else if (fieldName === 'CAI購買行為趨勢' && typeof caiSheet !== 'undefined') {
            const data = caiSheet.getDataRange().getValues().slice(1).map(r => r[1]);
            values = data.filter(v => v !== '' && v !== null).map(String);
        }
    }

    // 去重並排序
    const unique = Array.from(new Set(values)).sort();
    return unique;
}

function getLineRecipientField() {
    // 支援小寫或大寫的設定 key
    return settings.line_recipient_field || settings.LINE_RECIPIENT_FIELD || 'id';
}

function sendMessages(payload) {
    // payload: { fieldName, groups: [], channel: 'email'|'line', subject, message }
    const { fieldName, groups, channel, subject, message } = payload;

    if (!groups || groups.length === 0) {
        return { status: 'error', message: '未選擇任何分群' };
    }

    // 找到對應欄
    const header = customerSheet.getRange(1, 1, 1, customerSheet.getLastColumn()).getValues()[0];
    const colIndex = header.indexOf(fieldName);
    if (colIndex === -1) {
        return { status: 'error', message: `找不到欄位：${fieldName}` };
    }
    const col = colIndex + 1;

    // 設定要當作 LINE 收件者的欄位
    const recipientField = getLineRecipientField();
    let recipientColIndex = header.indexOf(recipientField);
    if (recipientColIndex === -1) {
        // 嘗試常見別名
        const aliases = ['line_id', 'lineId', 'LINE_ID', 'lineid', 'line', 'id', 'phone', 'email'];
        for (let a of aliases) {
            const idx = header.indexOf(a);
            if (idx !== -1) { recipientColIndex = idx; break; }
        }
    }

    const rows = customerSheet.getRange(2, 1, Math.max(0, customerSheet.getLastRow() - 1), customerSheet.getLastColumn()).getValues();

    const results = [];

    rows.forEach((row, i) => {
        const value = row[col - 1];
        if (value && groups.indexOf(String(value)) !== -1) {
            const recipient = row[0];
            const customer = {
                id: row[0],
                name: row[1],
                birthday: row[2],
                phone: row[3],
                email: row[4],
                note: row[5],
                recipient: recipient
            };

            const msg = expandTemplate(message, customer);

            if (channel === 'email') {
                if (!customer.email) {
                    results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '無電子郵件' });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'skipped', '無電子郵件');
                    return;
                }
                try {
                    MailApp.sendEmail({
                        to: customer.email,
                        subject: subject || '行銷訊息',
                        htmlBody: msg
                    });
                    results.push({ id: customer.id, name: customer.name, status: 'sent' });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'sent', '');
                } catch (e) {
                    results.push({ id: customer.id, name: customer.name, status: 'error', reason: e.message });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'error', e.message);
                }
            } else if (channel === 'line') {
                const backendToken = settings.token

                if (!recipient) {
                    results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '無法取得收件者' });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'skipped', '無法取得收件者W');
                    return;
                }

                if (!backendToken) {
                    results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '未設定 token' });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'skipped', '未設定 token');
                    return;
                }

                try {
                    const resp = UrlFetchApp.fetch(lineBackendUrl, {
                        method: 'post',
                        contentType: 'application/json',
                        headers: { Authorization: 'Bearer ' + backendToken },
                        payload: JSON.stringify({ userId: String(recipient), message: msg, notificationDisabled: false }),
                        muteHttpExceptions: true
                    });
                    const code = resp.getResponseCode();
                    const body = resp.getContentText();
                    if (code >= 200 && code < 300) {
                        results.push({ id: customer.id, name: customer.name, status: 'sent', responseCode: code, responseBody: body });
                        appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'sent', `code:${code}`);
                    } else {
                        results.push({ id: customer.id, name: customer.name, status: 'error', reason: `HTTP ${code}: ${body}` });
                        appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'error', `HTTP ${code}: ${body}`);
                    }
                } catch (e) {
                    results.push({ id: customer.id, name: customer.name, status: 'error', reason: e.message });
                    appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'error', e.message);
                }
            } else {
                results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '未知通道' });
                appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, 'skipped', '未知通道');
            }
        }
    });

    return { status: 'success', results };
}

function expandTemplate(tpl, customer) {
    if (!tpl) return '';
    let res = tpl;
    res = res.replace(/{{\s*customerName\s*}}/gi, customer.name || '');
    res = res.replace(/{{\s*customerEmail\s*}}/gi, customer.email || '');
    res = res.replace(/{{\s*customerPhone\s*}}/gi, customer.phone || '');
    // 可擴充更多變數
    return res;
}

function appendSendLog(time, channel, field, groupValue, customer, subject, message, status, note) {
    const sheetName = '發信紀錄';
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, 9).setValues([['時間', '通道', '分群欄位', '分群值', '顧客ID', '顧客姓名', '收件/目標', '狀態', '備註']]);
    }
    const target = channel === 'email' ? (customer.email || '') : (customer.recipient || customer.id || customer.phone || '');
    sheet.appendRow([time, channel, field, groupValue, customer.id, customer.name, target, status, note || '']);
}
