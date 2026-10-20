import { parseISODate } from './parser.js';
import { sumCents } from './currency.js';

export const STORAGE_KEY = 'between-paychecks.transactions.v1';

/**
 * Gate 1 canonical sample dataset (October 2026 current period + May-Sep history).
 * Inflows: $4,250.00 (425,000¢)
 * Outflows: $5,120.00 (512,000¢)
 * Funding gap: $870.00 (87,000¢)
 */
export const DEFAULT_SAMPLE_TRANSACTIONS = [
  // October 2026 (Current Period - matches Gate 1 invariant test exactly)
  {
    id: 'tx-20261018-01',
    date: '2026-10-18',
    description: 'Client Retainer Alpha',
    category: 'Contracts',
    amountInCents: 250000,
    type: 'income',
  },
  {
    id: 'tx-20261014-02',
    date: '2026-10-14',
    description: 'Studio Rent',
    category: 'Housing',
    amountInCents: 185000,
    type: 'expense',
  },
  {
    id: 'tx-20261012-03',
    date: '2026-10-12',
    description: 'Milestone Beta',
    category: 'Engineering',
    amountInCents: 125000,
    type: 'income',
  },
  {
    id: 'tx-20261008-04',
    date: '2026-10-08',
    description: 'Taxes & Reserve Fund',
    category: 'Taxes & Reserves',
    amountInCents: 110000,
    type: 'expense',
  },
  {
    id: 'tx-20261005-05',
    date: '2026-10-05',
    description: 'Health Insurance',
    category: 'Healthcare',
    amountInCents: 62000,
    type: 'expense',
  },
  {
    id: 'tx-20261003-06',
    date: '2026-10-03',
    description: 'Advisory Consultation',
    category: 'Advisory',
    amountInCents: 50000,
    type: 'income',
  },
  {
    id: 'tx-20261002-07',
    date: '2026-10-02',
    description: 'Cloud Infrastructure',
    category: 'Infrastructure',
    amountInCents: 45000,
    type: 'expense',
  },
  {
    id: 'tx-20261016-08',
    date: '2026-10-16',
    description: 'Equipment & Tools',
    category: 'Equipment',
    amountInCents: 70000,
    type: 'expense',
  },
  {
    id: 'tx-20261020-09',
    date: '2026-10-20',
    description: 'Essentials & Food',
    category: 'Food & Living',
    amountInCents: 40000,
    type: 'expense',
  },

  // Historical months for stacked history chart (May - Sep 2026)
  // September 2026: Income $5,800.00 / Expense $4,300.00
  { id: 'tx-sep-inc-1', date: '2026-09-15', description: 'Enterprise Retainer', category: 'Contracts', amountInCents: 420000, type: 'income' },
  { id: 'tx-sep-inc-2', date: '2026-09-28', description: 'Security Audit Bounty', category: 'Engineering', amountInCents: 160000, type: 'income' },
  { id: 'tx-sep-exp-1', date: '2026-09-02', description: 'Studio Lease Sep', category: 'Housing', amountInCents: 185000, type: 'expense' },
  { id: 'tx-sep-exp-2', date: '2026-09-05', description: 'Health Premium Sep', category: 'Healthcare', amountInCents: 62000, type: 'expense' },
  { id: 'tx-sep-exp-3', date: '2026-09-12', description: 'Cloud Services Sep', category: 'Infrastructure', amountInCents: 43000, type: 'expense' },
  { id: 'tx-sep-exp-4', date: '2026-09-15', description: 'Estimated Q3 Tax', category: 'Taxes & Reserves', amountInCents: 100000, type: 'expense' },
  { id: 'tx-sep-exp-5', date: '2026-09-22', description: 'Groceries & Living', category: 'Food & Living', amountInCents: 40000, type: 'expense' },

  // August 2026: Income $3,200.00 / Expense $4,100.00
  { id: 'tx-aug-inc-1', date: '2026-08-10', description: 'Frontend Refactor Milestone', category: 'Engineering', amountInCents: 320000, type: 'income' },
  { id: 'tx-aug-exp-1', date: '2026-08-01', description: 'Studio Lease Aug', category: 'Housing', amountInCents: 185000, type: 'expense' },
  { id: 'tx-aug-exp-2', date: '2026-08-05', description: 'Health Premium Aug', category: 'Healthcare', amountInCents: 62000, type: 'expense' },
  { id: 'tx-aug-exp-3', date: '2026-08-12', description: 'Cloud Host Aug', category: 'Infrastructure', amountInCents: 41000, type: 'expense' },
  { id: 'tx-aug-exp-4', date: '2026-08-18', description: 'Hardware Replacement', category: 'Equipment', amountInCents: 75000, type: 'expense' },
  { id: 'tx-aug-exp-5', date: '2026-08-25', description: 'Food & Groceries Aug', category: 'Food & Living', amountInCents: 47000, type: 'expense' },

  // July 2026: Income $6,900.00 / Expense $4,500.00
  { id: 'tx-jul-inc-1', date: '2026-07-08', description: 'Product Architecture Sprint', category: 'Contracts', amountInCents: 540000, type: 'income' },
  { id: 'tx-jul-inc-2', date: '2026-07-22', description: 'Workshops & Mentorship', category: 'Advisory', amountInCents: 150000, type: 'income' },
  { id: 'tx-jul-exp-1', date: '2026-07-01', description: 'Studio Lease Jul', category: 'Housing', amountInCents: 185000, type: 'expense' },
  { id: 'tx-jul-exp-2', date: '2026-07-05', description: 'Health Premium Jul', category: 'Healthcare', amountInCents: 62000, type: 'expense' },
  { id: 'tx-jul-exp-3', date: '2026-07-15', description: 'Tax Set-aside Jul', category: 'Taxes & Reserves', amountInCents: 130000, type: 'expense' },
  { id: 'tx-jul-exp-4', date: '2026-07-19', description: 'Development Tools License', category: 'Equipment', amountInCents: 35000, type: 'expense' },
  { id: 'tx-jul-exp-5', date: '2026-07-28', description: 'Food & Living Jul', category: 'Food & Living', amountInCents: 38000, type: 'expense' },

  // June 2026: Income $2,100.00 / Expense $3,800.00
  { id: 'tx-jun-inc-1', date: '2026-06-18', description: 'Code Review Retainer', category: 'Advisory', amountInCents: 210000, type: 'income' },
  { id: 'tx-jun-exp-1', date: '2026-06-01', description: 'Studio Lease Jun', category: 'Housing', amountInCents: 185000, type: 'expense' },
  { id: 'tx-jun-exp-2', date: '2026-06-05', description: 'Health Premium Jun', category: 'Healthcare', amountInCents: 62000, type: 'expense' },
  { id: 'tx-jun-exp-3', date: '2026-06-10', description: 'Cloud Services Jun', category: 'Infrastructure', amountInCents: 45000, type: 'expense' },
  { id: 'tx-jun-exp-4', date: '2026-06-25', description: 'Food & Living Jun', category: 'Food & Living', amountInCents: 42000, type: 'expense' },
  { id: 'tx-jun-exp-5', date: '2026-06-28', description: 'Software Subscriptions', category: 'Equipment', amountInCents: 46000, type: 'expense' },

  // May 2026: Income $5,200.00 / Expense $3,900.00
  { id: 'tx-may-inc-1', date: '2026-05-12', description: 'Contract Kickoff Milestone', category: 'Contracts', amountInCents: 370000, type: 'income' },
  { id: 'tx-may-inc-2', date: '2026-05-24', description: 'Technical Due Diligence', category: 'Advisory', amountInCents: 150000, type: 'income' },
  { id: 'tx-may-exp-1', date: '2026-05-01', description: 'Studio Lease May', category: 'Housing', amountInCents: 185000, type: 'expense' },
  { id: 'tx-may-exp-2', date: '2026-05-05', description: 'Health Premium May', category: 'Healthcare', amountInCents: 62000, type: 'expense' },
  { id: 'tx-may-exp-3', date: '2026-05-15', description: 'Estimated Q2 Tax', category: 'Taxes & Reserves', amountInCents: 95000, type: 'expense' },
  { id: 'tx-may-exp-4', date: '2026-05-20', description: 'Food & Living May', category: 'Food & Living', amountInCents: 48000, type: 'expense' },
];

