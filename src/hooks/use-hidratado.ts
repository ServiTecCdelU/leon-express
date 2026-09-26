// Espera a que los stores persistidos terminen de leerse del almacenamiento (asíncrono).
// Sin esto, una invitación que llega por deep link al abrir la app podría pisarse
// con el estado guardado cuando termina la hidratación.
import { useSyncExternalStore } from 'react';
import { useCarritoStore } from '@/state/carrito';
import { useComercioStore } from '@/state/comercio';

const stores = [useComercioStore, useCarritoStore];

const subscribe = (cb: () => void) => {
  const bajas = stores.map((s) => s.persist.onFinishHydration(cb));
  return () => bajas.forEach((baja) => baja());
};
const getSnapshot = () => stores.every((s) => s.persist.hasHydrated());

export function useHidratado(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
