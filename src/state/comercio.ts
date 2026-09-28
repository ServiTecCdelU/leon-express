// Comercio (distribuidora) activo e invitación pendiente de canjear.
import { create } from 'zustand';
import { almacen } from '@/lib/almacen';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface InvitacionPendiente {
  slug: string;
  token: string;
}

interface ComercioState {
  slugActivo: string | null;
  /** Llegó por deep link antes de loguearse: se canjea apenas hay sesión. */
  invitacion: InvitacionPendiente | null;
  /** Distribuidora elegida por su QR antes de loguearse: da la marca del ingreso. */
  distribuidora: string | null;
  setSlugActivo: (slug: string | null) => void;
  setInvitacion: (inv: InvitacionPendiente | null) => void;
  setDistribuidora: (slug: string | null) => void;
}

export const useComercioStore = create<ComercioState>()(
  persist(
    (set) => ({
      slugActivo: null,
      invitacion: null,
      distribuidora: null,
      setSlugActivo: (slugActivo) => set({ slugActivo }),
      setInvitacion: (invitacion) => set({ invitacion }),
      setDistribuidora: (distribuidora) => set({ distribuidora }),
    }),
    { name: 'comercio', storage: createJSONStorage(() => almacen) },
  ),
);
