import { escapeHTML } from './text.js';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { formatCents, formatCentsExact } from './currency.js';

/**
 * Node color mapping matching Gate 1 design palette.
 */
export const SANKEY_COLORS = {
  income: '#10b981', // Emerald green
  expense: '#f59e0b', // Amber/orange
  gap: '#ef4444', // Crimson/rose
  pool: '#06b6d4', // Cyan
  surplus: '#3b82f6', // Sapphire blue
};

/**
 * Builds the mathematical nodes and links data structure for a balanced acyclic Sankey diagram.
 * Guarantees:
 *  1. Inflow links == Outflow links.
 *  2. All link values strictly >= 0.
 *  3. Acyclic structure (Inflows -> Pool -> Outflows).
 *  4. Injects synthetic inflow 'Funding gap' if expenses > income.
 *  5. Injects synthetic outflow 'Surplus' if income > expenses.
 *
 * @param {import('./dataset.js').TransactionStore} store
 * @returns {{
 *   nodes: Array<{ id: number, name: string, type: string, valueInCents: number, isBalancing?: boolean }>,
 *   links: Array<{ source: number, target: number, value: number, isBalancing?: boolean }>,
 *   totalFlowInCents: number
 * }}
 */
export function buildSankeyGraph(store) {
  const metrics = store.getMetrics();
  const { incomeTxs, expenseTxs, fundingGapInCents, surplusInCents } = metrics;

  const nodes = [];
  const links = [];

  // Group incomes by description (or category if preferred)
  const incomeGroupMap = new Map();
  for (const tx of [...incomeTxs,...(metrics.refundTxs||[]).map(tx=>({...tx,description:'Refunds'}))]) {
    const key = tx.description || tx.category || 'Other Inflow';
    incomeGroupMap.set(key, (incomeGroupMap.get(key) || 0) + tx.amountInCents);
  }

  // Group expenses by category
  const expenseGroupMap = new Map();
  for (const tx of expenseTxs) {
    const key = tx.category || 'Other Outflow';
    expenseGroupMap.set(key, (expenseGroupMap.get(key) || 0) + tx.amountInCents);
  }

  // 1. Build Inflow Nodes
  const inflowIndices = [];
  for (const [name, cents] of incomeGroupMap.entries()) {
    if (cents > 0) {
      const idx = nodes.length;
      nodes.push({
        id: idx,
        name,
        type: 'income',
        valueInCents: cents,
      });
      inflowIndices.push(idx);
    }
  }

  // 2. Balancing Inflow Node: Funding gap (if deficit)
  let fundingGapIdx = -1;
  if (fundingGapInCents > 0) {
    fundingGapIdx = nodes.length;
    nodes.push({
      id: fundingGapIdx,
      name: 'Funding gap',
      type: 'gap',
      valueInCents: fundingGapInCents,
      isBalancing: true,
    });
    inflowIndices.push(fundingGapIdx);
  }

  // 3. Central Liquidity Pool Node
  const poolIdx = nodes.length;
  const totalFlow = metrics.totalInflowsBalanced;
  nodes.push({
    id: poolIdx,
    name: 'Period funds',
    type: 'pool',
    valueInCents: totalFlow,
  });

  // Connect all Inflows to Central Pool
  for (const inIdx of inflowIndices) {
    const val = nodes[inIdx].valueInCents;
    if (val > 0) {
      links.push({
        source: inIdx,
        target: poolIdx,
        value: val,
        isBalancing: nodes[inIdx].isBalancing || false,
      });
    }
  }

  // 4. Build Outflow Nodes
  const outflowIndices = [];
  for (const [name, cents] of expenseGroupMap.entries()) {
    if (cents > 0) {
      const idx = nodes.length;
      nodes.push({
        id: idx,
        name,
        type: 'expense',
        valueInCents: cents,
      });
      outflowIndices.push(idx);
    }
  }

  // 5. Balancing Outflow Node: Surplus (if surplus)
  if (surplusInCents > 0) {
    const surplusIdx = nodes.length;
    nodes.push({
      id: surplusIdx,
      name: 'Surplus Reserve',
      type: 'surplus',
      valueInCents: surplusInCents,
      isBalancing: true,
    });
    outflowIndices.push(surplusIdx);
  }

  // Connect Central Pool to all Outflows
  for (const outIdx of outflowIndices) {
    const val = nodes[outIdx].valueInCents;
    if (val > 0) {
      links.push({
        source: poolIdx,
        target: outIdx,
        value: val,
        isBalancing: nodes[outIdx].isBalancing || false,
      });
    }
  }

  return {
    nodes,
    links,
    totalFlowInCents: totalFlow,
  };
}

