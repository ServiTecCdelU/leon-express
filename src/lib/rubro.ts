// Paleta de las fichas por rubro (diseño: productos sin foto → bloque de color + iniciales).
const PALETA: { bg: string; fg: string }[] = [
  { bg: '#E9DCC4', fg: '#5B4217' },
  { bg: '#F9E1A8', fg: '#6B4A05' },
  { bg: '#CDE7F0', fg: '#0F4A5C' },
  { bg: '#D9E8D2', fg: '#2F4F1F' },
  { bg: '#F3D5D0', fg: '#6E2419' },
  { bg: '#E3DDF2', fg: '#3E2F6B' },
  { bg: '#E4E1DA', fg: '#3A3F3D' },
];

/** Color estable por rubro: el mismo rubro siempre cae en el mismo color. */
export function colorRubro(rubro: string): { bg: string; fg: string } {
  let h = 0;
  for (const ch of rubro.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}
