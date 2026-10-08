import assert from 'node:assert/strict';
import { colorLegible, contraste } from './color';

const RESPALDO = '#0f766e';

test('contraste: blanco contra negro es 21 y contra sí mismo 1', () => {
  assert.equal(Math.round(contraste('#ffffff', '#000000')), 21);
  assert.equal(contraste('#ffffff', '#ffffff'), 1);
});

test('colorLegible: un color que ya contrasta queda igual', () => {
  assert.equal(colorLegible('#0f766e', RESPALDO), '#0f766e');
  assert.equal(colorLegible('#1d4ed8', RESPALDO), '#1d4ed8');
});

test('colorLegible: un color claro se oscurece hasta llegar a 4.5:1 con blanco', () => {
  for (const claro of ['#0d9488', '#facc15', '#22c55e', '#ffffff']) {
    const legible = colorLegible(claro, RESPALDO);
    assert.ok(contraste(legible, '#ffffff') >= 4.5, `${claro} → ${legible}`);
  }
});

test('colorLegible: acepta sin # y en mayúsculas', () => {
  assert.equal(colorLegible('0F766E', RESPALDO), '#0f766e');
});

test('colorLegible: hex inválido usa el respaldo', () => {
  assert.equal(colorLegible('rojo', RESPALDO), RESPALDO);
  assert.equal(colorLegible('#fff', RESPALDO), RESPALDO);
  assert.equal(colorLegible('', RESPALDO), RESPALDO);
});
