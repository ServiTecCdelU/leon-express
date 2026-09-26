// Almacenamiento persistente del celular (sesión de Auth, carrito, comercio activo).
// expo-sqlite/kv-store: asíncrono y sin depender de un `localStorage` global.
import Storage from 'expo-sqlite/kv-store';

export interface Almacen {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export const almacen: Almacen = {
  getItem: (key) => Storage.getItem(key),
  setItem: (key, value) => Storage.setItem(key, value),
  removeItem: (key) => Storage.removeItem(key),
};
