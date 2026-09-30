// Anchos de la app para que se vea bien en celular, tablet y PC.
// - La app ocupa toda la ventana, sin marco ni tope de ancho.
// - Las pantallas de lectura (inicio, carrito, cuenta…) centran su contenido en una columna
//   de ANCHO_LECTURA para que los textos y botones no queden estirados en pantallas anchas.
// - El catálogo usa todo el ancho y suma columnas.
import { useWindowDimensions } from 'react-native';

export const ANCHO_LECTURA = 720;
const ANCHO_HOJA = 560;

/** Ancho útil de la app (toda la ventana). */
export function useAnchoApp(): number {
  return useWindowDimensions().width;
}

/** Ancho de la columna de lectura. */
export function useAnchoLectura(): number {
  return Math.min(useAnchoApp(), ANCHO_LECTURA);
}

/** Contenido de lectura centrado (va en contentContainerStyle o en una View). */
export const columnaLectura = { width: '100%', maxWidth: ANCHO_LECTURA, alignSelf: 'center' } as const;

/** Hojas inferiores y avisos flotantes: centrados y sin estirarse en pantallas anchas. */
export const anchoHoja = { width: '100%', maxWidth: ANCHO_HOJA, alignSelf: 'center' } as const;
