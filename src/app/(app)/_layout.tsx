// Zona con sesión. Canjea la invitación pendiente (deep link) y exige al menos un
// comercio vinculado para entrar a las pestañas.
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Cargando } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useCanjearInvitacion } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { useComercioStore } from '@/state/comercio';
import { colors } from '@/theme';

export default function AppLayout() {
  const { comercios, cargando, error, refetch } = useComercioActivo();
  const invitacion = useComercioStore((s) => s.invitacion);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const canjear = useCanjearInvitacion();
  const canjeando = useRef<string | null>(null);

  useEffect(() => {
    if (!invitacion || canjeando.current === invitacion.token) return;
    canjeando.current = invitacion.token;
    canjear.mutate(invitacion.token, {
      onSuccess: (r) => {
        setSlugActivo(r.slug);
        setInvitacion(null);
      },
      // El error queda en canjear.error y lo muestra "sin-comercio"; la invitación se descarta
      // para no reintentar en loop un token vencido o ya usado.
      onError: () => setInvitacion(null),
    });
  }, [invitacion, canjear, setInvitacion, setSlugActivo]);

  if (cargando || canjear.isPending) return <Cargando />;

  // Si /me falla (sin conexión, API caída, CORS en web) NO es "sin comercio": se muestra el error.
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Aviso texto={`No pudimos cargar tus comercios: ${error.message}`} />
        <Boton onPress={() => refetch()}>Reintentar</Boton>
        <Boton variante="borde" onPress={() => supabase.auth.signOut()}>Salir</Boton>
      </SafeAreaView>
    );
  }

  const tieneComercio = comercios.length > 0;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={tieneComercio}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pedidos/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!tieneComercio}>
        <Stack.Screen name="sin-comercio" initialParams={{ error: canjear.error?.message ?? '' }} />
      </Stack.Protected>
    </Stack>
  );
}
