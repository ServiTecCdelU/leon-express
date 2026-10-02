// ¿Hay que avisar que hay una versión nueva? Compara el versionCode instalado (Android) con lo
// que publica el SaaS en /version (Superadmin → App).

export interface VersionPublicada {
  ultimaVersion: number;
  versionMinima: number;
  urlTienda: string | null;
}

/** al-dia: nada. disponible: aviso que se puede cerrar. obligatoria: aviso que no se cierra. */
export type EstadoVersion = 'al-dia' | 'disponible' | 'obligatoria';

/** versionCode instalado como número; null si no se sabe (web, desarrollo). */
export function versionInstalada(nativeBuildVersion: string | null | undefined): number | null {
  if (!nativeBuildVersion) return null;
  const n = Number(nativeBuildVersion);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function estadoVersion(instalada: number | null, publicada: VersionPublicada | null | undefined): EstadoVersion {
  // Sin datos de un lado o del otro no se molesta a nadie.
  if (instalada === null || !publicada) return 'al-dia';
  if (instalada < publicada.versionMinima) return 'obligatoria';
  if (instalada < publicada.ultimaVersion) return 'disponible';
  return 'al-dia';
}
