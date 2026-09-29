// Comercio activo (el que eligió la persona, o el primero de sus vínculos) + su color.
// Sin comercio vinculado pero con la distribuidora del QR elegida → modo visitante:
// ve catálogo y ofertas de esa distribuidora hasta registrarse y vincularse.
import { useComercioPublico, useMe } from '@/lib/queries';
import type { Comercio } from '@/lib/tipos';
import { useComercioStore } from '@/state/comercio';
import { useSesion } from '@/state/sesion';
import { ACCENT_DEFAULT } from '@/theme';

export function useComercioActivo() {
  const { session } = useSesion();
  const me = useMe(!!session);
  const slugActivo = useComercioStore((s) => s.slugActivo);
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const comercios = session ? (me.data?.comercios ?? []) : [];
  // El último QR escaneado manda: si esa distribuidora todavía no está vinculada se la ve
  // como visitante (mientras corre el alta automática), no otro comercio de la cuenta.
  const qrSinVincular = !!distribuidora && !comercios.some((c) => c.slug === distribuidora);
  const vinculado = qrSinVincular ? null : (comercios.find((c) => c.slug === slugActivo) ?? comercios[0] ?? null);
  const visitante = !vinculado && !!distribuidora;
  const publico = useComercioPublico(visitante ? (distribuidora ?? undefined) : undefined);
  const comercio: Comercio | null = vinculado ?? (visitante ? (publico.data ?? { slug: distribuidora!, nombre: '', logoUrl: null, colorPrimario: null }) : null);

  return {
    comercio,
    comercios,
    slug: comercio?.slug ?? null,
    visitante,
    conSesion: !!session,
    accent: comercio?.colorPrimario || ACCENT_DEFAULT,
    cargando: !!session && me.isLoading,
    error: session ? me.error : null,
    refetch: me.refetch,
  };
}
