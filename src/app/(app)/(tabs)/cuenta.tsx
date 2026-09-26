// Pantalla 6 del diseño: cuenta corriente (saldo y crédito). Movimientos e "informar pago"
// llegan en la Fase 2 (la API todavía no los expone).
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Cargando, Insignia, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { precio } from '@/lib/format';
import { useCuenta, useMe } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const CLASIFICACION: Record<string, { texto: string; bg: string; fg: string }> = {
  normal: { texto: 'Al día', bg: colors.okSoft, fg: colors.okInk },
  atrasado: { texto: 'Con atraso', bg: colors.amberSoft, fg: colors.amberInk },
  moroso: { texto: 'Saldo vencido', bg: colors.offerSoft, fg: colors.offerInk },
};

export default function Cuenta() {
  const { slug, accent, comercio } = useComercioActivo();
  const cuenta = useCuenta(slug!);
  const me = useMe();

  if (cuenta.isLoading) return <Cargando />;
  const c = cuenta.data;
  const clasif = CLASIFICACION[c?.credito.clasificacion ?? 'normal'] ?? CLASIFICACION.atrasado;
  const usado = c?.credito.limite ? Math.min(100, (c.credito.saldo / c.credito.limite) * 100) : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={cuenta.isRefetching} onRefresh={() => cuenta.refetch()} />}
      >
        <T v="h1">Mi cuenta</T>
        {cuenta.error && <Aviso texto={cuenta.error.message} />}

        {c && (
          <Tarjeta style={{ gap: 14, borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="fuerte" style={{ color: colors.inkSoft }}>Saldo a pagar</T>
              <Insignia {...clasif} />
            </View>
            <T style={{ fontFamily: fonts.display, fontSize: 44, letterSpacing: -1 }}>{precio(c.credito.saldo)}</T>
            {usado !== null && (
              <View style={{ gap: 6 }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.lineSoft }}>
                  <View style={{ width: `${usado}%`, height: 8, borderRadius: 4, backgroundColor: accent }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T v="chico">Disponible <T v="fuerte" style={{ fontSize: 13 }}>{precio(c.credito.disponible ?? 0)}</T></T>
                  <T v="chico">Límite {precio(c.credito.limite!)}</T>
                </View>
              </View>
            )}
          </Tarjeta>
        )}

        {c && (
          <Tarjeta style={{ gap: 6 }}>
            <T v="etiqueta" style={{ color: colors.muted }}>Tu comercio en {comercio?.nombre}</T>
            <T v="fuerte">{c.cliente.nombre}</T>
            {c.cliente.direccion ? <T v="chico">{[c.cliente.direccion, c.cliente.localidad].filter(Boolean).join(', ')}</T> : null}
            {c.vendedor ? <T v="chico">Tu vendedor: {c.vendedor}</T> : null}
          </Tarjeta>
        )}

        <T v="chico" style={{ textAlign: 'center' }}>{me.data?.telefono ? `Ingresaste con ${me.data.telefono}` : ''}</T>
        <Boton variante="borde" icono="logout" onPress={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
