// Pedidos: lista con estado (como la tabla de Pedidos del panel, en versión celular).
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { Aviso, Cargando, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, precio } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { colors, tarjetaBase } from '@/theme';

export default function MisPedidos() {
  const { slug, accent } = useComercioActivo();
  const pedidos = usePedidos(slug!);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Pedidos" subtitulo="Tus pedidos y su estado" color={accent} />
      {pedidos.isLoading ? (
        <Cargando />
      ) : pedidos.error ? (
        <View style={{ padding: 16 }}><Aviso texto={pedidos.error.message} /></View>
      ) : (
        <FlatList
          data={pedidos.data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
          ListEmptyComponent={<T v="chico" style={{ textAlign: 'center', paddingTop: 30 }}>Todavía no hiciste pedidos.</T>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: item.id } })}
              style={({ pressed }) => [tarjetaBase, { padding: 14, gap: 8, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <T v="fuerte" style={{ fontSize: 14 }}>
                  {item.numero ? `Pedido N° ${item.numero}` : 'Pedido'}
                </T>
                <EstadoPedidoInsignia estado={item.estado} retenido={item.retenido} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="chico">
                  {fechaCorta(item.fecha)} · {item.cantidadProductos} productos{item.desdeApp ? '' : ' · por tu vendedor'}
                </T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <T v="numero" style={{ fontSize: 15 }}>{precio(item.total)}</T>
                  <Icono name="chevron-right" color={colors.muted} size={18} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
