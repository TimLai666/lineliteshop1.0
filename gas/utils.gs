function getValuesOfSheet(sheet) {
  // Read raw values from the sheet
  const values = sheet.getDataRange().getValues();

  // Iterate and detect date-like cells, converting them to "yyyy/MM/dd HH:mm:ss"
  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const cell = values[r][c];

      try {
        // 1) Native Date objects (common when Sheets cell is a date)
        if (cell instanceof Date) {
          values[r][c] = formatDateToYYYYMMDD_HHMMSS(cell);
          continue;
        }
      } catch (e) {
        // If any parsing/formatting error occurs, leave the original cell value unchanged.
      }
    }
  }

  return values;
}

function setValuesToSheet(sheet, values) {
  // Write values back to the sheet
  const range = sheet.getRange(1, 1, values.length, values[0].length);
  range.setValues(values);
  Logger.log("Set values to sheet: " + sheet.getName());
}

/**
 * Format a Date (or date-string / timestamp) into "yyyy/MM/dd HH:mm:ss"
 *
 * Examples:
 *   formatToYYYYMMDD_HHMMSS(new Date())                        -> "2025/09/04 15:34:40"
 *   formatToYYYYMMDD_HHMMSS('Thu Sep 04 15:34:40 GMT+08:00 2025') -> "2025/09/04 15:34:40"
 *   formatToYYYYMMDD_HHMMSS(1630751680000)                    -> "2021/09/04 15:34:40"
 *
 * Notes:
 * - Accepts a Date object, a string parseable by the Date constructor, or a numeric timestamp (ms).
 * - Throws an Error on invalid input.
 */
function formatDateToYYYYMMDD_HHMMSS(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date input: " + input);
  }
  const pad = function (n) {
    return ("0" + n).slice(-2);
  };
  return (
    d.getFullYear() +
    "/" +
    pad(d.getMonth() + 1) +
    "/" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}
