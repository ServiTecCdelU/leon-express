// servitecpedidos://invitacion?slug=demo&inv=TOKEN — llega desde el QR / link del vendedor
// (landing /a/{slug} del SaaS). Guarda la invitación y, si ya hay sesión, la canjea.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useComercioStore } from '@/state/comercio';
import { useSesion } from '@/state/sesion';

const SLUG = /^[a-z0-9-]{1,60}$/;
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;

export default function Invitacion() {
  const params = useLocalSearchParams<{ slug?: string; inv?: string }>();
  const { session } = useSesion();
  const setInvitacion = useComercioStore((s) => s.setInvitacion);

  const slug = typeof params.slug === 'string' && SLUG.test(params.slug) ? params.slug : null;
  const token = typeof params.inv === 'string' && TOKEN.test(params.inv) ? params.inv : null;

  const valida = !!(slug && token);
  const guardada = useComercioStore((s) => s.invitacion?.token === token);

  useEffect(() => {
    if (slug && token) setInvitacion({ slug, token });
  }, [slug, token, setInvitacion]);

  // Espera a que la invitación quede guardada antes de salir de acá.
  if (valida && !guardada) return null;
  // Sin sesión: la pantalla de ingreso muestra la marca y pide el celular.
  // Con sesión: el layout de (app) canjea la invitación pendiente.
  return <Redirect href={session ? '/' : '/ingresar'} />;
}
