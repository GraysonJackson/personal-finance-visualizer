import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionStore, DEFAULT_SAMPLE_TRANSACTIONS } from '../src/js/dataset.js';

test('TransactionStore matches Gate 1 invariant sample data figures exactly', () => {
  const store = new TransactionStore();
  const metrics = store.getMetrics();

  // Inflows: 425,000 cents ($4,250.00)
  assert.equal(metrics.totalIncomeInCents, 425000);
  // Outflows: 512,000 cents ($5,120.00)
  assert.equal(metrics.totalExpenseInCents, 512000);
  // Deficit invariant: expenses > income -> isDeficit is true
  assert.equal(metrics.isDeficit, true);
  // Funding gap: exactly 87,000 cents ($870.00)
  assert.equal(metrics.fundingGapInCents, 87000);
  assert.equal(metrics.surplusInCents, 0);
  // Net runway: -87,000 cents (-$870.00)
  assert.equal(metrics.netCents, -87000);

  // Inflows balanced == Outflows balanced
  assert.equal(metrics.totalInflowsBalanced, 512000);
  assert.equal(metrics.totalOutflowsBalanced, 512000);
  assert.equal(metrics.totalInflowsBalanced, metrics.totalOutflowsBalanced);
});

test('TransactionStore calculates Surplus when income exceeds expenses', () => {
  const surplusData = [
    { id: '1', date: '2026-10-01', description: 'Big Client', category: 'Income', amountInCents: 600000, type: 'income' },
    { id: '2', date: '2026-10-02', description: 'Rent', category: 'Housing', amountInCents: 200000, type: 'expense' },
  ];
  const store = new TransactionStore(surplusData);
  const metrics = store.getMetrics();

  assert.equal(metrics.totalIncomeInCents, 600000);
  assert.equal(metrics.totalExpenseInCents, 200000);
  assert.equal(metrics.isDeficit, false);
  assert.equal(metrics.fundingGapInCents, 0);
  assert.equal(metrics.surplusInCents, 400000);
  assert.equal(metrics.netCents, 400000);
  assert.equal(metrics.totalInflowsBalanced, metrics.totalOutflowsBalanced);
  assert.equal(metrics.totalInflowsBalanced, 600000);
});

test('TransactionStore filters ledger by category and search query', () => {
  const store = new TransactionStore();

  // Filter by category "Housing"
  store.setSelectedCategory('Housing');
  let list = store.getFilteredLedgerTransactions();
  assert.equal(list.length, 1);
  assert.equal(list[0].category, 'Housing');

  // Clear category, filter by search "Client"
  store.setSelectedCategory(null);
  store.setSearchQuery('client');
  list = store.getFilteredLedgerTransactions();
  assert.equal(list.length, 1);
  assert.equal(list[0].description, 'Client Retainer Alpha');
});

test('TransactionStore computes monthly timeline across 6 months', () => {
  const store = new TransactionStore();
  const timeline = store.getMonthlyTimeline();
  assert.equal(timeline.length >= 6, true);
  const oct = timeline.find((m) => m.month === '2026-10');
  assert.equal(oct.incomeInCents, 425000);
  assert.equal(oct.expenseInCents, 512000);
});
