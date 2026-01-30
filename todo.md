# TODO List

## GAS

- ✅ 發信側欄與分群發信（已實作）
  - 分群依據：「顧客」工作表中的「RFM會員類型」或「CAI購買行為趨勢」或「象限分類」（可用下拉式選單選擇）
  - 選擇哪一群：可多選，自動取得欄中所有分群（使用 `getDistinctGroupValues`）
  - 發信方式：可選擇 email 或 LINE（使用 `sendMessages`；Email 使用 `MailApp.sendEmail`，LINE 支援 `LINE Notify` 或自訂 `line_api_url`）
  - 變數代換：支援 `{{customerName}}`、`{{customerEmail}}`、`{{customerPhone}}`，UI 提供按鈕自動插入
  - 實作檔案：`gas/SendSidebar.html`, `gas/send_sidebar.gs`，並新增快速選單項目「行銷 / 發信側欄」於 `gas/main.gs`
- 結合llm生成各群行銷信內文（下一步：在側欄加入「自動生成」按鈕，呼叫外部 LLM API 產生內容）
