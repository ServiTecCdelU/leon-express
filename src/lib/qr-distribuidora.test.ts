import assert from 'node:assert/strict';
import { parseQrDistribuidora } from './qr-distribuidora';

test('reconoce el deep link de distribuidora con esquema propio', () => {
  assert.deepEqual(parseQrDistribuidora('servitecpedidos://a/demo'), { tipo: 'distribuidora', slug: 'demo' });
});

test('reconoce el link web de distribuidora sin inv', () => {
  assert.deepEqual(parseQrDistribuidora('https://servitec-demo.vercel.app/a/demo'), {
    tipo: 'distribuidora',
    slug: 'demo',
  });
});

test('ignora slash final en el link de distribuidora', () => {
  assert.deepEqual(parseQrDistribuidora('https://servitec-demo.vercel.app/a/demo/'), {
    tipo: 'distribuidora',
    slug: 'demo',
  });
});

test('reconoce una invitación de cliente con token en el mismo formato de link', () => {
  const link = 'https://servitec-demo.vercel.app/a/demo?inv=ABCDEFGHIJ0123456789';
  assert.deepEqual(parseQrDistribuidora(link), { tipo: 'invitacion', token: 'ABCDEFGHIJ0123456789', slug: 'demo' });
});

test('reconoce una invitación con esquema propio y token', () => {
  const link = 'servitecpedidos://invitacion?slug=demo&inv=ABCDEFGHIJ0123456789';
  assert.deepEqual(parseQrDistribuidora(link), { tipo: 'invitacion', token: 'ABCDEFGHIJ0123456789', slug: 'demo' });
});

test('reconoce un token pelado (sin link)', () => {
  assert.deepEqual(parseQrDistribuidora('ABCDEFGHIJ0123456789'), {
    tipo: 'invitacion',
    token: 'ABCDEFGHIJ0123456789',
    slug: null,
  });
});

test('devuelve null para texto que no matchea nada', () => {
  assert.equal(parseQrDistribuidora('cualquier cosa'), null);
  assert.equal(parseQrDistribuidora(''), null);
});

test('reconoce el link web /app/<slug> del QR de la distribuidora', () => {
  assert.deepEqual(parseQrDistribuidora('https://servitec-demo.vercel.app/app/demo'), { tipo: 'distribuidora', slug: 'demo' });
  assert.deepEqual(parseQrDistribuidora('servitec.net.ar/app/Demo'), { tipo: 'distribuidora', slug: 'demo' });
});
