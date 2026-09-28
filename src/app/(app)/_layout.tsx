// Zona de la app. Sin sesión, con la distribuidora del QR, entra como visitante. Al
// registrarse se da de alta sola en esa distribuidora (sin invitación) y ve la app completa.
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Cargando } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useAltaQr, useCanjearInvitacion } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { useComercioStore } from '@/state/comercio';
import { colors } from '@/theme';

export default function AppLayout() {
  const { comercios, visitante, conSesion, cargando, error, refetch } = useComercioActivo();
  const invitacion = useComercioStore((s) => s.invitacion);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const canjear = useCanjearInvitacion();
  const canjeando = useRef<string | null>(null);
  const alta = useAltaQr();
  const altaIntentada = useRef<string | null>(null);
  const tieneComercio = comercios.length > 0;

  useEffect(() => {
    // Sin sesión la invitación queda guardada hasta que se registre.
    if (!conSesion || !invitacion || canjeando.current === invitacion.token) return;
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
  }, [conSesion, invitacion, canjear, setInvitacion, setSlugActivo]);

  // Registrado, con la distribuidora del QR y sin ficha: alta automática (una vez por
  // distribuidora; si falla queda como visitante y el banner permite reintentar).
  useEffect(() => {
    if (!conSesion || cargando || error || tieneComercio || invitacion || !distribuidora) return;
    if (altaIntentada.current === distribuidora) return;
    altaIntentada.current = distribuidora;
    alta.mutate(distribuidora, { onSuccess: (r) => setSlugActivo(r.slug) });
  }, [conSesion, cargando, error, tieneComercio, invitacion, distribuidora, alta, setSlugActivo]);

  if (cargando || canjear.isPending || alta.isPending) return <Cargando />;

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

  const puedeNavegar = tieneComercio || visitante;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={puedeNavegar}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="escanear" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
      <Stack.Protected guard={tieneComercio}>
        <Stack.Screen name="pedidos/[id]" />
      </Stack.Protected>
      {/* También desde el modo visitante con sesión, para vincular el comercio. */}
      <Stack.Protected guard={conSesion && !tieneComercio}>
        <Stack.Screen name="sin-comercio" initialParams={{ error: canjear.error?.message ?? '' }} />
      </Stack.Protected>
    </Stack>
  );
}
