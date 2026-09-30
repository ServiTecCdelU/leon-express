// Anchos de la app para que se vea bien en celular, tablet y PC.
// - Hasta ANCHO_TABLET (celular) todo va en una columna, como siempre.
// - Desde ANCHO_TABLET (tablet apaisada, PC) el menú pasa al costado y las pantallas
//   se reacomodan en columnas (useEsAncha).
// - El contenido se centra con un tope (columnaAncha) para no estirarse en monitores grandes.
import { useWindowDimensions } from 'react-native';

export const ANCHO_TABLET = 900;
export const ANCHO_LECTURA = 720;
const ANCHO_CONTENIDO = 1240;
const ANCHO_HOJA = 560;

/** Ancho útil de la app (toda la ventana). */
export function useAnchoApp(): number {
  return useWindowDimensions().width;
}

/** true en tablet apaisada y PC: menú lateral y pantallas en columnas. */
export function useEsAncha(): boolean {
  return useAnchoApp() >= ANCHO_TABLET;
}

/** Contenido de lectura centrado (formularios, detalle): no se estira en pantallas anchas. */
export const columnaLectura = { width: '100%', maxWidth: ANCHO_LECTURA, alignSelf: 'center' } as const;

/** Contenido de las pantallas en columnas: usa el ancho disponible con un tope. */
export const columnaAncha = { width: '100%', maxWidth: ANCHO_CONTENIDO, alignSelf: 'center' } as const;

/** Hojas inferiores y avisos flotantes: centrados y sin estirarse en pantallas anchas. */
export const anchoHoja = { width: '100%', maxWidth: ANCHO_HOJA, alignSelf: 'center' } as const;
