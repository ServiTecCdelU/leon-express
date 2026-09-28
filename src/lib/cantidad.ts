// Cantidades del pedido. La cantidad es siempre en la unidad de venta del producto (el
// "lote"): pack si se divide, si no el bulto entero. El servidor no parte bultos.

/** Tope por línea: MAX_CANTIDAD_ITEM_APP del SaaS (lib/app-pedidos/contratos.ts). */
export const MAX_CANTIDAD = 10_000;

/** Unidades sueltas que trae una unidad de venta. */
export function tamanoLote(unidadesPorBulto: number | null, seDivideEn: number | null): number {
  if (seDivideEn && seDivideEn > 1) return seDivideEn;
  if (unidadesPorBulto && unidadesPorBulto > 1) return unidadesPorBulto;
  return 1;
}

export function unidadDeVenta(unidadesPorBulto: number | null, seDivideEn: number | null, cantidad: number): string {
  const plural = cantidad !== 1;
  if (seDivideEn && seDivideEn > 1) return plural ? 'packs' : 'pack';
  if (unidadesPorBulto && unidadesPorBulto > 1) return plural ? 'bultos' : 'bulto';
  return plural ? 'unidades' : 'unidad';
}

/** "120 u" para 10 bultos x 12; null si la unidad de venta es suelta. */
export function equivalencia(cantidad: number, unidadesPorBulto: number | null, seDivideEn: number | null): string | null {
  const lote = tamanoLote(unidadesPorBulto, seDivideEn);
  if (lote <= 1) return null;
  return `${(cantidad * lote).toLocaleString('es-AR')} u`;
}

/** Lo que tipea la persona → cantidad entera entre 0 y MAX_CANTIDAD ("1.000" = 1000). */
export function parsearCantidad(texto: string): number {
  const n = parseInt(texto.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_CANTIDAD);
}
