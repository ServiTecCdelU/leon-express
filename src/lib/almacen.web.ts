// Web: localStorage del navegador. Protegido para cuando se evalúa fuera del navegador.
import type { Almacen } from './almacen';

const ls = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const almacen: Almacen = {
  getItem: async (key) => ls()?.getItem(key) ?? null,
  setItem: async (key, value) => ls()?.setItem(key, value),
  removeItem: async (key) => ls()?.removeItem(key),
};
