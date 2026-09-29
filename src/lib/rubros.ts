// Rubros del catálogo: el SaaS los guarda como vienen del sistema de la distribuidora
// ("GOLOSINAS/ALFAJORES", "Sin categoria"). Acá se muestran legibles y con un ícono;
// el filtro sigue usando el valor original.

/** Palabras que en el sistema vienen sin tilde. */
const TILDES: Record<string, string> = {
  almacen: 'almacén',
  ferreteria: 'ferretería',
  iluminacion: 'iluminación',
  libreria: 'librería',
  licitacion: 'licitación',
  logistica: 'logística',
  perfumeria: 'perfumería',
};

const capitalizar = (palabra: string) => {
  const conTilde = TILDES[palabra] ?? palabra;
  return conTilde.charAt(0).toUpperCase() + conTilde.slice(1);
};

/** "GOLOSINAS/ALFAJORES" → "Golosinas / Alfajores"; "ALMACEN" → "Almacén". */
export function nombreRubro(rubro: string): string {
  return rubro
    .trim()
    .toLowerCase()
    .split(/\s*\/\s*/)
    .map((parte) => parte.split(/\s+/).filter(Boolean).map(capitalizar).join(' '))
    .filter(Boolean)
    .join(' / ');
}

const SIN_CATEGORIA = /^sin categor[ií]a$/i;

/** Saca "Sin categoría" (sirve de poco como filtro) y los repetidos. */
export function rubrosVisibles(rubros: readonly string[]): string[] {
  const vistos = new Set<string>();
  return rubros.filter((r) => {
    const clave = nombreRubro(r).toLowerCase();
    if (!clave || SIN_CATEGORIA.test(r.trim()) || vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

// Por la primera palabra clave que aparezca en el rubro (sin tildes, en minúscula).
const ICONOS: [string, string][] = [
  ['almacen', 'basket-outline'],
  ['balancead', 'paw'],
  ['mascota', 'paw'],
  ['bazar', 'silverware-fork-knife'],
  ['bebida', 'bottle-soda-outline'],
  ['cereal', 'barley'],
  ['dulce', 'cupcake'],
  ['ferreter', 'hammer-wrench'],
  ['herramienta', 'hammer-wrench'],
  ['fresco', 'cheese'],
  ['galletit', 'cookie-outline'],
  ['golosina', 'candy-outline'],
  ['alfajor', 'candy-outline'],
  ['iluminacion', 'lightbulb-outline'],
  ['juguete', 'teddy-bear'],
  ['libreria', 'pencil-outline'],
  ['licitacion', 'file-document-outline'],
  ['limpieza', 'spray-bottle'],
  ['logistica', 'truck-outline'],
  ['medicamento', 'pill'],
  ['farmacia', 'pill'],
  ['navidad', 'pine-tree'],
  ['perfumeria', 'lipstick'],
  ['snack', 'food-croissant'],
  ['panificad', 'food-croissant'],
  ['vino', 'glass-wine'],
  ['yerba', 'leaf'],
];

export const ICONO_RUBRO_DEFAULT = 'shape-outline';

/** Nombre de ícono de MaterialCommunityIcons para el rubro. */
export function iconoRubro(rubro: string): string {
  const clave = rubro.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return ICONOS.find(([palabra]) => clave.includes(palabra))?.[1] ?? ICONO_RUBRO_DEFAULT;
}
