// Tira "Sin conexión" arriba de todo cuando el celular pierde internet. El carrito queda
// guardado en el dispositivo y, al volver la conexión, TanStack Query reintenta solo
// (onlineManager conectado a expo-network en src/app/_layout.tsx).
import { useNetworkState } from 'expo-network';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, T } from '@/components/ui';
import { colors, fonts } from '@/theme';

export function SinConexion() {
  const red = useNetworkState();
  const insets = useSafeAreaInsets();
  // Solo con un "false" explícito: mientras se mide (undefined) no se muestra nada.
  if (red.isConnected !== false && red.isInternetReachable !== false) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingBottom: 6, paddingHorizontal: 16, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
    >
      <Icono name="wifi-off" size={16} color={colors.white} />
      <T style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 13 }}>Sin conexión. Tu carrito queda guardado.</T>
    </View>
  );
}
