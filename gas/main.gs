const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const categorySheet = spreadsheet.getSheetByName('商品類別');
const productSheet = spreadsheet.getSheetByName('商品');
const customerSheet = spreadsheet.getSheetByName('顧客');
const orderSheet = spreadsheet.getSheetByName('訂單');