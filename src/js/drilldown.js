import { escapeHTML } from './text.js';
import { formatCents, formatCentsExact } from './currency.js';
import { getCategoryColor } from './history-chart.js';

/**
 * Renders the Category Drilldown component.
 *
 * @param {HTMLElement} containerEl
 * @param {import('./dataset.js').TransactionStore} store
 */
export function renderCategoryDrilldown(containerEl, store) {
  if (!containerEl) return;

  const breakdown = store.getCategoryBreakdown();
  const selectedCat = store.selectedCategory;
  const metrics = store.getMetrics();

  if (breakdown.length === 0) {
    containerEl.innerHTML = `
      <div style="color:var(--text-faint); font-family:var(--font-mono); font-size:11.5px; padding: 12px 0;">
        No expense categories recorded for this period.
      </div>`;
    return;
  }

  let html = `
    <div class="drilldown-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">
        ${selectedCat ? `FILTERED: <strong style="color:var(--text-bright);">${escapeHTML(selectedCat)}</strong>` : 'CATEGORY DRILLDOWN'}
      </span>
      ${
        selectedCat
          ? `<button id="clear-drilldown-btn" class="clear-filter-btn" style="background:#1e293b; border:1px solid #334155; color:var(--accent-cyan); font-family:var(--font-mono); font-size:10.5px; padding:3px 8px; border-radius:3px; cursor:pointer;">× SHOW ALL CATEGORIES</button>`
          : `<span style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-faint);">CLICK TO FILTER</span>`
      }
    </div>
  `;

  // If a category is selected, render drilldown detail card
  if (selectedCat) {
    const selectedItem = breakdown.find((b) => b.category === selectedCat);
    const totalCatCents = selectedItem ? selectedItem.totalCents : 0;
    const catCount = selectedItem ? selectedItem.count : 0;
    const avgCents = catCount > 0 ? Math.round(totalCatCents / catCount) : 0;
    const percent = selectedItem ? selectedItem.percentage.toFixed(1) : '0';

    html += `
      <div class="selected-cat-card" style="background:var(--bg-card); border:1px solid var(--border-panel); border-left:3px solid ${getCategoryColor(
        selectedCat
      )}; border-radius:4px; padding:12px 14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
          <span style="font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--text-bright);">${escapeHTML(selectedCat)}</span>
          <span style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--accent-expense);">${formatCents(
            totalCatCents
          )}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; font-family:var(--font-mono); font-size:11px; color:var(--text-muted); margin-top:8px; border-top:1px solid var(--border-subtle); padding-top:8px;">
          <div><span style="color:var(--text-faint)">SHARE:</span> ${percent}% of budget</div>
          <div><span style="color:var(--text-faint)">COUNT:</span> ${catCount} txs</div>
          <div><span style="color:var(--text-faint)">AVERAGE:</span> ${formatCents(avgCents)}</div>
        </div>
      </div>
    `;
  }

  // Render Category Chips
  html += `<div class="category-chips-list" style="display:flex; flex-wrap:wrap; gap:6px;">`;

  for (const item of breakdown) {
    const isSelected = item.category === selectedCat;
    const color = getCategoryColor(item.category);

    html += `
      <button class="cat-chip-btn ${isSelected ? 'active' : ''}" data-cat="${escapeHTML(item.category)}" style="
        background: ${isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)'};
        border: 1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-panel)'};
        color: ${isSelected ? 'var(--accent-cyan)' : 'var(--text-bright)'};
        padding: 5px 9px;
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
      ">
        <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${color};"></span>
        <span>${escapeHTML(item.category)}</span>
        <span style="color:${isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'}; font-size:10px;">${formatCents(
      item.totalCents
    )}</span>
      </button>
    `;
  }

  html += `</div>`;
  containerEl.innerHTML = html;

  // Add event listeners
  const clearBtn = containerEl.querySelector('#clear-drilldown-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.setSelectedCategory(null);
    });
  }

  const chips = containerEl.querySelectorAll('.cat-chip-btn');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      if (store.selectedCategory === cat) {
        store.setSelectedCategory(null);
      } else {
        store.setSelectedCategory(cat);
      }
    });
  });
}
