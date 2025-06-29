/**
 * 檢查某值是否在指定欄位中唯一（未出現過）
 * @param {Sheet} sheet - 要檢查的工作表
 * @param {number} column - 欲檢查的欄位編號（1 為 A欄）
 * @param {any} value - 欲驗證的值
 * @param {number} excludeRow - 要排除檢查的列號（通常是當前編輯的列）
 * @return {boolean} - true 表示沒出現過（唯一），false 表示重複
 */
function isUniqueInColumn(sheet, column, value, excludeRow = null) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return true; // 無資料就視為唯一

  const range = sheet.getRange(2, column, lastRow - 1); // 跳過標題列
  const values = range.getValues();

  // 檢查值是否重複，但排除指定的列
  for (let i = 0; i < values.length; i++) {
    const currentRow = i + 2; // 因為從第2列開始
    if (excludeRow && currentRow === excludeRow) {
      continue; // 跳過當前編輯的列
    }
    if (values[i][0] === value) {
      return false; // 找到重複值
    }
  }

  return true; // 沒有找到重複值
}