export function validateTransactions(input){
  if(!Array.isArray(input)||input.length>5000)throw new Error('Expected at most 5,000 transactions');
  const ids=new Set();
  const copy=input.map(tx=>{if(!tx||typeof tx.id!=='string'||ids.has(tx.id)||!parseISODate(tx.date).isValid||typeof tx.description!=='string'||typeof tx.category!=='string'||tx.description.length>2000||tx.category.length>200||!['income','expense','refund','transfer'].includes(tx.type)||!Number.isSafeInteger(tx.amountInCents)||tx.amountInCents<=0)throw new Error('Invalid saved transaction');ids.add(tx.id);return {...tx};});
  sumCents(copy.map(tx=>tx.amountInCents));return copy;
}
/**
 * Canonical Transaction Store
 */
export class TransactionStore {
  constructor(initialTransactions = DEFAULT_SAMPLE_TRANSACTIONS) {
    this.rawTransactions = validateTransactions(initialTransactions);
    this.selectedCategory = null;
    this.searchQuery = '';
    this.typeFilter = 'all'; // 'all' | 'income' | 'expense'
    this.selectedPeriod = '2026-10'; // Default to active October 2026 period; 'all' for entire timeline
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  setTransactions(newTxList) {
    this.rawTransactions = validateTransactions(newTxList);
    this.selectedPeriod = 'all';
    this.selectedCategory = null;
    this.searchQuery = '';
    this.notify();
  }

  resetToDefault() {
    this.rawTransactions = [...DEFAULT_SAMPLE_TRANSACTIONS];
    this.selectedCategory = null;
    this.searchQuery = '';
    this.selectedPeriod = '2026-10';
    this.notify();
  }

  setSelectedCategory(cat) {
    this.selectedCategory = cat;
    this.notify();
  }

  setSearchQuery(q) {
    this.searchQuery = (q || '').trim();
    this.notify();
  }

  setTypeFilter(type) {
    this.typeFilter = type;
    this.notify();
  }

  setSelectedPeriod(period) {
    this.selectedPeriod = period;
    this.notify();
  }

  /**
   * Returns transactions filtered by current active period (for Sankey and KPIs).
   */
  getPeriodTransactions() {
    if (this.selectedPeriod === 'all') {
      return this.rawTransactions;
    }
    return this.rawTransactions.filter((tx) => tx.date.startsWith(this.selectedPeriod));
  }

  /**
   * Returns transactions filtered by search, category, and type (for the Ledger Table).
   */
  getFilteredLedgerTransactions() {
    let list = this.getPeriodTransactions();

    if (this.selectedCategory) {
      list = list.filter((tx) => tx.category === this.selectedCategory);
    }

    if (this.typeFilter !== 'all') {
      list = list.filter((tx) => tx.type === this.typeFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.date.includes(q)
      );
    }

    return list;
  }

  /**
   * Returns high-level metrics for the active period.
   * Total Inflows, Total Outflows, Funding gap, Surplus, and Runway.
   */
  getMetrics() {
    const periodTx = this.getPeriodTransactions();

    const incomeTxs = periodTx.filter((tx) => tx.type === 'income');
    const expenseTxs = periodTx.filter((tx) => tx.type === 'expense');

    const refundTxs=periodTx.filter(tx=>tx.type==='refund');
    const totalRefundInCents=sumCents(refundTxs.map(tx=>tx.amountInCents));
    const totalIncomeInCents = sumCents(incomeTxs.map((t) => t.amountInCents));
    const totalExpenseInCents = sumCents(expenseTxs.map((t) => t.amountInCents));

    const netCents = totalIncomeInCents + totalRefundInCents - totalExpenseInCents;
    const isDeficit = totalExpenseInCents > totalIncomeInCents + totalRefundInCents;
    const fundingGapInCents = isDeficit ? -netCents : 0;
    const surplusInCents = !isDeficit ? netCents : 0;

    return {
      incomeTxs,
      refundTxs, totalRefundInCents, netSpendingInCents: totalExpenseInCents-totalRefundInCents,
      expenseTxs,
      totalIncomeInCents,
      totalExpenseInCents,
      netCents,
      isDeficit,
      fundingGapInCents,
      surplusInCents,
      totalInflowsBalanced: totalIncomeInCents + totalRefundInCents + fundingGapInCents,
      totalOutflowsBalanced: totalExpenseInCents + surplusInCents,
    };
  }

  /**
   * Monthly aggregate data across all available periods for the stacked history chart.
   */
  getMonthlyTimeline() {
    const monthMap = new Map();

    for (const tx of this.rawTransactions) {
      const monthKey = tx.date.substring(0, 7); // 'YYYY-MM'
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthKey,
          label: formatMonthLabel(monthKey),
          incomeInCents: 0,
          expenseInCents: 0,
          categories: Object.create(null),
        });
      }
      const entry = monthMap.get(monthKey);
      if (tx.type === 'income') {
        entry.incomeInCents += tx.amountInCents;
      } else if (tx.type === 'expense' && (!this.selectedCategory || tx.category===this.selectedCategory)) {
        entry.expenseInCents += tx.amountInCents;
        entry.categories[tx.category] = (entry.categories[tx.category] || 0) + tx.amountInCents;
      }
    }

    // Sort chronologically
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Category breakdown for the active period.
   */
  getCategoryBreakdown() {
    const periodTx = this.getPeriodTransactions();
    const expenseTxs = periodTx.filter((tx) => tx.type === 'expense');
    const totalExpense = sumCents(expenseTxs.map((t) => t.amountInCents));

    const breakdown = new Map();
    for (const tx of expenseTxs) {
      if (!breakdown.has(tx.category)) {
        breakdown.set(tx.category, { category: tx.category, totalCents: 0, count: 0 });
      }
      const item = breakdown.get(tx.category);
      item.totalCents += tx.amountInCents;
      item.count += 1;
    }

    return Array.from(breakdown.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? (item.totalCents / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.totalCents - a.totalCents);
  }

  // --- In-Browser Privacy Explicit Storage Controls ---
  saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rawTransactions));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.setTransactions(parsed);
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not restore from localStorage', e);
    }
    return false;
  }

  clearLocalStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }
}

function formatMonthLabel(ym) {
  const [year, month] = ym.split('-');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const mIdx = parseInt(month, 10) - 1;
  return `${months[mIdx] || ym} ${year}`;
}
