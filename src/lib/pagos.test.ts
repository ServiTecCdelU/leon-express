// Sin test runner en el repo: usa node:test (ver nota en qr-distribuidora.test.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMonto } from './pagos';

test('lee montos con miles y decimales en formato argentino', () => {
  assert.equal(parseMonto('15.000,50'), 15000.5);
  assert.equal(parseMonto('$ 2.500'), 2500);
  assert.equal(parseMonto('1.234.567'), 1234567);
  assert.equal(parseMonto('2500.5'), 2500.5);
  assert.equal(parseMonto('800'), 800);
});

test('rechaza montos vacíos, en cero o mal escritos', () => {
  assert.equal(parseMonto(''), null);
  assert.equal(parseMonto('0'), null);
  assert.equal(parseMonto('12,345,6'), null);
  assert.equal(parseMonto('abc'), null);
});
