import test from 'node:test';
import assert from 'node:assert/strict';
import { sortTransactions } from '../src/js/ledger.js';

const testTxs = [
  { id: '1', date: '2026-10-18', description: 'Alpha', category: 'Zebra', amountInCents: 250000, type: 'income' },
  { id: '2', date: '2026-10-12', description: 'Beta', category: 'Apple', amountInCents: 125000, type: 'income' },
  { id: '3', date: '2026-10-14', description: 'Gamma', category: 'Mango', amountInCents: 185000, type: 'expense' },
];

test('sortTransactions sorts correctly by date ascending and descending', () => {
  const asc = sortTransactions(testTxs, 'date', 'asc');
  assert.equal(asc[0].date, '2026-10-12');
  assert.equal(asc[2].date, '2026-10-18');

  const desc = sortTransactions(testTxs, 'date', 'desc');
  assert.equal(desc[0].date, '2026-10-18');
  assert.equal(desc[2].date, '2026-10-12');
});

test('sortTransactions sorts by amount in integer cents', () => {
  const byAmountAsc = sortTransactions(testTxs, 'amount', 'asc');
  assert.equal(byAmountAsc[0].amountInCents, 125000);
  assert.equal(byAmountAsc[2].amountInCents, 250000);

  const byAmountDesc = sortTransactions(testTxs, 'amount', 'desc');
  assert.equal(byAmountDesc[0].amountInCents, 250000);
  assert.equal(byAmountDesc[2].amountInCents, 125000);
});

test('sortTransactions sorts alphabetically by description and category', () => {
  const byCategoryAsc = sortTransactions(testTxs, 'category', 'asc');
  assert.equal(byCategoryAsc[0].category, 'Apple');
  assert.equal(byCategoryAsc[2].category, 'Zebra');
});
