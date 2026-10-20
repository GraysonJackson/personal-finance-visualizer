import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripBomAndNormalizeNewlines,
  parseISODate,
  detectColumnMapping,
  parseCSVWithPapa,
  validateAndTransformRows,
} from '../src/js/parser.js';

test('stripBomAndNormalizeNewlines strips UTF-8 BOM and normalizes CRLF', () => {
  const inputWithBom = '\uFEFFDate,Amount\r\n2026-10-18,2500\r\n2026-10-14,-1850\r\n';
  const cleaned = stripBomAndNormalizeNewlines(inputWithBom);
  assert.equal(cleaned.charCodeAt(0) !== 0xFEFF, true);
  assert.equal(cleaned.includes('\r'), false);
  assert.equal(cleaned, 'Date,Amount\n2026-10-18,2500\n2026-10-14,-1850\n');
});

test('parseISODate strictly validates calendar dates and leap years', () => {
  // Valid dates
  assert.deepEqual(parseISODate('2026-10-18'), { date: '2026-10-18', isValid: true });
  assert.deepEqual(parseISODate('2026/04/05'), { date: '2026-04-05', isValid: true });
  assert.deepEqual(parseISODate('10/18/2026'), { date: '2026-10-18', isValid: true });
  assert.deepEqual(parseISODate('2024-02-29'), { date: '2024-02-29', isValid: true }); // Leap year

  // Invalid dates
  assert.equal(parseISODate('2026-02-29').isValid, false); // 2026 is not a leap year
  assert.equal(parseISODate('2026-02-31').isValid, false);
  assert.equal(parseISODate('2026-13-01').isValid, false);
  assert.equal(parseISODate('not-a-date').isValid, false);
  assert.equal(parseISODate('').isValid, false);
});

test('detectColumnMapping detects standard and varied column names', () => {
  const headers = ['Transaction Date', 'Memo / Details', 'Spending Group', 'Net Amount', 'Entry Type'];
  const mapping = detectColumnMapping(headers);
  assert.equal(mapping.dateCol, 'Transaction Date');
  assert.equal(mapping.descCol, 'Memo / Details');
  assert.equal(mapping.categoryCol, 'Spending Group');
  assert.equal(mapping.amountCol, 'Net Amount');
  assert.equal(mapping.typeCol, 'Entry Type');
});

test('parseCSVWithPapa correctly handles quoted fields with commas and newlines', async () => {
  const csvContent =
    'Date,Description,Category,Amount\n' +
    '2026-10-18,"Client Retainer, Alpha\n(Q3 Milestone)",Contracts,$2500.00\n' +
    '2026-10-14,"Studio Lease, Floor 4",Housing,-$1850.00\n';

  const { data, headers, errors } = await parseCSVWithPapa(csvContent);
  assert.equal(errors.length, 0);
  assert.equal(headers.length, 4);
  assert.equal(data.length, 2);
  assert.equal(data[0].Description, 'Client Retainer, Alpha\n(Q3 Milestone)');
  assert.equal(data[1].Description, 'Studio Lease, Floor 4');
});

test('validateAndTransformRows generates canonical dataset and reports errors', () => {
  const rows = [
    { Date: '2026-10-18', Description: 'Retainer Alpha', Category: 'Contracts', Amount: '2500.00', Type: 'income' },
    { Date: '2026-10-14', Description: 'Studio Lease', Category: 'Housing', Amount: '1850.00', Type: 'expense' },
    { Date: 'bad-date', Description: 'Corrupt', Category: 'Misc', Amount: '100.00', Type: 'expense' },
    { Date: '2026-10-10', Description: 'No Amount', Category: 'Misc', Amount: '$abc', Type: 'expense' },
  ];

  const colMap = {
    dateCol: 'Date',
    descCol: 'Description',
    categoryCol: 'Category',
    amountCol: 'Amount',
    typeCol: 'Type',
  };

  const result = validateAndTransformRows(rows, colMap);
  assert.equal(result.totalRows, 4);
  assert.equal(result.validCount, 2);
  assert.equal(result.errorCount, 2);
  assert.equal(result.validTransactions[0].amountInCents, 250000);
  assert.equal(result.validTransactions[0].type, 'income');
  assert.equal(result.validTransactions[1].amountInCents, 185000);
  assert.equal(result.validTransactions[1].type, 'expense');
  assert.match(result.invalidRows[0].error, /Date error/);
  assert.match(result.invalidRows[1].error, /Amount error/);
});
