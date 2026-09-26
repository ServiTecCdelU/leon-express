/**
 * Celular argentino → E.164 para Supabase Auth (+549 + área + número).
 * Acepta como lo escribe la gente: "11 5555-0000", "011 15 5555 0000", "+54 9 11 5555 0000".
 * Devuelve null si no parece un celular válido (10 dígitos sin prefijos).
 */
export function celularE164(entrada: string): string | null {
  let d = entrada.replace(/\D/g, '');
  if (d.startsWith('549')) d = d.slice(3);
  else if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  // "15" después del código de área (2 a 4 dígitos): se saca.
  const conQuince = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (conQuince && conQuince[1].length + conQuince[2].length === 10) d = conQuince[1] + conQuince[2];
  return d.length === 10 ? `+549${d}` : null;
}
