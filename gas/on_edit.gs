function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  let value;
  if (col === 1 && row > 1) {
    value = e.range.getValue();
  }

  // todo: 根據工作表名稱和欄位值進行處理
  switch (sheetName) {}
}