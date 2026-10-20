import { escapeHTML } from './text.js';
import {
  parseCSVWithPapa,
  detectColumnMapping,
  validateAndTransformRows,
} from './parser.js';
import { formatCents } from './currency.js';

/**
 * Initializes and manages the CSV Ingestion Modal with Column Mapping UI,
 * Row Validation Preview, and Explicit Error Feedback.
 *
 * @param {HTMLElement} modalEl
 * @param {import('./dataset.js').TransactionStore} store
 * @param {Function} onImportSuccess
 */
export function initIngestModal(modalEl, store, onImportSuccess) {
  if (!modalEl) return;

  let currentRawRows = [];
  let currentHeaders = [];
  let currentFileName = '';
  let activeMapping = {
    dateCol: '',
    descCol: '',
    categoryCol: '',
    amountCol: '',
    typeCol: '',
  };

  /**
   * Opens the modal with parsed CSV content.
   */
  async function handleFileContent(fileName, textContent) {
    if(textContent.length>5*1024*1024){document.getElementById('ingestion-status-text').textContent='File exceeds the 5 MB demo limit';return;}
    currentFileName = fileName;
    const parsed = await parseCSVWithPapa(textContent);

    if (parsed.errors && parsed.errors.length > 0) {
      document.getElementById('ingestion-status-text').textContent=`CSV error: ${parsed.errors[0].message}. Current data was kept.`;
      return;
    }

    if(parsed.data.length>5000){document.getElementById('ingestion-status-text').textContent='This demo accepts up to 5,000 rows';return;}
    currentRawRows = parsed.data;
    currentHeaders = parsed.headers;
    activeMapping = detectColumnMapping(currentHeaders);

    renderModalContent();
    modalEl.style.display = 'flex';
    modalEl.querySelector('#modal-close-btn')?.focus();
  }

  function renderModalContent() {
    const validation = validateAndTransformRows(currentRawRows, activeMapping);

    const hasMapping = activeMapping.dateCol && activeMapping.amountCol;

    const buildOptions = (selectedCol, allowEmpty = false) => {
      let opts = allowEmpty ? `<option value="">(None / Derive from Amount sign)</option>` : '';
      for (const h of currentHeaders) {
        opts += `<option value="${escapeHTML(h)}" ${h === selectedCol ? 'selected' : ''}>${escapeHTML(h)}</option>`;
      }
      return opts;
    };

    // Build row validation preview table
    const previewRows = currentRawRows.slice(0, 10);
    let previewHtml = '';

    previewRows.forEach((row, i) => {
      const rowNum = i + 1;
      const invalid = validation.invalidRows.find((r) => r.rowNumber === rowNum);
      const validTx = validation.validTransactions.find(tx => tx.id===`row-${rowNum}`);

      const statusBadge = invalid
        ? `<span style="background:rgba(239, 68, 68, 0.2); color:#ef4444; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700;">ERROR: ${escapeHTML(invalid.error)}</span>`
        : `<span style="background:rgba(16, 185, 129, 0.2); color:#10b981; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700;">VALID</span>`;

      const parsedAmt = validTx
        ? `${validTx.type === 'income' ? '+' : '-'}${formatCents(validTx.amountInCents)}`
        : '—';

      previewHtml += `
        <tr style="border-bottom:1px solid var(--border-panel); font-size:11px;">
          <td style="padding:6px 8px; color:var(--text-faint);">${rowNum}</td>
          <td style="padding:6px 8px; color:var(--text-bright);">${escapeHTML(row[activeMapping.dateCol] || '—')}</td>
          <td style="padding:6px 8px; color:var(--text-bright);">${escapeHTML(row[activeMapping.descCol] || '—')}</td>
          <td style="padding:6px 8px; color:var(--text-muted);">${escapeHTML(row[activeMapping.categoryCol] || '—')}</td>
          <td style="padding:6px 8px; color:var(--text-bright);">${escapeHTML(row[activeMapping.amountCol] || '—')}</td>
          <td style="padding:6px 8px; color:var(--accent-cyan);">${parsedAmt}</td>
          <td style="padding:6px 8px;">${statusBadge}</td>
        </tr>
      `;
    });

    // Explicit error feedback section
    let errorSummaryHtml = '';
    if (validation.errorCount > 0) {
      const errorItems = validation.invalidRows
        .slice(0, 5)
        .map(
          (err) =>
            `<li style="margin-bottom:3px;"><span style="color:#ef4444; font-weight:700;">Row ${err.rowNumber}:</span> ${escapeHTML(err.error)}</li>`
        )
        .join('');

      errorSummaryHtml = `
        <div class="validation-error-box" style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.3); border-radius:4px; padding:10px 14px; margin-bottom:14px; font-family:var(--font-mono); font-size:11px;">
          <div style="font-weight:700; color:#ef4444; margin-bottom:6px;">⚠️ ${validation.errorCount} VALIDATION ISSUE(S) FOUND</div>
          <ul style="margin:0; padding-left:16px; color:#fca5a5;">
            ${errorItems}
            ${validation.errorCount > 5 ? `<li>...and ${validation.errorCount - 5} more issues</li>` : ''}
          </ul>
        </div>
      `;
    }

    modalEl.innerHTML = `
      <div class="modal-backdrop" style="position:fixed; inset:0; background:rgba(4, 7, 13, 0.85); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;">
        <div role="dialog" aria-modal="true" aria-label="Review CSV import" class="modal-card" style="background:var(--bg-panel); border:1px solid var(--border-panel); border-radius:8px; max-width:880px; width:100%; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 12px 30px rgba(0,0,0,0.8);">

          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-panel); padding-bottom:14px; margin-bottom:18px;">
            <div>
              <h2 style="font-family:var(--font-mono); font-size:16px; font-weight:700; color:var(--text-bright); margin-bottom:4px;">
                CSV INGESTION &amp; COLUMN MAPPING
              </h2>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
                SOURCE: <strong style="color:var(--accent-cyan);">${escapeHTML(currentFileName)}</strong> (${currentRawRows.length} rows detected)
              </span>
            </div>
            <button id="modal-close-btn" aria-label="Close import" style="background:none; border:none; color:var(--text-faint); font-size:22px; cursor:pointer; line-height:1;">&times;</button>
          </div>

          <!-- Column Mapping Form -->
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:16px; margin-bottom:18px;">
            <div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--accent-cyan); margin-bottom:10px; text-transform:uppercase;">
              Column Mapping Controls
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:12px;">
              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted); margin-bottom:4px;">DATE (ISO/Standard)</label>
                <select id="map-date" aria-label="Date column" style="width:100%; background:var(--bg-cockpit); border:1px solid var(--border-panel); color:var(--text-bright); padding:6px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
                  ${buildOptions(activeMapping.dateCol)}
                </select>
              </div>

              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted); margin-bottom:4px;">DESCRIPTION</label>
                <select id="map-desc" aria-label="Description column" style="width:100%; background:var(--bg-cockpit); border:1px solid var(--border-panel); color:var(--text-bright); padding:6px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
                  ${buildOptions(activeMapping.descCol)}
                </select>
              </div>

              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted); margin-bottom:4px;">CATEGORY</label>
                <select id="map-cat" aria-label="Category column" style="width:100%; background:var(--bg-cockpit); border:1px solid var(--border-panel); color:var(--text-bright); padding:6px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
                  ${buildOptions(activeMapping.categoryCol)}
                </select>
              </div>

              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted); margin-bottom:4px;">AMOUNT</label>
                <select id="map-amount" aria-label="Amount column" style="width:100%; background:var(--bg-cockpit); border:1px solid var(--border-panel); color:var(--text-bright); padding:6px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
                  ${buildOptions(activeMapping.amountCol)}
                </select>
              </div>

              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted); margin-bottom:4px;">TYPE / FLOW (Optional)</label>
                <select id="map-type" aria-label="Type column" style="width:100%; background:var(--bg-cockpit); border:1px solid var(--border-panel); color:var(--text-bright); padding:6px; border-radius:4px; font-family:var(--font-mono); font-size:11px;">
                  ${buildOptions(activeMapping.typeCol, true)}
                </select>
              </div>
            </div>
          </div>

          <!-- Explicit Error / Validation Feedback -->
          ${errorSummaryHtml}

          <!-- Row Validation Preview -->
          <div style="margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-bright);">
                ROW VALIDATION PREVIEW (FIRST ${previewRows.length} ROWS)
              </span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--accent-income);">
                ✓ ${validation.validCount} VALID / ✖ ${validation.errorCount} ERRORS
              </span>
            </div>

            <div style="overflow-x:auto; max-height:220px; border:1px solid var(--border-subtle); border-radius:4px; background:var(--bg-cockpit);">
              <table style="width:100%; border-collapse:collapse; font-family:var(--font-mono); text-align:left;">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-panel); color:var(--text-faint); font-size:10px; background:var(--bg-panel);">
                    <th style="padding:6px 8px;">#</th>
                    <th style="padding:6px 8px;">DATE</th>
                    <th style="padding:6px 8px;">DESCRIPTION</th>
                    <th style="padding:6px 8px;">CATEGORY</th>
                    <th style="padding:6px 8px;">RAW AMOUNT</th>
                    <th style="padding:6px 8px;">PARSED</th>
                    <th style="padding:6px 8px;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${previewHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-panel); padding-top:16px;">
            <button id="modal-cancel-btn" style="background:var(--bg-card); border:1px solid var(--border-panel); color:var(--text-muted); padding:8px 16px; border-radius:4px; font-family:var(--font-mono); font-size:12px; cursor:pointer;">
              CANCEL
            </button>
            <button id="modal-import-btn" ${(validation.validCount === 0 || validation.errorCount > 0 || !hasMapping) ? 'disabled' : ''} style="background:var(--accent-income); border:1px solid #059669; color:#042f2e; padding:8px 20px; border-radius:4px; font-family:var(--font-mono); font-size:12px; font-weight:700; cursor:pointer; opacity:${(validation.validCount === 0 || validation.errorCount > 0 || !hasMapping) ? 0.5 : 1};">
              IMPORT ${validation.validCount} VALID ROWS
            </button>
          </div>

        </div>
      </div>
    `;

    // Hook select changes to re-evaluate validation
    const bindSelect = (id, key) => {
      const el = modalEl.querySelector(id);
      if (el) {
        el.addEventListener('change', (e) => {
          activeMapping[key] = e.target.value;
          renderModalContent();
        });
      }
    };

    bindSelect('#map-date', 'dateCol');
    bindSelect('#map-desc', 'descCol');
    bindSelect('#map-cat', 'categoryCol');
    bindSelect('#map-amount', 'amountCol');
    bindSelect('#map-type', 'typeCol');

    modalEl.onkeydown=(event)=>{if(event.key==='Escape'){modalEl.style.display='none';document.getElementById('csv-file-input').closest('label').focus();}if(event.key==='Tab'){const nodes=[...modalEl.querySelectorAll('button:not(:disabled),select')];if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus();}}};
    // Close / Cancel handlers
    const closeModal = () => {
      modalEl.style.display = 'none';
      document.getElementById('csv-file-input').closest('label').focus();
    };
    modalEl.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    modalEl.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);

    // Import button
    modalEl.querySelector('#modal-import-btn').addEventListener('click', () => {
      if (validation.validTransactions.length > 0 && validation.errorCount===0 && hasMapping) {
        try{store.setTransactions(validation.validTransactions);}catch(error){document.getElementById('ingestion-status-text').textContent=error.message;return;}
        closeModal();
        if (typeof onImportSuccess === 'function') {
          onImportSuccess(currentFileName, validation);
        }
      }
    });
  }

  return {
    handleFileContent,
  };
}
