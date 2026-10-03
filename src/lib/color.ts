// Contraste del color de marca (lo carga cada distribuidora en el SaaS, puede venir claro).
// Se usa de fondo de botones con texto blanco y como color de links sobre blanco: tiene que
// llegar a 4.5:1 (WCAG AA texto normal). Si no llega, se oscurece lo justo.

const HEX = /^#?([0-9a-f]{6})$/i;
const MINIMO_AA = 4.5;
const PASO = 0.05;

function rgb(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const aHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

function luminancia([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contraste WCAG entre dos colores hex (1 a 21). */
export function contraste(a: string, b: string): number {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return 1;
  const [claro, oscuro] = [luminancia(ca), luminancia(cb)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** El color, o una versión más oscura, que contraste al menos 4.5:1 con blanco. Hex inválido → respaldo. */
export function colorLegible(hex: string, respaldo: string): string {
  const base = rgb(hex);
  if (!base) return respaldo;
  let actual = base;
  // Mezclar con negro de a 5%: en el peor caso (blanco) llega en ~12 pasos.
  for (let mezcla = 0; mezcla <= 1; mezcla += PASO) {
    actual = base.map((c) => c * (1 - mezcla)) as [number, number, number];
    if (contraste(aHex(actual), '#ffffff') >= MINIMO_AA) break;
  }
  return aHex(actual);
}
