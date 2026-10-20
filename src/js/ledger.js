import { escapeHTML } from './text.js';
import { formatCents, formatCentsExact } from './currency.js';

/**
 * State for ledger table sorting.
 */
let currentSortColumn = 'date';
let currentSortDirection = 'desc'; // 'asc' | 'desc'

/**
 * Sets sorting and returns sorted transaction array.
 * @param {import('./dataset.js').Transaction[]} transactions
 * @param {string} col
 * @param {'asc'|'desc'} [dir]
 * @returns {import('./dataset.js').Transaction[]}
 */
export function sortTransactions(transactions, col, dir) {
  if (dir) {
    currentSortDirection = dir;
  } else if (currentSortColumn === col) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortDirection = 'asc';
  }
  currentSortColumn = col;

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (col === 'date') {
      cmp = a.date.localeCompare(b.date);
    } else if (col === 'description') {
      cmp = a.description.localeCompare(b.description);
    } else if (col === 'category') {
      cmp = a.category.localeCompare(b.category);
    } else if (col === 'type') {
      cmp = a.type.localeCompare(b.type);
    } else if (col === 'amount') {
      cmp = a.amountInCents - b.amountInCents;
    }

    return currentSortDirection === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

/**
 * Renders the Sortable Transaction Ledger into the specified container.
 *
 * @param {HTMLElement} containerEl
 * @param {import('./dataset.js').TransactionStore} store
 */
export function renderLedgerTable(containerEl, store) {
  if (!containerEl) return;

  const filtered = store.getFilteredLedgerTransactions();
  const sorted = sortTransactions(filtered, currentSortColumn, currentSortDirection);

  const getSortIcon = (col) => {
    if (currentSortColumn !== col) return '⬍';
    return currentSortDirection === 'asc' ? '▲' : '▼';
  };

  let rowsHtml = '';
  if (sorted.length === 0) {
    rowsHtml = `
      <tr>
        <td colspan="5" style="text-align:center; padding:24px; color:var(--text-faint); font-family:var(--font-mono); font-size:12px;">
          NO TRANSACTIONS MATCH CURRENT FILTERS
        </td>
      </tr>`;
  } else {
    for (const tx of sorted) {
      const isIncome = tx.type === 'income'||tx.type==='refund';
      const typePill = isIncome
        ? `<span class="type-pill income" style="background:rgba(16, 185, 129, 0.15); color:#10b981; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700;">INFLOW</span>`
        : `<span class="type-pill expense" style="background:rgba(245, 158, 11, 0.15); color:#f59e0b; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700;">OUTFLOW</span>`;

      const amountFormatted = isIncome
        ? `+${formatCents(tx.amountInCents)}`
        : `-${formatCents(tx.amountInCents)}`;

      const amountColor = isIncome ? 'var(--accent-income)' : 'var(--accent-expense)';

      rowsHtml += `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid var(--border-subtle);">${escapeHTML(tx.date)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid var(--border-subtle); color:var(--text-bright); font-weight:500;">${escapeHTML(tx.description)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid var(--border-subtle); color:var(--text-muted);">${escapeHTML(tx.category)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid var(--border-subtle);">${typePill} ${escapeHTML(tx.type)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid var(--border-subtle); text-align:right; color:${amountColor}; font-weight:600;">
            ${amountFormatted}
            <span style="display:block; font-size:9.5px; color:var(--text-faint); font-weight:400;">(${tx.amountInCents.toLocaleString()}¢)</span>
          </td>
        </tr>
      `;
    }
  }

  containerEl.innerHTML = `
    <div class="ledger-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <h3 class="section-title" style="font-family:var(--font-mono); font-size:14px; font-weight:700; margin:0;">
          TRANSACTION LEDGER
        </h3>
        <span style="font-family:var(--font-mono); font-size:11px; background:var(--bg-card); border:1px solid var(--border-panel); padding:2px 8px; border-radius:3px; color:var(--text-muted);">
          ${sorted.length} entries
        </span>
      </div>

      <div class="ledger-controls" style="display:flex; align-items:center; gap:8px;">
        <input
          type="text"
          id="ledger-search" aria-label="Search transactions"
          placeholder="Filter transactions..."
          value="${escapeHTML(store.searchQuery || '')}"
          style="background:var(--bg-card); border:1px solid var(--border-panel); color:var(--text-bright); padding:5px 10px; border-radius:4px; font-family:var(--font-mono); font-size:11px; width:160px;"
        />
        <select id="ledger-type-select" aria-label="Transaction type" style="background:var(--bg-card); border:1px solid var(--border-panel); color:var(--text-bright); padding:5px 8px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
          <option value="all" ${store.typeFilter === 'all' ? 'selected' : ''}>All Types</option>
          <option value="income" ${store.typeFilter === 'income' ? 'selected' : ''}>Inflows Only</option>
          <option value="expense" ${store.typeFilter === 'expense' ? 'selected' : ''}>Outflows Only</option>
        <option value="refund" ${store.typeFilter==='refund'?'selected':''}>Refunds</option><option value="transfer" ${store.typeFilter==='transfer'?'selected':''}>Transfers</option></select>
      </div>
    </div>

    <div style="overflow-x:auto;">
      <table class="ledger-table" id="ledger-table" style="width:100%; border-collapse:collapse; font-family:var(--font-mono); font-size:12px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-panel); color:var(--text-faint); font-size:10.5px;">
            <th data-sort="date" style="text-align:left; padding:8px 12px; cursor:pointer; user-select:none;">DATE ${getSortIcon('date')}</th>
            <th data-sort="description" style="text-align:left; padding:8px 12px; cursor:pointer; user-select:none;">DESCRIPTION ${getSortIcon('description')}</th>
            <th data-sort="category" style="text-align:left; padding:8px 12px; cursor:pointer; user-select:none;">CATEGORY ${getSortIcon('category')}</th>
            <th data-sort="type" style="text-align:left; padding:8px 12px; cursor:pointer; user-select:none;">TYPE ${getSortIcon('type')}</th>
            <th data-sort="amount" style="text-align:right; padding:8px 12px; cursor:pointer; user-select:none;">AMOUNT (¢) ${getSortIcon('amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // Attach sorting header handlers
  const ths = containerEl.querySelectorAll('th[data-sort]');
  ths.forEach((th) => {
    th.tabIndex=0;th.setAttribute('role','button');th.setAttribute('aria-label',`Sort by ${th.dataset.sort}`);th.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();th.click();}};
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      sortTransactions(filtered, col);
      renderLedgerTable(containerEl, store);
    });
  });

  // Attach search handler
  const searchInput = containerEl.querySelector('#ledger-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const position=e.target.selectionStart;store.setSearchQuery(e.target.value);const next=containerEl.querySelector('#ledger-search');next?.focus();next?.setSelectionRange(position,position);
    });
  }

  // Attach type select handler
  const typeSelect = containerEl.querySelector('#ledger-type-select');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      store.setTypeFilter(e.target.value);
    });
  }
}
