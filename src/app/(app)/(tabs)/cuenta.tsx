// Cuenta: saldo y crédito, datos del comercio, cerrar sesión. Movimientos e "informar pago"
// llegan en la Fase 2 (la API todavía no los expone).
import { RefreshControl, ScrollView, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { PieServiTec } from '@/components/pie-servitec';
import { Aviso, Boton, Cargando, Fila, Insignia, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { precio } from '@/lib/format';
import { useCuenta, useMe } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

const CLASIFICACION: Record<string, { texto: string; bg: string; fg: string; borde: string }> = {
  normal: { texto: 'Al día', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  atrasado: { texto: 'Con atraso', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  moroso: { texto: 'Saldo vencido', bg: colors.errorSoft, fg: colors.errorInk, borde: colors.errorLine },
};

export default function Cuenta() {
  const { slug, accent, comercio } = useComercioActivo();
  const cuenta = useCuenta(slug!);
  const me = useMe();
  const c = cuenta.data;
  const clasif = CLASIFICACION[c?.credito.clasificacion ?? 'normal'] ?? CLASIFICACION.atrasado;
  const usado = c?.credito.limite ? Math.min(100, (c.credito.saldo / c.credito.limite) * 100) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Cuenta corriente" subtitulo={comercio?.nombre} color={accent} />
      {cuenta.isLoading ? (
        <Cargando />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={cuenta.isRefetching} onRefresh={() => cuenta.refetch()} />}
        >
          {cuenta.error && <Aviso texto={cuenta.error.message} />}

          {c && (
            <Tarjeta style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="etiqueta">Saldo a pagar</T>
                <Insignia {...clasif} />
              </View>
              <T v="titulo">{precio(c.credito.saldo)}</T>
              {usado !== null && (
                <View style={{ gap: 8 }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.lineSoft }}>
                    <View style={{ width: `${usado}%`, height: 8, borderRadius: 4, backgroundColor: accent }} />
                  </View>
                  <Fila etiqueta="Disponible" valor={precio(c.credito.disponible ?? 0)} />
                  <Fila etiqueta="Límite de crédito" valor={precio(c.credito.limite!)} />
                </View>
              )}
            </Tarjeta>
          )}

          {c && (
            <Tarjeta style={{ gap: 8 }}>
              <T v="etiqueta">Datos del comercio</T>
              <T v="fuerte">{c.cliente.nombre}</T>
              {c.cliente.direccion ? <T v="chico">{[c.cliente.direccion, c.cliente.localidad].filter(Boolean).join(', ')}</T> : null}
              {c.vendedor ? <Fila etiqueta="Vendedor" valor={c.vendedor} /> : null}
              {me.data?.telefono ? <Fila etiqueta="Ingresás con" valor={me.data.telefono} /> : null}
            </Tarjeta>
          )}

          <Boton variante="borde" icono="logout" onPress={() => supabase.auth.signOut()}>
            Cerrar sesión
          </Boton>

          <PieServiTec />
        </ScrollView>
      )}
    </View>
  );
}
