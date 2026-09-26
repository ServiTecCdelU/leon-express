// Mis pedidos: lista con estado (reemplaza "Premios" del diseño hasta la Fase 2).
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { Aviso, Cargando, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, precio } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { colors, radius } from '@/theme';

export default function MisPedidos() {
  const { slug } = useComercioActivo();
  const pedidos = usePedidos(slug!);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <T v="h1">Mis pedidos</T>
      </View>
      {pedidos.isLoading ? (
        <Cargando />
      ) : pedidos.error ? (
        <View style={{ padding: 20 }}><Aviso texto={pedidos.error.message} /></View>
      ) : (
        <FlatList
          data={pedidos.data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10 }}
          refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
          ListEmptyComponent={<T v="chico" style={{ textAlign: 'center', paddingTop: 30 }}>Todavía no hiciste pedidos.</T>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: item.id } })}
              style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1 })}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <T v="fuerte">
                  {item.numero ? `Pedido N° ${item.numero}` : 'Pedido'} · {fechaCorta(item.fecha)}
                </T>
                <T v="chico">
                  {item.cantidadProductos} productos · {precio(item.total)}
                  {item.desdeApp ? '' : ' · cargado por tu vendedor'}
                </T>
                <EstadoPedidoInsignia estado={item.estado} retenido={item.retenido} />
              </View>
              <Icono name="chevron-right" color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