/**
 * Renders the interactive balanced D3 Sankey diagram into a DOM container element.
 *
 * @param {HTMLElement} containerEl
 * @param {import('./dataset.js').TransactionStore} store
 * @param {Function} onSelectCategory
 */
export function renderSankeyChart(containerEl, store, onSelectCategory) {
  if (!containerEl) return;

  // Clear previous SVG
  containerEl.innerHTML = '';

  const graphData = buildSankeyGraph(store);
  if (graphData.nodes.length === 0 || graphData.links.length === 0) {
    containerEl.innerHTML = `
      <div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--text-faint); font-family:var(--font-mono); font-size:13px;">
        NO ACTIVE TRANSACTIONS IN THIS PERIOD
      </div>`;
    return;
  }

  const containerWidth = Math.max(680, containerEl.clientWidth || 1000);
  const containerHeight = Math.max(360, containerEl.clientHeight || 380);

  const margin = { top: 24, right: 160, bottom: 24, left: 160 };
  const width = Math.max(300, containerWidth - margin.left - margin.right);
  const height = Math.max(200, containerHeight - margin.top - margin.bottom);

  const svg = d3
    .select(containerEl)
    .append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
    .attr('width', containerWidth)
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('overflow', 'hidden');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Configure D3 Sankey layout
  const sankey = d3Sankey()
    .nodeId((d) => d.id)
    .nodeWidth(16)
    .nodePadding(18)
    .extent([
      [0, 0],
      [width, height],
    ]);

  // Deep clone data to avoid mutations between runs
  const sankeyInput = {
    nodes: graphData.nodes.map((n) => ({ ...n })),
    links: graphData.links.map((l) => ({ ...l })),
  };

  let layoutData;
  try {
    layoutData = sankey(sankeyInput);
  } catch (err) {
    console.error('Sankey layout computation error:', err);
    return;
  }

  // Tooltip helper
  let tooltip = d3.select(containerEl).select('.sankey-tooltip');
  if (tooltip.empty()) {
    tooltip = d3
      .select(containerEl)
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('background', '#0d1322')
      .style('border', '1px solid #1e293b')
      .style('color', '#f8fafc')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '11.5px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 100)
      .style('box-shadow', '0 4px 14px rgba(0,0,0,0.5)');
  }

  // Draw links
  const linksGroup = g.append('g').attr('class', 'sankey-links').attr('fill', 'none');

  const linkElements = linksGroup
    .selectAll('path')
    .data(layoutData.links)
    .enter()
    .append('path')
    .attr('d', sankeyLinkHorizontal())
    .attr('stroke', (d) => {
      if (d.isBalancing) return SANKEY_COLORS.gap;
      if (d.source.type === 'income') return SANKEY_COLORS.income;
      if (d.target.type === 'surplus') return SANKEY_COLORS.surplus;
      return SANKEY_COLORS.expense;
    })
    .attr('stroke-width', (d) => Math.max(1.5, d.width))
    .attr('stroke-opacity', (d) => (d.isBalancing ? 0.45 : 0.28))
    .style('transition', 'stroke-opacity 0.2s, stroke-width 0.2s')
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .attr('stroke-opacity', 0.8)
        .attr('stroke-width', Math.max(2.5, d.width + 1));
      tooltip
        .style('opacity', 1)
        .html(
          `<strong>${escapeHTML(d.source.name)} → ${escapeHTML(d.target.name)}</strong><br/>` +
            `Flow: <span style="color:#06b6d4">${formatCentsExact(d.value)}</span>` +
            (d.isBalancing ? `<br/><span style="color:#ef4444; font-weight:700">⚠️ BALANCING FLOW</span>` : '')
        );
    })
    .on('mousemove', function (event) {
      const bounds = containerEl.getBoundingClientRect();
      tooltip
        .style('left', event.clientX - bounds.left + 15 + 'px')
        .style('top', event.clientY - bounds.top - 20 + 'px');
    })
    .on('mouseleave', function (event, d) {
      d3.select(this)
        .attr('stroke-opacity', d.isBalancing ? 0.45 : 0.28)
        .attr('stroke-width', Math.max(1.5, d.width));
      tooltip.style('opacity', 0);
    });

  // Draw nodes
  const nodesGroup = g.append('g').attr('class', 'sankey-nodes');

  const nodeElements = nodesGroup
    .selectAll('g')
    .data(layoutData.nodes)
    .enter()
    .append('g')
    .attr('class', 'sankey-node')
    .attr('tabindex',d=>d.type==='expense'?0:null)
    .attr('role',d=>d.type==='expense'?'button':null)
    .attr('aria-label',d=>`${escapeHTML(d.name)}: ${formatCents(d.valueInCents)}`)
    .on('keydown',(event,d)=>{if(d.type==='expense'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onSelectCategory?.(d.name);}})
    .style('cursor', (d) => (d.type === 'expense' || d.type === 'income' ? 'pointer' : 'default'))
    .on('click', (event, d) => {
      if (typeof onSelectCategory === 'function' && d.type === 'expense') {
        onSelectCategory(d.name);
      }
    })
    .on('mouseenter', function (event, d) {
      d3.select(this).select('rect').attr('stroke-width', 2);
      linkElements
        .filter((l) => l.source === d || l.target === d)
        .attr('stroke-opacity', 0.85);

      tooltip.style('opacity', 1).html(
        `<strong>${escapeHTML(d.name)}</strong><br/>` +
          `Amount: <span style="color:#f8fafc">${formatCentsExact(d.valueInCents)}</span>` +
          (d.isBalancing ? `<br/><span style="color:#ef4444">BALANCING INFLOW NODE</span>` : '')
      );
    })
    .on('mousemove', function (event) {
      const bounds = containerEl.getBoundingClientRect();
      tooltip
        .style('left', event.clientX - bounds.left + 15 + 'px')
        .style('top', event.clientY - bounds.top - 20 + 'px');
    })
    .on('mouseleave', function (event, d) {
      d3.select(this).select('rect').attr('stroke-width', 1);
      linkElements
        .filter((l) => l.source === d || l.target === d)
        .attr('stroke-opacity', (l) => (l.isBalancing ? 0.45 : 0.28));
      tooltip.style('opacity', 0);
    });

  // Node rectangles
  nodeElements
    .append('rect')
    .attr('x', (d) => d.x0)
    .attr('y', (d) => d.y0)
    .attr('height', (d) => Math.max(4, d.y1 - d.y0))
    .attr('width', (d) => d.x1 - d.x0)
    .attr('rx', 2)
    .attr('fill', (d) => {
      if (d.type === 'gap') return SANKEY_COLORS.gap;
      if (d.type === 'income') return SANKEY_COLORS.income;
      if (d.type === 'pool') return SANKEY_COLORS.pool;
      if (d.type === 'surplus') return SANKEY_COLORS.surplus;
      return SANKEY_COLORS.expense;
    })
    .attr('stroke', (d) => {
      if (d.type === 'gap') return '#fca5a5';
      if (d.type === 'income') return '#34d399';
      if (d.type === 'pool') return '#67e8f9';
      return '#fcd34d';
    })
    .attr('stroke-width', 1);

  // Node labels
  nodeElements
    .append('text')
    .attr('x', (d) => (d.x0 < width / 2 ? d.x0 - 8 : d.x1 + 8))
    .attr('y', (d) => (d.y1 + d.y0) / 2 - 4)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'end' : 'start'))
    .text((d) => d.name)
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '11px')
    .style('font-weight', (d) => (d.isBalancing || d.type === 'pool' ? '700' : '600'))
    .style('fill', (d) => {
      if (d.type === 'gap') return '#ef4444';
      if (d.type === 'income') return '#10b981';
      if (d.type === 'pool') return '#06b6d4';
      if (d.type === 'surplus') return '#3b82f6';
      return '#f8fafc';
    });

  // Node sub-label with exact value
  nodeElements
    .append('text')
    .attr('x', (d) => (d.x0 < width / 2 ? d.x0 - 8 : d.x1 + 8))
    .attr('y', (d) => (d.y1 + d.y0) / 2 + 10)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'end' : 'start'))
    .text((d) => formatCents(d.valueInCents))
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', '#94a3b8');
}
