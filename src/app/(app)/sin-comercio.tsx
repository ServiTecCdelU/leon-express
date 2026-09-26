// Logueado pero sin comercio vinculado: el alta es por invitación (QR del vendedor).
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { ACCENT_DEFAULT, colors, tint } from '@/theme';

export default function SinComercio() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: 24, gap: 18, justifyContent: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: tint(ACCENT_DEFAULT), alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="qrcode-scan" size={32} color={ACCENT_DEFAULT} />
        </View>
        <T v="h1">Falta vincular tu comercio</T>
        <T>
          Para hacer pedidos, tu vendedor te tiene que pasar el QR o el link de invitación de tu comercio.
          Abrilo desde este celular y listo.
        </T>
        {error ? <Aviso texto={error} /> : null}
        <Boton variante="borde" icono="logout" onPress={() => supabase.auth.signOut()}>
          Salir
        </Boton>
      </View>
    </SafeAreaView>
  );
}
