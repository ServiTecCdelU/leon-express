// servitecpedidos://a/{slug}[?inv=TOKEN] — QR de la distribuidora (o invitación) abierto
// con la cámara del celular. Fija la distribuidora y, si trae token, deja la invitación.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useComercioStore } from '@/state/comercio';
import { useSesion } from '@/state/sesion';

const SLUG = /^[a-z0-9-]{1,60}$/;
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;

export default function QrDistribuidora() {
  const params = useLocalSearchParams<{ slug?: string; inv?: string }>();
  const { session } = useSesion();
  const setDistribuidora = useComercioStore((s) => s.setDistribuidora);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);

  const slug = typeof params.slug === 'string' && SLUG.test(params.slug.toLowerCase()) ? params.slug.toLowerCase() : null;
  const token = typeof params.inv === 'string' && TOKEN.test(params.inv) ? params.inv : null;
  const guardada = useComercioStore((s) => s.distribuidora === slug);

  useEffect(() => {
    if (!slug) return;
    setDistribuidora(slug);
    if (token) setInvitacion({ slug, token });
  }, [slug, token, setDistribuidora, setInvitacion]);

  if (slug && !guardada) return null;
  // Con la distribuidora elegida ya se entra (como visitante si no hay sesión).
  return <Redirect href={slug || session ? '/' : '/bienvenida'} />;
}
