// Productos favoritos por comercio, guardados en este dispositivo. Solo los ids: el
// catálogo los trae del servidor con el precio de la lista del cliente.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacen } from '@/lib/almacen';

/** Mismo tope que acepta el servidor en ?ids= del catálogo. */
export const MAX_FAVORITOS = 100;

interface FavoritosState {
  ids: Record<string, string[]>;
  alternar: (slug: string, productId: string) => void;
}

export const useFavoritosStore = create<FavoritosState>()(
  persist(
    (set) => ({
      ids: {},
      alternar: (slug, productId) =>
        set((s) => {
          const actuales = s.ids[slug] ?? [];
          const siguientes = actuales.includes(productId)
            ? actuales.filter((id) => id !== productId)
            : [productId, ...actuales].slice(0, MAX_FAVORITOS);
          return { ids: { ...s.ids, [slug]: siguientes } };
        }),
    }),
    { name: 'favoritos', storage: createJSONStorage(() => almacen) },
  ),
);

const VACIO: string[] = [];

export function useFavoritos(slug: string | null): string[] {
  return useFavoritosStore((s) => (slug ? s.ids[slug] ?? VACIO : VACIO));
}
