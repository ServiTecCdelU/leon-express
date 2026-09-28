// Preferencias de la persona en este dispositivo (vista del catálogo).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacen } from '@/lib/almacen';

export type VistaCatalogo = 'lista' | 'cuadricula';

interface PreferenciasState {
  vista: VistaCatalogo;
  setVista: (vista: VistaCatalogo) => void;
}

export const usePreferencias = create<PreferenciasState>()(
  persist(
    (set) => ({
      vista: 'lista',
      setVista: (vista) => set({ vista }),
    }),
    { name: 'preferencias', storage: createJSONStorage(() => almacen) },
  ),
);
