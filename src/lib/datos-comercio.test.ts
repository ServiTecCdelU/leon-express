import assert from 'node:assert/strict';
import { errorDatosAlta, errorDatosComercio } from './datos-comercio';

const completos = { negocio: 'Almacén Don Pepe', direccion: 'San Martín 123', localidad: 'C. del Uruguay', telefono: '3442 15-123456' };

test('con todo completo no hay error', () => {
  assert.equal(errorDatosComercio(completos), null);
});

test('marca el primer campo que falta', () => {
  assert.equal(errorDatosComercio({ ...completos, negocio: ' ' }), 'Escribí el nombre del negocio.');
  assert.equal(errorDatosComercio({ ...completos, direccion: '' }), 'Escribí la dirección.');
  assert.equal(errorDatosComercio({ ...completos, localidad: 'x' }), 'Escribí la localidad.');
});

test('pide un teléfono con al menos 6 números', () => {
  assert.equal(errorDatosComercio({ ...completos, telefono: '12-34' }), 'Escribí un teléfono válido.');
});

test('el alta pide nombre y supermercado', () => {
  assert.equal(errorDatosAlta({ nombre: 'Juan Pérez', negocio: 'Súper Don Pepe' }), null);
  assert.equal(errorDatosAlta({ nombre: ' ', negocio: 'Súper Don Pepe' }), 'Escribí tu nombre.');
  assert.equal(errorDatosAlta({ nombre: 'Juan', negocio: 'x' }), 'Escribí el nombre del supermercado.');
});
