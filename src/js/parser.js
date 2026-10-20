import Papa from 'papaparse';
import { parseCurrencyToCents } from './currency.js';

/**
 * Strips UTF-8 BOM (\uFEFF) and normalizes CRLF (\r\n) or CR (\r) newlines to LF (\n).
 * @param {string} rawText
 * @returns {string}
 */
export function stripBomAndNormalizeNewlines(rawText) {
  if (typeof rawText !== 'string') return '';
  let cleaned = rawText;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }
  // Normalize CRLF and standalone CR to LF
  return cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Strict date parsing and validation.
 * Accepts ISO format (YYYY-MM-DD) and standard common formats,
 * strictly validating calendar validity and returning YYYY-MM-DD.
 * Rejects invalid dates like '2026-02-31' or non-dates.
 *
 * @param {string} rawDate
 * @returns {{ date: string, isValid: boolean, error?: string }}
 */
export function parseISODate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string') {
    return { date: '', isValid: false, error: 'Empty date' };
  }

  const str = rawDate.trim();
  if (!str) {
    return { date: '', isValid: false, error: 'Empty date' };
  }

  // 1. Strict ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year, month, day;

  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else {
    // 2. Try YYYY/MM/DD
    const slashYmd = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (slashYmd) {
      year = parseInt(slashYmd[1], 10);
      month = parseInt(slashYmd[2], 10);
      day = parseInt(slashYmd[3], 10);
    } else {
      // 3. Try MM/DD/YYYY or M/D/YYYY
      const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (mdy) {
        year = parseInt(mdy[3], 10);
        month = parseInt(mdy[1], 10);
        day = parseInt(mdy[2], 10);
      } else {
        // 4. Try DD-MM-YYYY
        const dmy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dmy) {
          year = parseInt(dmy[3], 10);
          month = parseInt(dmy[2], 10);
          day = parseInt(dmy[1], 10);
        } else {
          return { date: '', isValid: false, error: `Unrecognized date format: "${str}"` };
        }
      }
    }
  }

  // Calendar validation
  if (year < 1970 || year > 2100) {
    return { date: '', isValid: false, error: `Year out of realistic range (1970-2100): ${year}` };
  }
  if (month < 1 || month > 12) {
    return { date: '', isValid: false, error: `Month out of range (1-12): ${month}` };
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDays = daysInMonth[month - 1];
  if (day < 1 || day > maxDays) {
    return {
      date: '',
      isValid: false,
      error: `Day ${day} invalid for month ${month}/${year} (max ${maxDays})`,
    };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const normalized = `${year}-${pad(month)}-${pad(day)}`;

  return { date: normalized, isValid: true };
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Heuristics to auto-detect CSV header mapping.
 * @param {string[]} headers
 * @returns {{ dateCol: string, descCol: string, categoryCol: string, amountCol: string, typeCol: string }}
 */
export function detectColumnMapping(headers) {
  const result = {
    dateCol: '',
    descCol: '',
    categoryCol: '',
    amountCol: '',
    typeCol: '',
  };

  if (!Array.isArray(headers)) return result;

  const dateRegex = /^(date|transaction_?date|posted_?date|time|timestamp)$/i;
  const descRegex = /^(description|desc|memo|details|name|title|payee|merchant|narrative|item)$/i;
  const catRegex = /^(category|cat|tag|group|classification)$/i;
  const amtRegex = /^(amount|value|total|cents|sum|price|net)$/i;
  const typeRegex = /^(type|transaction_?type|flow|direction|kind|entry_?type)$/i;

  // Exact matches first
  for (const h of headers) {
    const trimmed = h.trim();
    if (!result.dateCol && dateRegex.test(trimmed)) result.dateCol = trimmed;
    else if (!result.descCol && descRegex.test(trimmed)) result.descCol = trimmed;
    else if (!result.categoryCol && catRegex.test(trimmed)) result.categoryCol = trimmed;
    else if (!result.amountCol && amtRegex.test(trimmed)) result.amountCol = trimmed;
    else if (!result.typeCol && typeRegex.test(trimmed)) result.typeCol = trimmed;
  }

  // Substring matches for remaining unmapped
  for (const h of headers) {
    const trimmed = h.trim();
    const lower = trimmed.toLowerCase();
    if (!result.dateCol && lower.includes('date')) result.dateCol = trimmed;
    if (
      !result.descCol &&
      (lower.includes('desc') ||
        lower.includes('memo') ||
        lower.includes('detail') ||
        lower.includes('payee') ||
        lower.includes('name') ||
        lower.includes('item') ||
        lower.includes('title'))
    ) {
      result.descCol = trimmed;
    }
    if (
      !result.categoryCol &&
      (lower.includes('cat') || lower.includes('tag') || lower.includes('group') || lower.includes('class'))
    ) {
      result.categoryCol = trimmed;
    }
    if (!result.amountCol && (lower.includes('amount') || lower.includes('total') || lower.includes('val') || lower.includes('price'))) {
      result.amountCol = trimmed;
    }
    if (!result.typeCol && (lower.includes('type') || lower.includes('flow') || lower.includes('kind'))) {
      result.typeCol = trimmed;
    }
  }

  return result;
}

/**
 * Raw CSV parsing with PapaParse, incorporating BOM stripping and CRLF normalization.
 * Handles quoted fields containing commas, escaped quotes, and newlines.
 *
 * @param {string} csvText
 * @returns {Promise<{ data: any[], headers: string[], errors: any[], meta: any }>}
 */
export function parseCSVWithPapa(csvText) {
  return new Promise((resolve) => {
    const cleaned = stripBomAndNormalizeNewlines(csvText);

    Papa.parse(cleaned, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (h) => (h ? h.trim() : ''),
      complete: (results) => {
        const headers = results.meta && results.meta.fields ? results.meta.fields : [];
        resolve({
          data: results.data,
          headers,
          errors: results.errors || [],
          meta: results.meta,
        });
      },
      error: (err) => {
        resolve({
          data: [],
          headers: [],
          errors: [err],
          meta: {},
        });
      },
    });
  });
}

/**
 * Validates and transforms parsed CSV rows into the canonical Transaction dataset.
 *
 * @param {any[]} rows
 * @param {{ dateCol: string, descCol: string, categoryCol: string, amountCol: string, typeCol?: string }} columnMap
 * @returns {{
 *   validTransactions: import('./dataset.js').Transaction[],
 *   invalidRows: Array<{ rowNumber: number, original: any, error: string }>,
 *   totalRows: number,
 *   validCount: number,
 *   errorCount: number
 * }}
 */
export function validateAndTransformRows(rows, columnMap) {
  const validTransactions = [];
  const invalidRows = [];

  const { dateCol, descCol, categoryCol, amountCol, typeCol } = columnMap;

  if(rows.length>5000)throw new RangeError('This demo accepts up to 5,000 rows');
  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    // Check presence of row data
    if (!row || typeof row !== 'object') {
      invalidRows.push({ rowNumber, original: row, error: 'Empty or corrupted row' });
      return;
    }

    // 1. Date validation
    const rawDate = row[dateCol];
    const dateRes = parseISODate(rawDate);
    if (!dateRes.isValid) {
      invalidRows.push({
        rowNumber,
        original: row,
        error: `Date error: ${dateRes.error} (raw: "${rawDate || ''}")`,
      });
      return;
    }

    // 2. Amount validation
    const rawAmount = row[amountCol];
    const amtRes = parseCurrencyToCents(rawAmount);
    if (!amtRes.isValid) {
      invalidRows.push({
        rowNumber,
        original: row,
        error: `Amount error: ${amtRes.error} (raw: "${rawAmount || ''}")`,
      });
      return;
    }

    if (amtRes.cents === 0) {
      invalidRows.push({
        rowNumber,
        original: row,
        error: 'Amount cannot be zero',
      });
      return;
    }

    // 3. Description validation
    const rawDesc = descCol && row[descCol] ? String(row[descCol]).trim() : '';
    const description = rawDesc || `Transaction #${rowNumber}`;

    // 4. Category validation
    const rawCat = categoryCol && row[categoryCol] ? String(row[categoryCol]).trim() : '';
    const category = rawCat || 'Uncategorized';

    let type=amtRes.isNegative?'expense':'income';
    if(typeCol&&row[typeCol]){
      const value=String(row[typeCol]).trim().toLowerCase();
      const aliases={income:'income',inflow:'income',credit:'income',deposit:'income',salary:'income',expense:'expense',outflow:'expense',debit:'expense',withdrawal:'expense',charge:'expense',refund:'refund',transfer:'transfer'};
      type=Object.hasOwn(aliases,value)?aliases[value]:null;
      if(!type){invalidRows.push({rowNumber,original:row,error:'Unknown type: use income, expense, refund, or transfer'});return;}
    }
    const positiveCents = Math.abs(amtRes.cents);

    validTransactions.push({
      id: `row-${rowNumber}`,
      date: dateRes.date,
      description,
      category,
      amountInCents: positiveCents,
      type,
    });
  });

  return {
    validTransactions,
    invalidRows,
    totalRows: rows.length,
    validCount: validTransactions.length,
    errorCount: invalidRows.length,
  };
}
