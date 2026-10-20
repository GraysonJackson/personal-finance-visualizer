import { TransactionStore, DEFAULT_SAMPLE_TRANSACTIONS } from './dataset.js';
import { formatCents, formatCentsExact } from './currency.js';
import { renderSankeyChart } from './sankey-engine.js';
import { renderHistoryChart } from './history-chart.js';
import { renderCategoryDrilldown } from './drilldown.js';
import { renderLedgerTable } from './ledger.js';
import { initIngestModal } from './ingest-modal.js';
import {
  FIXTURE_FREELANCE_Q3_CSV,
  FIXTURE_SURPLUS_Q4_CSV,
  FIXTURE_BALANCED_CSV,
  FIXTURE_QUOTED_BOM_CRLF_CSV,
} from './fixtures.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canonical Store
  const store = new TransactionStore();

  // Try restoring explicit user-saved session (if user previously clicked "Save Session")
  const restored = store.loadFromLocalStorage();

  // 2. DOM Elements
  const kpiInflowEl = document.getElementById('kpi-inflows-val');
  const kpiOutflowEl = document.getElementById('kpi-outflows-val');
  const kpiGapCard = document.getElementById('kpi-gap-card');
  const kpiGapLabel = document.getElementById('kpi-gap-label');
  const kpiGapVal = document.getElementById('kpi-gap-val');
  const kpiGapSub = document.getElementById('kpi-gap-sub');
  const kpiRunwayVal = document.getElementById('kpi-runway-val');
  const kpiRunwaySub = document.getElementById('kpi-runway-sub');

  const filePillEl = document.getElementById('active-file-pill');
  const ingestionStatusEl = document.getElementById('ingestion-status-text');

  const sankeyContainer = document.getElementById('sankeyContainer');
  const historyContainer = document.getElementById('historyContainer');
  const drilldownContainer = document.getElementById('drilldownContainer');
  const ledgerContainer = document.getElementById('ledgerContainer');
  const ingestModalEl = document.getElementById('ingest-modal');

  const fileInputEl = document.getElementById('csv-file-input');
  const fixtureSelectEl = document.getElementById('fixture-select');
  const resetBtn = document.getElementById('resetData');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const clearSessionBtn = document.getElementById('clearSessionBtn');

  // 3. Setup Ingest Modal
  const modalManager = initIngestModal(ingestModalEl, store, (fileName, validation) => {
    filePillEl.textContent = fileName;
    ingestionStatusEl.textContent = `Imported ${validation.validCount} transactions. USD amounts; local processing.`;
    ingestionStatusEl.style.color = 'var(--accent-income)';
  });

  // 4. Update Dashboard function (updates all KPI metrics & views from canonical store)
  function updateDashboard() {
    const metrics = store.getMetrics();
    const periodSelect=document.getElementById('period-select');
    periodSelect.replaceChildren(...['all',...new Set(store.rawTransactions.map(tx=>tx.date.slice(0,7)))].sort().map(value=>{const option=document.createElement('option');option.value=value;option.textContent=value==='all'?'All dates':value;return option;}));periodSelect.value=store.selectedPeriod;

    // KPI Inflows
    kpiInflowEl.textContent = formatCents(metrics.totalIncomeInCents);

    // KPI Outflows
    kpiOutflowEl.textContent = formatCents(metrics.netSpendingInCents);

    // KPI Balancing Term (Gap or Surplus)
    if (metrics.isDeficit) {
      kpiGapCard.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      kpiGapLabel.innerHTML = `<span>Funding gap</span>`;
      kpiGapVal.textContent = formatCents(metrics.fundingGapInCents);
      kpiGapVal.style.color = 'var(--accent-gap)';
      kpiGapSub.textContent = 'Chart balancing term; not inferred debt';
    } else if (metrics.surplusInCents > 0) {
      kpiGapCard.style.borderColor = 'rgba(59, 130, 246, 0.4)';
      kpiGapLabel.innerHTML = `<span>Remaining flow</span>`;
      kpiGapVal.textContent = formatCents(metrics.surplusInCents);
      kpiGapVal.style.color = '#3b82f6';
      kpiGapSub.textContent = 'Income plus refunds exceeds expenses';
    } else {
      kpiGapCard.style.borderColor = 'var(--border-panel)';
      kpiGapLabel.innerHTML = `<span>BALANCE</span><span style="color:var(--accent-income)">EXACT</span>`;
      kpiGapVal.textContent = '$0.00';
      kpiGapVal.style.color = 'var(--text-bright)';
      kpiGapSub.textContent = 'Inflows precisely match outflows';
    }

    // KPI Runway / Net
    const netFormatted = (metrics.netCents >= 0 ? '+' : '') + formatCents(metrics.netCents);
    kpiRunwayVal.textContent = netFormatted;
    kpiRunwayVal.style.color = metrics.netCents >= 0 ? 'var(--accent-income)' : 'var(--accent-gap)';
    kpiRunwaySub.textContent = `${metrics.netCents.toLocaleString()} cents ${metrics.netCents >= 0 ? 'net inflow' : 'net outflow'}`;

    // Render Charts and Ledger
    renderSankeyChart(sankeyContainer, store, (catName) => {
      store.setSelectedCategory(catName);
    });

    renderHistoryChart(historyContainer, store);
    renderCategoryDrilldown(drilldownContainer, store);
    renderLedgerTable(ledgerContainer, store);
  }

  // Subscribe to changes in store
  store.subscribe(() => {
    updateDashboard();
  });

  // Initial render
  updateDashboard();

  if (restored) {
    filePillEl.textContent = 'local_saved_session.csv';
    ingestionStatusEl.textContent = `● RESTORED FROM EXPLICIT USER STORAGE`;
  }

  document.getElementById('period-select').addEventListener('change',event=>store.setSelectedPeriod(event.target.value));
  const uploadLabel=fileInputEl.closest('label');uploadLabel.tabIndex=0;uploadLabel.setAttribute('role','button');uploadLabel.setAttribute('aria-label','Upload CSV');uploadLabel.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInputEl.click();}};
  // 5. File Upload Handler
  fileInputEl.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if(file.size>5*1024*1024){ingestionStatusEl.textContent='File exceeds the 5 MB limit';return;}
    const reader = new FileReader();
    reader.onerror=()=>{ingestionStatusEl.textContent='The file could not be read. Current data was kept.';};
    reader.onload = (event) => {
      modalManager.handleFileContent(file.name, event.target.result);
    };
    reader.readAsText(file);
    // Reset file input so re-selecting same file triggers change
    fileInputEl.value = '';
  });

  // 6. Fixture Selector Handler
  fixtureSelectEl.addEventListener('change', (e) => {
    const val = e.target.value;
    let fixtureCsv = '';
    let fixtureName = '';

    if (val === 'freelance_q3') {
      fixtureCsv = FIXTURE_FREELANCE_Q3_CSV;
      fixtureName = 'Fictional sample data';
    } else if (val === 'surplus_q4') {
      fixtureCsv = FIXTURE_SURPLUS_Q4_CSV;
      fixtureName = 'irregular_consulting_2026_q4.csv';
    } else if (val === 'balanced') {
      fixtureCsv = FIXTURE_BALANCED_CSV;
      fixtureName = 'balanced_cashflow_2026.csv';
    } else if (val === 'quoted_bom') {
      fixtureCsv = FIXTURE_QUOTED_BOM_CRLF_CSV;
      fixtureName = 'quoted_bom_crlf.csv';
    }

    if (fixtureCsv) {
      modalManager.handleFileContent(fixtureName, fixtureCsv);
    }
  });

  // 7. Reset to Sample Data
  resetBtn.addEventListener('click', () => {
    store.resetToDefault();
    filePillEl.textContent = 'Fictional sample data';
    ingestionStatusEl.textContent = 'Showing fictional sample transactions';
    ingestionStatusEl.style.color = 'var(--accent-income)';
    fixtureSelectEl.value = 'freelance_q3';
  });

  // 8. In-Browser Privacy Storage Controls (EXPLICIT USER ACTION ONLY)
  saveSessionBtn.addEventListener('click', () => {
    const res = store.saveToLocalStorage();
    if (res.success) {
      alert('Data successfully saved to your browser localStorage.\nZero bytes were transmitted over the network.');
    } else {
      alert(`Could not save data: ${res.error}`);
    }
  });

  clearSessionBtn.addEventListener('click', () => {
    store.clearLocalStorage();
    alert('Browser localStorage cleared for Between Paychecks.');
  });

  // 9. Window Resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderSankeyChart(sankeyContainer, store, (catName) => {
        store.setSelectedCategory(catName);
      });
      renderHistoryChart(historyContainer, store);
    }, 150);
  });
});
