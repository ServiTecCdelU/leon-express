// Identidad del panel del SaaS (app/globals.css + clases Tailwind más usadas):
// fondo gris muy claro, tarjetas blancas con borde, acciones en teal, avisos en amber,
// estados OK en emerald, radios rounded-2xl y tipografía Geist.
// El acento puede venir de la distribuidora (distribuidoras.color_primario).

// teal-700: botones y links. El teal-600 del panel (#0d9488) con texto blanco da 3.7:1 (< 4.5 AA).
export const ACCENT_DEFAULT = '#0f766e';

export const colors = {
  bg: '#f9fafb', // --background
  card: '#ffffff', // --card
  ink: '#19232a', // --foreground
  inkSoft: '#334049',
  muted: '#59656e', // --muted-foreground
  line: '#d8dfe4', // --border
  lineSoft: '#e9f0f5', // --secondary / --muted
  sidebar: '#09131a', // --sidebar (encabezados oscuros del panel)
  tealSoft: '#f0fdfa', // bg-teal-50
  tealLine: '#99f6e4', // border-teal-200
  tealInk: '#0f766e', // text-teal-700
  // Promos / avisos: amber, como el panel
  offer: '#d97706', // amber-600
  offerSoft: '#fffbeb', // amber-50
  offerInk: '#b45309', // amber-700
  warnSoft: '#fffbeb',
  warnLine: '#fde68a', // amber-200
  warnInk: '#92400e', // amber-800
  // Errores: red
  errorSoft: '#fef2f2',
  errorLine: '#fecaca',
  errorInk: '#b91c1c',
  // OK: emerald
  okSoft: '#ecfdf5',
  okInk: '#047857',
  amberSoft: '#fffbeb',
  amberInk: '#b45309',
  white: '#ffffff',
} as const;

export const fonts = {
  display: 'Geist_700Bold',
  displayBold: 'Geist_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemi: 'Geist_600SemiBold',
  bodyBold: 'Geist_600SemiBold',
} as const;

// rounded-2xl = 16 (regla del panel); controles rounded-xl = 12.
export const radius = { sm: 10, md: 12, lg: 16, xl: 16, pill: 999 } as const;

/** Tinte suave del acento sobre blanco (equivalente a bg-teal-50 para cualquier color). */
export function tint(hex: string, amount = 0.1): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Borde de tarjeta del panel (border + shadow-sm). */
export const tarjetaBase = {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#d8dfe4',
  shadowColor: '#19232a',
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;
