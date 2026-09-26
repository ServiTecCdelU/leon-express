// Comercio activo (el que eligió la persona, o el primero de sus vínculos) + su color.
import { useMe } from '@/lib/queries';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT } from '@/theme';

export function useComercioActivo() {
  const me = useMe();
  const slugActivo = useComercioStore((s) => s.slugActivo);
  const comercios = me.data?.comercios ?? [];
  const comercio = comercios.find((c) => c.slug === slugActivo) ?? comercios[0] ?? null;
  return {
    comercio,
    comercios,
    slug: comercio?.slug ?? null,
    accent: comercio?.colorPrimario || ACCENT_DEFAULT,
    cargando: me.isLoading,
    error: me.error,
    refetch: me.refetch,
  };
}
