// Validación de los datos del comercio (mismas reglas que datosComercioSchema del servidor).
import type { DatosComercio } from '@/lib/tipos';

/** Alta por el QR (mismas reglas que altaQrSchema del servidor): null si está completo. */
export function errorDatosAlta(d: { nombre: string; negocio: string }): string | null {
  if (d.nombre.trim().length < 2) return 'Escribí tu nombre.';
  if (d.negocio.trim().length < 2) return 'Escribí el nombre del supermercado.';
  return null;
}

/** El primer problema para mostrar, o null si los datos están completos. */
export function errorDatosComercio(d: DatosComercio): string | null {
  if (d.negocio.trim().length < 2) return 'Escribí el nombre del negocio.';
  if (d.direccion.trim().length < 3) return 'Escribí la dirección.';
  if (d.localidad.trim().length < 2) return 'Escribí la localidad.';
  if (d.telefono.replace(/\D/g, '').length < 6) return 'Escribí un teléfono válido.';
  return null;
}
