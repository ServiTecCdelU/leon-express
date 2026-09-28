// Recordatorio "Registrarme" del modo visitante: cada tanto al entrar, y siempre que
// intenta algo que necesita cuenta (agregar al carrito, pedir).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacen } from '@/lib/almacen';

export const CADA_CUANTO_MS = 6 * 60 * 60 * 1000;

interface RegistroState {
  visible: boolean;
  motivo: string | null;
  /** Última vez que se mostró solo (no cuenta cuando lo abre una acción). */
  mostradoAt: number;
  abrir: (motivo?: string) => void;
  cerrar: () => void;
  recordarSiToca: () => void;
}

export const useRegistroStore = create<RegistroState>()(
  persist(
    (set, get) => ({
      visible: false,
      motivo: null,
      mostradoAt: 0,
      abrir: (motivo) => set({ visible: true, motivo: motivo ?? null }),
      cerrar: () => set({ visible: false, motivo: null }),
      recordarSiToca: () => {
        if (get().visible || Date.now() - get().mostradoAt < CADA_CUANTO_MS) return;
        set({ visible: true, motivo: null, mostradoAt: Date.now() });
      },
    }),
    {
      name: 'registro',
      storage: createJSONStorage(() => almacen),
      partialize: (s) => ({ mostradoAt: s.mostradoAt }),
    },
  ),
);
