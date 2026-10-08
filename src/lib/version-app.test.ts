import assert from 'node:assert/strict';
import { estadoVersion, versionInstalada } from './version-app';

const publicada = { ultimaVersion: 22, versionMinima: 18, urlTienda: null };

test('versionInstalada: lee el versionCode y descarta lo que no es un entero positivo', () => {
  assert.equal(versionInstalada('20'), 20);
  assert.equal(versionInstalada(null), null);
  assert.equal(versionInstalada(undefined), null);
  assert.equal(versionInstalada(''), null);
  assert.equal(versionInstalada('1.0.0'), null);
  assert.equal(versionInstalada('0'), null);
});

test('estadoVersion: al día cuando la instalada es igual o mayor a la última', () => {
  assert.equal(estadoVersion(22, publicada), 'al-dia');
  assert.equal(estadoVersion(25, publicada), 'al-dia');
});

test('estadoVersion: disponible entre la mínima y la última', () => {
  assert.equal(estadoVersion(18, publicada), 'disponible');
  assert.equal(estadoVersion(21, publicada), 'disponible');
});

test('estadoVersion: obligatoria por debajo de la mínima', () => {
  assert.equal(estadoVersion(17, publicada), 'obligatoria');
});

test('estadoVersion: sin datos no avisa', () => {
  assert.equal(estadoVersion(null, publicada), 'al-dia');
  assert.equal(estadoVersion(10, null), 'al-dia');
  assert.equal(estadoVersion(10, undefined), 'al-dia');
});
