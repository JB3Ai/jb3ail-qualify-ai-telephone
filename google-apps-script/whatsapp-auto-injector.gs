/**
 * JB3Ai WhatsApp Auto-Injector
 *
 * Watches SOURCE_WHATSAPP for newly edited rows and mirrors them into
 * MZANZI_ENGINE so the React app can pick them up on the next sync cycle.
 *
 * Expected engine layout matches the backend import range:
 *   MZANZI_ENGINE!A:J
 */

const SOURCE_SHEET_NAME = 'SOURCE_WHATSAPP';
const ENGINE_SHEET_NAME = 'MZANZI_ENGINE';
const HEADER_ROW = 1;
const ENGINE_START_COLUMN = 1;
const ENGINE_COLUMN_COUNT = 10; // A:J

/**
 * Triggered when a user edits the spreadsheet.
 *
 * Recommended setup:
 * 1. Open Extensions > Apps Script
 * 2. Paste this file into the Apps Script project
 * 3. Add an installable "On edit" trigger for this function
 */
function onEdit(e) {
  if (!e || !e.source || !e.range) return;

  const sheet = e.range.getSheet();
  if (!sheet || sheet.getName() !== SOURCE_SHEET_NAME) return;
  if (e.range.getRow() <= HEADER_ROW) return;

  const engine = e.source.getSheetByName(ENGINE_SHEET_NAME);
  if (!engine) {
    e.source.toast(`Missing target sheet: ${ENGINE_SHEET_NAME}`, 'JB3Ai Relay');
    return;
  }

  const rowNumber = e.range.getRow();
  const rowData = sheet
    .getRange(rowNumber, ENGINE_START_COLUMN, 1, ENGINE_COLUMN_COUNT)
    .getValues()[0];

  // Skip blank edits that do not contain enough data to be dialed.
  const name = String(rowData[1] || '').trim();
  const phone = String(rowData[2] || '').trim();
  if (!name || !phone) return;

  // Prevent duplicates in the execution engine by checking existing name+phone pairs.
  const lastRow = engine.getLastRow();
  const engineRows = lastRow > HEADER_ROW
    ? engine
        .getRange(HEADER_ROW + 1, ENGINE_START_COLUMN, lastRow - HEADER_ROW, ENGINE_COLUMN_COUNT)
        .getValues()
    : [];

  const duplicateExists = engineRows.some((existingRow) => {
    const existingName = String(existingRow[1] || '').trim();
    const existingPhone = String(existingRow[2] || '').trim();
    return existingName === name && existingPhone === phone;
  });

  if (duplicateExists) {
    e.source.toast('Lead already present in Execution Engine', 'JB3Ai Relay');
    return;
  }

  engine.appendRow(rowData);
  e.source.toast('Lead Injected from WhatsApp to Execution Engine', 'JB3Ai Relay');
}
