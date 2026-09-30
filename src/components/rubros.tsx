// Rubros con ícono: grilla del inicio (atajo al catálogo filtrado) y selector de hoja
// completa para elegir entre todos (la tira de chips del catálogo muestra solo algunos).
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { anchoHoja } from '@/components/marco-app';
import { Icono, T, type IconName } from '@/components/ui';
import { iconoRubro, nombreRubro } from '@/lib/rubros';
import { colors, fonts, radius, tint } from '@/theme';

export const iconoDeRubro = (rubro: string): IconName => iconoRubro(rubro) as IconName;

interface CasillaProps {
  texto: string;
  icono: IconName;
  color: string;
  activo?: boolean;
  /** Ancho de la casilla: 25% en la grilla de 4 columnas. */
  ancho?: `${number}%`;
  onPress: () => void;
}

/** Ícono en un cuadrado de tinte suave con el nombre abajo. */
function Casilla({ texto, icono: nombreIcono, color, activo, ancho = '25%', onPress }: CasillaProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => ({ width: ancho, alignItems: 'center', gap: 6, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          backgroundColor: activo ? color : tint(color, 0.1),
          borderWidth: 1,
          borderColor: activo ? color : tint(color, 0.2),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icono name={nombreIcono} size={26} color={activo ? colors.white : color} />
      </View>
      <T numberOfLines={2} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 15, textAlign: 'center', color: colors.inkSoft, paddingHorizontal: 2 }}>
        {texto}
      </T>
    </Pressable>
  );
}

/** Inicio: los primeros rubros y "Ver todos" en la última casilla. */
export function GrillaRubros({
  rubros,
  color,
  cantidad = 7,
  columnas = 4,
  onElegir,
  onVerTodos,
}: {
  rubros: string[];
  color: string;
  cantidad?: number;
  columnas?: number;
  onElegir: (rubro: string) => void;
  onVerTodos: () => void;
}) {
  const ancho = `${100 / columnas}%` as const;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 }}>
      {rubros.slice(0, cantidad).map((r) => (
        <Casilla key={r} texto={nombreRubro(r)} icono={iconoDeRubro(r)} color={color} ancho={ancho} onPress={() => onElegir(r)} />
      ))}
      {rubros.length > cantidad && <Casilla texto="Ver todos" icono="view-grid-outline" color={color} ancho={ancho} onPress={onVerTodos} />}
    </View>
  );
}

/** Hoja con todos los rubros; "Todos los productos" limpia el filtro. */
export function SelectorRubros({
  visible,
  rubros,
  activo,
  color,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  rubros: string[];
  activo: string;
  color: string;
  onElegir: (rubro: string) => void;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const elegir = (r: string) => {
    onElegir(r);
    onCerrar();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar rubros" onPress={onCerrar} style={{ flex: 1 }} />
        <View
          style={[anchoHoja, {
            maxHeight: '82%',
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 12,
          }]}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <T v="h1" style={{ flex: 1, fontSize: 20 }}>Rubros</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="close" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Casilla texto="Todos" icono="store-outline" color={color} activo={!activo} onPress={() => elegir('')} />
              {rubros.map((r) => (
                <Casilla key={r} texto={nombreRubro(r)} icono={iconoDeRubro(r)} color={color} activo={activo === r} onPress={() => elegir(r)} />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
