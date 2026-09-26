/** Acepta el link completo (…/a/demo?inv=XXXX o servitecpedidos://…?inv=XXXX) o solo el código. */
export function tokenDeInvitacion(texto: string): string | null {
  const limpio = texto.trim();
  const enLink = limpio.match(/[?&]inv=([A-Za-z0-9_-]{16,128})/);
  if (enLink) return enLink[1];
  return /^[A-Za-z0-9_-]{16,128}$/.test(limpio) ? limpio : null;
}
