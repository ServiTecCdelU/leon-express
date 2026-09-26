// Tokens del diseño "App Pedidos B2B — Pantallas". El acento es el color de la
// distribuidora (distribuidoras.color_primario); ACCENT_DEFAULT es el teal del SaaS.

export const ACCENT_DEFAULT = '#0F766E';

export const colors = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  ink: '#16201D',
  inkSoft: '#3F4A47',
  muted: '#5B6663',
  line: '#DAD6CC',
  lineSoft: '#EEEBE3',
  offer: '#C2410C',
  offerSoft: '#FFF1E6',
  offerInk: '#9A3412',
  warnSoft: '#FFF7ED',
  warnLine: '#FDBA74',
  warnInk: '#7C2D12',
  okSoft: '#DCFCE7',
  okInk: '#166534',
  amberSoft: '#FEF3C7',
  amberInk: '#92400E',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 } as const;

/** Tinte suave del acento sobre blanco (equivalente a color-mix del diseño). */
export function tint(hex: string, amount = 0.12): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
