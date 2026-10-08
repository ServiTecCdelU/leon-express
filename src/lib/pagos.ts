// Pago informado desde la app: lectura del monto tipeado (formato argentino).

/** "15.000,50" / "15000.5" / "$ 2.500" → número; null si no es un monto válido. */
export function parseMonto(texto: string): number | null {
  let t = texto.replace(/[$\s]/g, '');
  if (!t) return null;
  // Con coma, la coma es el decimal y los puntos son miles. Sin coma, un punto seguido de
  // exactamente 3 dígitos es separador de miles ("2.500"); si no, es decimal ("2500.5").
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null;
}
