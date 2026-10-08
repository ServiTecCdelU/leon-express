import assert from 'node:assert/strict';
import { ICONO_RUBRO_DEFAULT, iconoRubro, nombreRubro, rubrosVisibles } from './rubros';

test('nombreRubro: capitaliza, pone tildes y separa las barras', () => {
  assert.equal(nombreRubro('ALMACEN'), 'Almacén');
  assert.equal(nombreRubro('GOLOSINAS/ALFAJORES'), 'Golosinas / Alfajores');
  assert.equal(nombreRubro('SNACKS / PANIFICADOS'), 'Snacks / Panificados');
  assert.equal(nombreRubro('FERRETERIA/HERRAMIENTAS'), 'Ferretería / Herramientas');
  assert.equal(nombreRubro('  vinos  '), 'Vinos');
});

test('rubrosVisibles: saca "Sin categoría" y repetidos, respeta el orden', () => {
  assert.deepEqual(rubrosVisibles(['BEBIDAS', 'Sin categoria', 'Sin categoría', 'bebidas', 'VINOS']), ['BEBIDAS', 'VINOS']);
  assert.deepEqual(rubrosVisibles([]), []);
});

test('iconoRubro: por palabra clave, con o sin tildes', () => {
  assert.equal(iconoRubro('BEBIDAS'), 'bottle-soda-outline');
  assert.equal(iconoRubro('GOLOSINAS/ALFAJORES'), 'candy-outline');
  assert.equal(iconoRubro('Librería'), 'pencil-outline');
  assert.equal(iconoRubro('ALGO NUEVO'), ICONO_RUBRO_DEFAULT);
});
