// Pantalla 2 del diseño: inicio del comercio.
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { Icono, T, Tarjeta, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, iniciales, precio } from '@/lib/format';
import { useCuenta, usePedidos, useRubros } from '@/lib/queries';
import { colorRubro } from '@/lib/rubro';
import { useCarritoStore } from '@/state/carrito';
import { useComercioStore } from '@/state/comercio';
import { colors, fonts, radius, tint } from '@/theme';

function Acceso({ icono, texto, accent, onPress }: { icono: IconName; texto: string; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 10, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} color={accent} />
      </View>
      <T v="fuerte" style={{ fontSize: 14 }}>{texto}</T>
    </Pressable>
  );
}

export default function Inicio() {
  const { comercio, comercios, slug, accent } = useComercioActivo();
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const cuenta = useCuenta(slug!);
  const pedidos = usePedidos(slug!);
  const rubros = useRubros(slug!);
  const setCantidad = useCarritoStore((s) => s.setCantidad);

  const ultimo = pedidos.data?.[0];

  const repetirUltimo = () => {
    if (!ultimo || !slug) return;
    for (const it of ultimo.items) {
      if (!it.productId || it.cantidad <= 0) continue;
      // El precio lo pone /cotizar al abrir el pedido; acá solo qué y cuánto.
      setCantidad(slug, { productId: it.productId, nombre: it.nombre, rubro: '', precioReferencia: 0, unidadesPorBulto: null, seDivideEn: null }, it.cantidad);
    }
    router.navigate('/pedido');
  };

  const refrescar = () => {
    cuenta.refetch();
    pedidos.refetch();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={cuenta.isRefetching || pedidos.isRefetching} onRefresh={refrescar} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontFamily: fonts.display, fontSize: 21, color: colors.white }}>{comercio?.nombre.charAt(0).toUpperCase()}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="chico">Hola, {cuenta.data?.cliente.nombre ?? '…'}</T>
            <T v="h2" style={{ fontSize: 19 }}>{comercio?.nombre}</T>
          </View>
        </View>

        {comercios.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {comercios.map((c) => (
              <Pressable
                key={c.slug}
                accessibilityRole="button"
                accessibilityState={{ selected: c.slug === slug }}
                onPress={() => setSlugActivo(c.slug)}
                style={{ paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.slug === slug ? colors.ink : colors.card }}
              >
                <T v="fuerte" style={{ fontSize: 13, color: c.slug === slug ? colors.white : colors.ink }}>{c.nombre}</T>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Pressable accessibilityRole="button" onPress={() => router.navigate('/cuenta')}>
          <View style={{ backgroundColor: colors.ink, borderRadius: radius.xl, padding: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icono name="wallet-outline" color="#9FE1D6" size={20} />
              <T v="etiqueta" style={{ color: '#9FE1D6' }}>Tu cuenta corriente</T>
            </View>
            <T style={{ fontFamily: fonts.display, fontSize: 32, color: colors.white }}>
              {cuenta.data ? precio(cuenta.data.credito.saldo) : '…'}
            </T>
            {cuenta.data?.credito.disponible != null && (
              <T style={{ color: '#C9D1CE', fontSize: 14 }}>
                Crédito disponible <T style={{ color: colors.white, fontFamily: fonts.bodyBold }}>{precio(cuenta.data.credito.disponible)}</T>
              </T>
            )}
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Acceso icono="repeat" texto={'Repetir último\npedido'} accent={accent} onPress={repetirUltimo} />
          <Acceso icono="magnify" texto={'Buscar\nproductos'} accent={accent} onPress={() => router.navigate('/catalogo')} />
          <Acceso icono="truck-delivery-outline" texto={'Mis\npedidos'} accent={accent} onPress={() => router.navigate('/pedidos')} />
        </View>

        {ultimo && (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: ultimo.id } })}>
            <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <T v="etiqueta" style={{ color: colors.muted }}>Último pedido · {fechaCorta(ultimo.fecha)}</T>
                <T v="fuerte">{ultimo.cantidadProductos} productos · {precio(ultimo.total)}</T>
                <EstadoPedidoInsignia estado={ultimo.estado} retenido={ultimo.retenido} />
              </View>
              <Icono name="chevron-right" color={colors.muted} />
            </Tarjeta>
          </Pressable>
        )}

        {(rubros.data?.length ?? 0) > 0 && (
          <View style={{ gap: 12 }}>
            <T v="h2">Rubros</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {rubros.data!.slice(0, 8).map((r) => {
                const { bg, fg } = colorRubro(r);
                return (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    onPress={() => router.navigate({ pathname: '/catalogo', params: { rubro: r } })}
                    style={{ width: '22.5%', aspectRatio: 1, borderRadius: 18, backgroundColor: bg, padding: 10, justifyContent: 'space-between' }}
                  >
                    <T style={{ fontFamily: fonts.display, fontSize: 21, color: fg }}>{iniciales(r)}</T>
                    <T numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: fg }}>{r}</T>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
