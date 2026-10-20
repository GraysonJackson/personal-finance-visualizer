import { escapeHTML } from './text.js';
import * as d3 from 'd3';
import { formatCents, formatCentsExact } from './currency.js';

const CATEGORY_COLORS = {
  Contracts: '#10b981',
  Engineering: '#34d399',
  Advisory: '#6ee7b7',
  Housing: '#f59e0b',
  Healthcare: '#fbbf24',
  Infrastructure: '#38bdf8',
  'Taxes & Reserves': '#a855f7',
  Equipment: '#ec4899',
  'Food & Living': '#f97316',
  Default: '#64748b',
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}

/**
 * Renders the Stacked Cashflow History chart.
 * Shows dual comparisons: Inflow lump-sums vs baseline outflow categories across historical months.
 *
 * @param {HTMLElement} containerEl
 * @param {import('./dataset.js').TransactionStore} store
 */
export function renderHistoryChart(containerEl, store) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const monthlyData = store.getMonthlyTimeline();
  if (monthlyData.length === 0) {
    containerEl.innerHTML = `
      <div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--text-faint); font-family:var(--font-mono); font-size:12px;">
        NO TIMELINE DATA AVAILABLE
      </div>`;
    return;
  }

  // Find max value across both income and expense for scaling
  const maxCents = d3.max(monthlyData, (d) => Math.max(d.incomeInCents, d.expenseInCents)) || 100000;

  const containerWidth = containerEl.clientWidth || 500;
  const containerHeight = Math.max(220, containerEl.clientHeight || 240);

  const margin = { top: 20, right: 20, bottom: 44, left: 60 };
  const width = Math.max(200, containerWidth - margin.left - margin.right);
  const height = Math.max(120, containerHeight - margin.top - margin.bottom);

  const svg = d3
    .select(containerEl)
    .append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // X scale for months
  const x0 = d3
    .scaleBand()
    .domain(monthlyData.map((d) => d.month))
    .range([0, width])
    .padding(0.24);

  // Y scale for cents
  const y = d3.scaleLinear().domain([0, maxCents * 1.1]).range([height, 0]);

  // Tooltip
  let tooltip = d3.select(containerEl).select('.history-tooltip');
  if (tooltip.empty()) {
    tooltip = d3
      .select(containerEl)
      .append('div')
      .attr('class', 'history-tooltip')
      .style('position', 'absolute')
      .style('background', '#0d1322')
      .style('border', '1px solid #1e293b')
      .style('color', '#f8fafc')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 100);
  }

  // Grid lines
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3
        .axisLeft(y)
        .ticks(4)
        .tickSize(-width)
        .tickFormat('')
    )
    .selectAll('line')
    .style('stroke', '#162032')
    .style('stroke-dasharray', '2,2');

  // Y-axis labels
  g.append('g')
    .call(
      d3
        .axisLeft(y)
        .ticks(4)
        .tickFormat((d) => `$${(d / 100).toLocaleString()}`)
    )
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', '#64748b');

  g.selectAll('.domain').style('stroke', '#1e293b');

  // X-axis month labels
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(x0).tickFormat((m) => {
        const item = monthlyData.find((d) => d.month === m);
        return item ? item.label : m;
      })
    )
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', (m) => (m === store.selectedPeriod ? '#06b6d4' : '#64748b'))
    .style('font-weight', (m) => (m === store.selectedPeriod ? '700' : '400'));

  // Month Groups
  const monthGroups = g
    .selectAll('.month-col')
    .data(monthlyData)
    .enter()
    .append('g')
    .attr('class', 'month-col')
    .attr('transform', (d) => `translate(${x0(d.month)},0)`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      store.setSelectedPeriod(d.month);
    });

  const barWidth = Math.max(6, x0.bandwidth() / 2 - 2);

  // Inflow bar (Left)
  monthGroups
    .append('rect')
    .attr('x', 0)
    .attr('y', (d) => y(d.incomeInCents))
    .attr('width', barWidth)
    .attr('height', (d) => Math.max(0, height - y(d.incomeInCents)))
    .attr('rx', 2)
    .attr('fill', '#10b981')
    .attr('opacity', (d) => (d.month === store.selectedPeriod ? 1 : 0.75))
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('opacity', 1);
      tooltip.style('opacity', 1).html(
        `<strong>${d.label} INFLOWS</strong><br/>` +
          `Total: <span style="color:#10b981">${formatCentsExact(d.incomeInCents)}</span><br/>` +
          `<span style="color:#94a3b8; font-size:10px">Click to view in Sankey</span>`
      );
    })
    .on('mousemove', function (event) {
      const bounds = containerEl.getBoundingClientRect();
      tooltip
        .style('left', event.clientX - bounds.left + 10 + 'px')
        .style('top', event.clientY - bounds.top - 20 + 'px');
    })
    .on('mouseleave', function (event, d) {
      d3.select(this).attr('opacity', d.month === store.selectedPeriod ? 1 : 0.75);
      tooltip.style('opacity', 0);
    });

  // Outflow stacked segments (Right)
  monthGroups.each(function (d) {
    const group = d3.select(this);
    let cumulativeCents = 0;
    const catEntries = Object.entries(d.categories);

    for (const [catName, catCents] of catEntries) {
      const segY0 = cumulativeCents;
      cumulativeCents += catCents;
      const segY1 = cumulativeCents;

      const yTop = y(segY1);
      const yBottom = y(segY0);
      const segHeight = Math.max(1, yBottom - yTop);

      group
        .append('rect')
        .attr('x', barWidth + 2)
        .attr('y', yTop)
        .attr('width', barWidth)
        .attr('height', segHeight)
        .attr('rx', 1)
        .attr('fill', getCategoryColor(catName))
        .attr('opacity', d.month === store.selectedPeriod ? 1 : 0.75)
        .on('mouseenter', function (event) {
          d3.select(this).attr('opacity', 1);
          tooltip.style('opacity', 1).html(
            `<strong>${d.label} OUTFLOW</strong><br/>` +
              `${catName}: <span style="color:#f59e0b">${formatCentsExact(catCents)}</span><br/>` +
              `<span style="color:#94a3b8; font-size:10px">Total Outflows: ${formatCents(d.expenseInCents)}</span>`
          );
        })
        .on('mousemove', function (event) {
          const bounds = containerEl.getBoundingClientRect();
          tooltip
            .style('left', event.clientX - bounds.left + 10 + 'px')
            .style('top', event.clientY - bounds.top - 20 + 'px');
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', d.month === store.selectedPeriod ? 1 : 0.75);
          tooltip.style('opacity', 0);
        });
    }
  });
}
