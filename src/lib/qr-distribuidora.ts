// Parseo de un QR escaneado en la app:
// - https://…/app/<slug>, https://…/a/<slug> o servitecpedidos://a/<slug> SIN token → QR de la distribuidora.
// - con ?inv= → invitación de cliente (el slug viene en el link del SaaS: /a/<slug>?inv=…).
import { tokenDeInvitacion } from './invitacion';

const SLUG = /^[a-z0-9-]{1,60}$/;

export type QrEscaneado =
  | { tipo: 'distribuidora'; slug: string }
  | { tipo: 'invitacion'; token: string; slug: string | null };

function slugDelLink(texto: string): string | null {
  const slug = (texto.match(/\/(?:a|app)\/([^/?#]+)(?:[/?#]|$)/i) ?? texto.match(/[?&]slug=([^&#]+)/))?.[1]?.toLowerCase();
  return slug && SLUG.test(slug) ? slug : null;
}

export function parseQrDistribuidora(texto: string): QrEscaneado | null {
  const limpio = texto.trim();
  const slug = slugDelLink(limpio);

  if (!/[?&]inv=/.test(limpio) && slug) return { tipo: 'distribuidora', slug };

  const token = tokenDeInvitacion(limpio);
  if (token) return { tipo: 'invitacion', token, slug };

  return null;
}
