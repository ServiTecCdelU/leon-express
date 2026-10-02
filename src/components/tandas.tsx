// Tandas del inicio (ofertas, "Los más elegidos", "Destacados"): cuántas tarjetas entran según el
// espacio y las flechas ‹ › con "1 de N" para pasar de tanda.
// El ancho se calcula desde la ventana (sin medir en pantalla: no parpadea ni salta). Tiene que
// coincidir con el armado del inicio y de tabs/_layout.tsx: en pantallas anchas hay un menú lateral
// de 220, el contenido tiene tope de 1240 con padding 16+16, y arriba la columna derecha (340 + gap 20).
import { Pressable, View } from 'react-native';
import { ANCHO_TABLET } from '@/components/marco-app';
import { Icono, T, type IconName } from '@/components/ui';
import { colors, radius, tint } from '@/theme';

const MENU_LATERAL = 220;
const ANCHO_CONTENIDO = 1240;
const PADDING = 32;
const COLUMNA_DERECHA = 340 + 20;

/** Ancho del contenido del inicio. conLateral: comparte fila con la columna derecha (ofertas en PC/tablet). */
export function anchoInicio(ventana: number, conLateral = false): number {
  if (ventana < ANCHO_TABLET) return ventana - PADDING;
  const contenido = Math.min(ventana - MENU_LATERAL, ANCHO_CONTENIDO) - PADDING;
  return conLateral ? contenido - COLUMNA_DERECHA : contenido;
}

/** Cuántas tarjetas de anchoMin entran en ancho, entre minimo y maximo. */
export function porTandaPara(ancho: number, { anchoMin, gap, minimo, maximo }: { anchoMin: number; gap: number; minimo: number; maximo: number }): number {
  const entran = Math.floor((ancho + gap) / (anchoMin + gap));
  return Math.min(maximo, Math.max(minimo, entran));
}

/** Total de tandas y la tanda a mostrar (si cambió el ancho o la lista, que la elegida siga existiendo). */
export function calcularTanda(total: number, porTanda: number, elegida: number): { totalTandas: number; actual: number } {
  const totalTandas = Math.max(1, Math.ceil(total / porTanda));
  return { totalTandas, actual: Math.min(elegida, totalTandas - 1) };
}

function Flecha({ icono, etiqueta, accent, habilitada, onPress }: { icono: IconName; etiqueta: string; accent: string; habilitada: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !habilitada }}
      disabled={!habilitada}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: habilitada ? tint(accent, 0.35) : colors.line,
        backgroundColor: pressed ? tint(accent, 0.12) : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: habilitada ? 1 : 0.45,
      })}
    >
      <Icono name={icono} size={20} color={habilitada ? accent : colors.muted} />
    </Pressable>
  );
}

/** "1 de N" con las flechas anterior / siguiente. No muestra nada si hay una sola tanda. */
export function FlechasTanda({ titulo, actual, totalTandas, accent, onCambiar }: { titulo: string; actual: number; totalTandas: number; accent: string; onCambiar: (tanda: number) => void }) {
  if (totalTandas < 2) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <T v="chico" style={{ color: colors.muted }}>{`${actual + 1} de ${totalTandas}`}</T>
      <Flecha icono="chevron-left" etiqueta={`Anteriores de ${titulo}`} accent={accent} habilitada={actual > 0} onPress={() => onCambiar(actual - 1)} />
      <Flecha icono="chevron-right" etiqueta={`Siguientes de ${titulo}`} accent={accent} habilitada={actual < totalTandas - 1} onPress={() => onCambiar(actual + 1)} />
    </View>
  );
}
