import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrencyToCents, formatCents, formatCentsExact, sumCents } from '../src/js/currency.js';

test('parseCurrencyToCents handles standard dollars and cents', () => {
  assert.deepEqual(parseCurrencyToCents('2500.00'), { cents: 250000, isNegative: false, isValid: true });
  assert.deepEqual(parseCurrencyToCents('$1,250.50'), { cents: 125050, isNegative: false, isValid: true });
  assert.deepEqual(parseCurrencyToCents('$0.99'), { cents: 99, isNegative: false, isValid: true });
});

test('parseCurrencyToCents handles negative values in all common formats', () => {
  assert.deepEqual(parseCurrencyToCents('-$1,850.00'), { cents: -185000, isNegative: true, isValid: true });
  assert.deepEqual(parseCurrencyToCents('($620.00)'), { cents: -62000, isNegative: true, isValid: true });
  assert.deepEqual(parseCurrencyToCents('450.00-'), { cents: -45000, isNegative: true, isValid: true });
});

test('parseCurrencyToCents rejects invalid strings', () => {
  assert.equal(parseCurrencyToCents('').isValid, false);
  assert.equal(parseCurrencyToCents('N/A').isValid, false);
  assert.equal(parseCurrencyToCents('$12.34.56').isValid, false);
  assert.equal(parseCurrencyToCents('abc').isValid, false);
});

test('formatCents produces exact two-decimal output', () => {
  assert.equal(formatCents(250000), '$2,500.00');
  assert.equal(formatCents(-87000), '-$870.00');
  assert.equal(formatCents(0), '$0.00');
  assert.equal(formatCents(425000, true), '+$4,250.00');
});

test('formatCentsExact includes cent counter', () => {
  assert.equal(formatCentsExact(250000), '$2,500.00 (250,000¢)');
  assert.equal(formatCentsExact(-87000), '-$870.00 (87,000¢)');
});

test('sumCents preserves integer precision across large arrays', () => {
  const items = [250000, 125000, 50000];
  assert.equal(sumCents(items), 425000);
});
