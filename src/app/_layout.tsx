import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useHidratado } from '@/hooks/use-hidratado';
import { ApiError } from '@/lib/api';
import { SesionProvider, useSesion } from '@/state/sesion';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Errores de negocio (4xx) no se reintentan: no van a cambiar solos.
      retry: (intentos, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && intentos < 2,
    },
  },
});

function Navegacion() {
  const { session, cargando } = useSesion();
  const [fuentes, errorFuentes] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const hidratado = useHidratado();
  const listo = (fuentes || !!errorFuentes) && !cargando && hidratado;
  const qc = useQueryClient();

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  // Al cerrar sesión no queda nada de la cuenta anterior en memoria.
  useEffect(() => {
    if (!cargando && !session) qc.clear();
  }, [cargando, session, qc]);

  if (!listo) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      {/* Destino del QR/link de invitación: accesible con o sin sesión. */}
      <Stack.Screen name="invitacion" />
      <Stack.Protected guard={!session}>
        <Stack.Screen name="ingresar" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </SesionProvider>
    </QueryClientProvider>
  );
}
