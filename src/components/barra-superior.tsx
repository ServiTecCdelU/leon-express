// Barra superior al estilo del header del panel: marca a la izquierda, comercio y acción.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

export function BarraSuperior({
  titulo,
  subtitulo,
  color,
  izquierda,
  derecha,
}: {
  titulo: string;
  subtitulo?: string;
  color: string;
  izquierda?: ReactNode;
  derecha?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {izquierda ?? (
        <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontFamily: fonts.display, color: colors.white, fontSize: 16 }}>{titulo.charAt(0).toUpperCase()}</T>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <T v="fuerte" numberOfLines={1}>{titulo}</T>
        {subtitulo ? <T v="chico" numberOfLines={1}>{subtitulo}</T> : null}
      </View>
      {derecha}
    </View>
  );
}
