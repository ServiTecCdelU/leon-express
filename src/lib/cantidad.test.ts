// Sin test runner en el repo: usa node:test (ver nota en qr-distribuidora.test.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { equivalencia, MAX_CANTIDAD, parsearCantidad, tamanoLote, unidadDeVenta } from './cantidad';

test('tamaño del lote: pack si se divide, si no el bulto, si no 1', () => {
  assert.equal(tamanoLote(12, null), 12);
  assert.equal(tamanoLote(12, 6), 6);
  assert.equal(tamanoLote(null, null), 1);
  assert.equal(tamanoLote(1, null), 1);
});

test('unidad de venta en singular y plural', () => {
  assert.equal(unidadDeVenta(12, null, 1), 'bulto');
  assert.equal(unidadDeVenta(12, null, 5), 'bultos');
  assert.equal(unidadDeVenta(12, 6, 2), 'packs');
  assert.equal(unidadDeVenta(null, null, 1), 'unidad');
  assert.equal(unidadDeVenta(null, null, 3), 'unidades');
});

test('equivalencia en unidades solo cuando el lote tiene más de una', () => {
  assert.equal(equivalencia(10, 12, null), '120 u');
  assert.equal(equivalencia(1000, 12, null), '12.000 u');
  assert.equal(equivalencia(3, null, null), null);
});

test('parsear cantidad tipeada: enteros, con o sin separador de miles', () => {
  assert.equal(parsearCantidad('1000'), 1000);
  assert.equal(parsearCantidad('1.000'), 1000);
  assert.equal(parsearCantidad(' 25 '), 25);
  assert.equal(parsearCantidad(''), 0);
  assert.equal(parsearCantidad('abc'), 0);
});

test('parsear cantidad respeta el máximo del servidor', () => {
  assert.equal(parsearCantidad('999999'), MAX_CANTIDAD);
});
