// Primitivas visuales del diseño (Bricolage Grotesque + Figtree, fondo crema, acento del comercio).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type ColorValue,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius } from '@/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icono({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: ColorValue }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

type Variante = 'titulo' | 'h1' | 'h2' | 'cuerpo' | 'fuerte' | 'chico' | 'etiqueta' | 'numero';

const ESTILOS: Record<Variante, TextStyle> = {
  titulo: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26 },
  cuerpo: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  fuerte: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 },
  chico: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.muted },
  etiqueta: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  numero: { fontFamily: fonts.display, fontSize: 18 },
};

export function T({ v = 'cuerpo', style, ...props }: TextProps & { v?: Variante }) {
  return <Text {...props} style={[{ color: colors.ink }, ESTILOS[v], style]} />;
}

export function Boton({
  children,
  onPress,
  color = colors.ink,
  variante = 'solido',
  icono,
  cargando,
  disabled,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  color?: string;
  variante?: 'solido' | 'borde';
  icono?: IconName;
  cargando?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const solido = variante === 'solido';
  const inactivo = disabled || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        {
          minHeight: 54,
          borderRadius: radius.lg - 2,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: solido ? color : colors.card,
          borderWidth: solido ? 0 : 1.5,
          borderColor: colors.line,
          opacity: inactivo ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={solido ? colors.white : colors.ink} />
      ) : (
        <>
          {icono && <Icono name={icono} size={20} color={solido ? colors.white : colors.ink} />}
          <T v="fuerte" style={{ color: solido ? colors.white : colors.ink, fontSize: 16 }}>
            {children}
          </T>
        </>
      )}
    </Pressable>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 }, style]}>{children}</View>;
}

export function Chip({
  texto,
  activo,
  color,
  onPress,
}: {
  texto: string;
  activo?: boolean;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
      onPress={onPress}
      style={{
        height: 38,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        justifyContent: 'center',
        backgroundColor: activo ? color : colors.card,
        borderWidth: activo ? 0 : 1.5,
        borderColor: colors.line,
      }}
    >
      <T v="fuerte" style={{ fontSize: 14, color: activo ? colors.white : colors.ink }}>
        {texto}
      </T>
    </Pressable>
  );
}

export function Insignia({ texto, bg, fg }: { texto: string; bg: string; fg: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: bg }}>
      <T style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: fg }}>{texto}</T>
    </View>
  );
}

/** Bloque de color con iniciales: reemplaza la foto del producto (el catálogo no tiene fotos). */
export function FichaProducto({
  iniciales,
  bg,
  fg,
  pie,
  size = 72,
}: {
  iniciales: string;
  bg: string;
  fg: string;
  pie?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: bg,
        padding: 10,
        justifyContent: pie ? 'space-between' : 'center',
        alignItems: pie ? 'flex-start' : 'center',
      }}
    >
      <T style={{ fontFamily: fonts.display, fontSize: size > 56 ? 22 : 17, color: fg }}>{iniciales}</T>
      {pie ? <T style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: fg, letterSpacing: 0.4 }}>{pie}</T> : null}
    </View>
  );
}

export function Stepper({
  cantidad,
  etiqueta,
  onMenos,
  onMas,
}: {
  cantidad: number;
  etiqueta: string;
  onMenos: () => void;
  onMas: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: radius.sm, backgroundColor: colors.ink }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quitar uno" onPress={onMenos} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="minus" color={colors.white} size={20} />
      </Pressable>
      <T v="fuerte" style={{ color: colors.white, minWidth: 64, textAlign: 'center', fontSize: 14 }} accessibilityLabel={`${cantidad} ${etiqueta}`}>
        {cantidad} {etiqueta}
      </T>
      <Pressable accessibilityRole="button" accessibilityLabel="Sumar uno" onPress={onMas} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="plus" color={colors.white} size={20} />
      </Pressable>
    </View>
  );
}

export function Cargando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={colors.muted} />
    </View>
  );
}

export function Aviso({ texto, tono = 'error', accion }: { texto: string; tono?: 'error' | 'info'; accion?: ReactNode }) {
  const error = tono === 'error';
  return (
    <View
      style={{
        borderRadius: radius.lg,
        padding: 14,
        gap: 10,
        backgroundColor: error ? colors.warnSoft : colors.amberSoft,
        borderWidth: 1.5,
        borderColor: error ? colors.warnLine : '#FCD34D',
      }}
    >
      <T style={{ color: error ? colors.warnInk : colors.amberInk, fontFamily: fonts.bodySemi }}>{texto}</T>
      {accion}
    </View>
  );
}
