// Después de un build de EAS exitoso: guarda el versionCode nuevo de app.json como
// `ultima_version` de esta app en el SaaS (tabla app_versiones, SQL/108), para que las
// versiones más viejas muestren "Hay una nueva versión". Y commitea el app.json con el número.
// Lo corre `npm run build:android`; también se puede correr solo: `node scripts/publicar-version.mjs`.
//
// Usa las credenciales del SaaS (su .env.local, carpeta hermana; otra ruta con SAAS_ENV_LOCAL).
// Nunca imprime las claves.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ENV_SAAS = process.env.SAAS_ENV_LOCAL ?? path.resolve(RAIZ, '..', 'Distribuidora DEMO 001', '.env.local');

function leerEnv(archivo) {
  if (!fs.existsSync(archivo)) throw new Error(`No encuentro las credenciales del SaaS en ${archivo}`);
  const pares = fs
    .readFileSync(archivo, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    });
  return Object.fromEntries(pares);
}

function leerApp() {
  const { expo } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8'));
  const versionCode = expo?.android?.versionCode;
  const appId = expo?.extra?.appId;
  if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error('app.json no tiene android.versionCode');
  if (!appId) throw new Error('app.json no tiene extra.appId');
  return { versionCode, appId };
}

async function publicar({ appId, versionCode }, env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = env.SUPABASE_SECRET_KEY;
  if (!url || !clave) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en el .env.local del SaaS');
  const headers = { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' };
  const fila = `${url}/rest/v1/app_versiones?app=eq.${encodeURIComponent(appId)}`;

  const actual = await fetch(`${fila}&select=ultima_version`, { headers });
  if (!actual.ok) throw new Error(`No se pudo leer la versión publicada (HTTP ${actual.status})`);
  const [registro] = await actual.json();
  if (!registro) throw new Error(`No hay fila para "${appId}" en app_versiones (ver SQL/108)`);
  // Nunca bajar el número: un build viejo o repetido no tiene que "des-avisar".
  if (registro.ultima_version >= versionCode) {
    console.log(`La base ya tiene ${registro.ultima_version} (>= ${versionCode}): no se toca.`);
    return;
  }

  const res = await fetch(fila, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ ultima_version: versionCode, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`No se pudo guardar la versión (HTTP ${res.status})`);
  console.log(`Versión publicada de ${appId}: ${registro.ultima_version} → ${versionCode}`);
}

function commitearAppJson(versionCode) {
  const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' });
  if (!git('status', '--porcelain', '--', 'app.json').trim()) return;
  git('commit', '-m', `chore: versionCode ${versionCode}`, '--', 'app.json');
  console.log(`app.json commiteado (versionCode ${versionCode}).`);
}

const app = leerApp();
await publicar(app, leerEnv(ENV_SAAS));
commitearAppJson(app.versionCode);
