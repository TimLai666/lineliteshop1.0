/**
 * 發信側欄相關功能
 */

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

    const rows = customerSheet.getRange(2, 1, Math.max(0, customerSheet.getLastRow() - 1), customerSheet.getLastColumn()).getValues();

    const results = [];

    rows.forEach((row, i) => {
        const value = row[col - 1];
        if (value && groups.indexOf(String(value)) !== -1) {
            const customer = {
                id: row[0],
                name: row[1],
                birthday: row[2],
                phone: row[3],
                email: row[4],
                note: row[5]
            };

            const msg = expandTemplate(message, customer);

            if (channel === 'email') {
                if (!customer.email) {
                    results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '無電子郵件' });
                    return;
                }
                try {
                    MailApp.sendEmail({
                        to: customer.email,
                        subject: subject || '行銷訊息',
                        htmlBody: msg
                    });
                    results.push({ id: customer.id, name: customer.name, status: 'sent' });
                } catch (e) {
                    results.push({ id: customer.id, name: customer.name, status: 'error', reason: e.message });
                }
            } else if (channel === 'line') {
                // LINE 傳送：優先使用 settings 中的 URL 或 TOKEN
                const lineApiUrl = settings.line_api_url || settings.LINE_API_URL;
                const lineToken = settings.line_token || settings.LINE_NOTIFY_TOKEN;

                if (lineApiUrl) {
                    try {
                        const resp = UrlFetchApp.fetch(lineApiUrl, {
                            method: 'post',
                            contentType: 'application/json',
                            payload: JSON.stringify({ to: customer.id, message: msg })
                        });
                        results.push({ id: customer.id, name: customer.name, status: 'sent', responseCode: resp.getResponseCode() });
                    } catch (e) {
                        results.push({ id: customer.id, name: customer.name, status: 'error', reason: e.message });
                    }
                } else if (lineToken) {
                    // LINE Notify（單向）
                    try {
                        const resp = UrlFetchApp.fetch('https://notify-api.line.me/api/notify', {
                            method: 'post',
                            payload: { message: msg },
                            headers: { Authorization: 'Bearer ' + lineToken }
                        });
                        results.push({ id: customer.id, name: customer.name, status: 'sent', responseCode: resp.getResponseCode() });
                    } catch (e) {
                        results.push({ id: customer.id, name: customer.name, status: 'error', reason: e.message });
                    }
                } else {
                    results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: 'LINE 設定未配置' });
                }
            } else {
                results.push({ id: customer.id, name: customer.name, status: 'skipped', reason: '未知通道' });
            }

            // 紀錄到發信紀錄 sheet
            appendSendLog(new Date(), channel, fieldName, value, customer, subject || '', msg, results[results.length - 1].status);
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

function appendSendLog(time, channel, field, groupValue, customer, subject, message, status) {
    const sheetName = '發信紀錄';
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, 8).setValues([['時間', '通道', '分群欄位', '分群值', '顧客ID', '顧客姓名', '收件/目標', '狀態']]);
    }
    const target = channel === 'email' ? (customer.email || '') : (customer.id || customer.phone || '');
    sheet.appendRow([time, channel, field, groupValue, customer.id, customer.name, target, status]);
}
