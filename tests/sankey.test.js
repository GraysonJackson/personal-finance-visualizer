import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSankeyGraph } from '../src/js/sankey-engine.js';
import { TransactionStore } from '../src/js/dataset.js';

test('buildSankeyGraph balances Gate 1 sample data with Funding gap', () => {
  const store = new TransactionStore();
  const graph = buildSankeyGraph(store);

  // In Gate 1 sample data:
  // Income = 425,000 cents ($4,250.00)
  // Expenses = 512,000 cents ($5,120.00)
  // Required Funding gap = 87,000 cents ($870.00)
  const gapNode = graph.nodes.find((n) => n.name === 'Funding gap');
  assert.ok(gapNode, "Synthetic node 'Funding gap' must exist");
  assert.equal(gapNode.valueInCents, 87000);
  assert.equal(gapNode.isBalancing, true);

  // Pool node value must equal total outflows (512,000 cents)
  const poolNode = graph.nodes.find((n) => n.type === 'pool');
  assert.ok(poolNode, "Central pool node must exist");
  assert.equal(poolNode.valueInCents, 512000);

  // Verify all link values strictly >= 0
  for (const link of graph.links) {
    assert.equal(typeof link.value, 'number');
    assert.equal(link.value >= 0, true);
  }

  // Verify total inflow links to pool == total outflow links from pool
  const inflowLinks = graph.links.filter((l) => l.target === poolNode.id);
  const outflowLinks = graph.links.filter((l) => l.source === poolNode.id);

  const sumInflow = inflowLinks.reduce((acc, l) => acc + l.value, 0);
  const sumOutflow = outflowLinks.reduce((acc, l) => acc + l.value, 0);

  assert.equal(sumInflow, 512000);
  assert.equal(sumOutflow, 512000);
  assert.equal(sumInflow, sumOutflow);
});

test('buildSankeyGraph balances Surplus scenario with synthetic Surplus node', () => {
  const surplusTx = [
    { id: '1', date: '2026-10-01', description: 'Consulting Contract', category: 'Income', amountInCents: 700000, type: 'income' },
    { id: '2', date: '2026-10-02', description: 'Office Space', category: 'Housing', amountInCents: 300000, type: 'expense' },
  ];
  const store = new TransactionStore(surplusTx);
  const graph = buildSankeyGraph(store);

  // Income = 700,000; Expenses = 300,000; Surplus = 400,000
  const gapNode = graph.nodes.find((n) => n.name === 'Funding gap');
  assert.equal(gapNode, undefined, "Funding gap must NOT exist in surplus scenario");

  const surplusNode = graph.nodes.find((n) => n.name === 'Surplus Reserve');
  assert.ok(surplusNode, "Surplus node must exist when income exceeds expenses");
  assert.equal(surplusNode.valueInCents, 400000);

  const poolNode = graph.nodes.find((n) => n.type === 'pool');
  const inflowLinks = graph.links.filter((l) => l.target === poolNode.id);
  const outflowLinks = graph.links.filter((l) => l.source === poolNode.id);

  const sumInflow = inflowLinks.reduce((acc, l) => acc + l.value, 0);
  const sumOutflow = outflowLinks.reduce((acc, l) => acc + l.value, 0);

  assert.equal(sumInflow, 700000);
  assert.equal(sumOutflow, 700000);
  assert.equal(sumInflow, sumOutflow);
});

test('buildSankeyGraph Monte-Carlo invariant stress test (1,000 random distributions)', () => {
  for (let trial = 0; trial < 1000; trial++) {
    const txCount = Math.floor(Math.random() * 20) + 1;
    const testTxs = [];
    for (let i = 0; i < txCount; i++) {
      testTxs.push({
        id: `tx-test-${trial}-${i}`,
        date: '2026-10-15',
        description: `Tx ${i}`,
        category: `Category ${i % 5}`,
        amountInCents: Math.floor(Math.random() * 300000) + 100,
        type: Math.random() > 0.5 ? 'income' : 'expense',
      });
    }

    const store = new TransactionStore(testTxs);
    const graph = buildSankeyGraph(store);
    const poolNode = graph.nodes.find((n) => n.type === 'pool');

    const inflowLinks = graph.links.filter((l) => l.target === poolNode.id);
    const outflowLinks = graph.links.filter((l) => l.source === poolNode.id);

    const sumInflow = inflowLinks.reduce((acc, l) => acc + l.value, 0);
    const sumOutflow = outflowLinks.reduce((acc, l) => acc + l.value, 0);

    assert.equal(sumInflow, sumOutflow, `Trial ${trial}: Inflow sum != Outflow sum`);

    for (const link of graph.links) {
      assert.equal(link.value >= 0, true, `Trial ${trial}: Link value negative`);
    }
  }
});
