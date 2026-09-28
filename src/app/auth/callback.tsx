// Vuelta del ingreso con Google (web, o deep link si el sistema abre la app en vez de
// devolverle la URL al navegador). Canjea ?code= por la sesión y vuelve al inicio.
import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Cargando } from '@/components/ui';
import { canjearCodigoDeUrl } from '@/lib/google';
import { useSesion } from '@/state/sesion';
import { colors } from '@/theme';

export default function AuthCallback() {
  const url = Linking.useLinkingURL();
  const { session } = useSesion();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || session) return;
    canjearCodigoDeUrl(url).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'No pudimos completar el ingreso con Google.'),
    );
  }, [url, session]);

  if (session) return <Redirect href="/" />;
  if (!error) return <Cargando />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16, justifyContent: 'center' }}>
      <Aviso texto={error} />
      <Boton onPress={() => router.replace('/ingresar')} variante="borde">
        Volver
      </Boton>
    </SafeAreaView>
  );
}
