/**
 * 檢查某值是否在指定欄位中唯一（未出現過）
 * @param {Sheet} sheet - 要檢查的工作表
 * @param {number} column - 欲檢查的欄位編號（1 為 A欄）
 * @param {any} value - 欲驗證的值
 * @return {boolean} - true 表示沒出現過（唯一），false 表示重複
 */
function isUniqueInColumn(sheet, column, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return true; // 無資料就視為唯一

  const range = sheet.getRange(2, column, lastRow - 1); // 跳過標題列
  const values = range.getValues().flat();

  return !values.includes(value);
}
