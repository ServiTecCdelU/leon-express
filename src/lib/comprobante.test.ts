import assert from 'node:assert/strict';
import { textoComprobante } from './comprobante';

const pedido = {
  id: 'p1',
  numero: 1520,
  estado: 'en_camino' as const,
  retenido: false,
  fecha: '2026-10-07T15:00:00Z',
  desdeApp: true,
  cantidadProductos: 2,
  total: 38400,
  items: [
    { productId: 'a', nombre: 'Aceite 900 ml', cantidad: 12 },
    { productId: 'b', nombre: 'Yerba 1 kg', cantidad: 0 },
  ],
};

test('arma el comprobante con número, distribuidora, productos y total', () => {
  const t = textoComprobante(pedido, 'Distribuidora León');
  assert.match(t, /^\*Pedido N° 1520\* — Distribuidora León/);
  assert.match(t, /Estado: En reparto/);
  assert.match(t, /• 12 x Aceite 900 ml/);
  assert.doesNotMatch(t, /Yerba/);
  assert.match(t, /\*Total: \$ 38\.400\*$/);
});
