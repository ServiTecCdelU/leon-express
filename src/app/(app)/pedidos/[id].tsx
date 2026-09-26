// Pantalla 5 del diseño: seguimiento del pedido.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ESTADOS } from '@/components/estado-pedido';
import { Aviso, Boton, Cargando, Icono, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaHora, precio } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { useCarritoStore } from '@/state/carrito';
import { colors, fonts, radius } from '@/theme';

const TITULO: Record<string, string> = {
  recibido: 'Recibimos tu pedido',
  preparando: 'Lo están preparando',
  en_camino: 'Va en camino',
  entregado: 'Entregado',
  cancelado: 'Pedido cancelado',
};

export default function Seguimiento() {
  const { id, nuevo } = useLocalSearchParams<{ id: string; nuevo?: string }>();
  const { slug, accent } = useComercioActivo();
  const pedidos = usePedidos(slug!);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const pedido = pedidos.data?.find((p) => p.id === id);

  if (pedidos.isLoading) return <Cargando />;
  if (!pedido) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Aviso texto="No encontramos este pedido." />
        <Boton onPress={() => router.back()}>Volver</Boton>
      </SafeAreaView>
    );
  }

  const idx = ESTADOS.findIndex((e) => e.clave === pedido.estado);
  const cancelado = pedido.estado === 'cancelado';

  const repetir = () => {
    for (const it of pedido.items) {
      if (!it.productId || it.cantidad <= 0) continue;
      setCantidad(slug!, { productId: it.productId, nombre: it.nombre, rubro: '', precioReferencia: 0, unidadesPorBulto: null, seDivideEn: null }, it.cantidad);
    }
    router.navigate('/pedido');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.ink, paddingHorizontal: 20, paddingBottom: 22 }}>
        <SafeAreaView edges={['top']} style={{ gap: 10, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => (router.canGoBack() ? router.back() : router.navigate('/pedidos'))}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icono name="chevron-left" color={colors.white} />
            </Pressable>
            <T style={{ color: '#C9D1CE', fontSize: 14 }}>
              {pedido.numero ? `Pedido N° ${pedido.numero}` : 'Pedido'} · {precio(pedido.total)}
            </T>
          </View>
          <T v="titulo" style={{ color: colors.white }}>{TITULO[pedido.estado]}</T>
          <T style={{ color: '#C9D1CE' }}>Hecho el {fechaHora(pedido.fecha)}</T>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        {nuevo === '1' && !pedido.retenido && <Aviso tono="info" texto="¡Listo! Tu pedido llegó a la distribuidora." />}
        {pedido.retenido && (
          <Aviso tono="info" texto="La distribuidora va a revisar el pedido por el estado de tu cuenta antes de prepararlo." />
        )}

        {!cancelado && (
          <View style={{ backgroundColor: colors.card, borderRadius: 22, padding: 18 }}>
            {ESTADOS.map((e, i) => {
              const hecho = i < idx || pedido.estado === 'entregado';
              const actual = i === idx && pedido.estado !== 'entregado';
              return (
                <View key={e.clave} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: hecho ? accent : actual ? colors.card : colors.lineSoft,
                        borderWidth: actual ? 3 : 0,
                        borderColor: accent,
                      }}
                    >
                      {hecho ? <Icono name="check" color={colors.white} size={16} /> : actual ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent }} /> : null}
                    </View>
                    {i < ESTADOS.length - 1 && <View style={{ width: 3, height: 34, backgroundColor: i < idx ? accent : '#E6E2D8' }} />}
                  </View>
                  <View style={{ paddingTop: 4, flex: 1 }}>
                    <T v="fuerte" style={{ color: actual ? accent : hecho ? colors.ink : colors.muted, fontFamily: actual ? fonts.display : fonts.bodyBold }}>
                      {e.titulo}
                    </T>
                    <T v="chico">{e.detalle}</T>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Tarjeta style={{ gap: 8 }}>
          <T v="fuerte">Productos</T>
          {pedido.items.map((it, i) => (
            <View key={`${it.productId}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <T style={{ flex: 1 }} numberOfLines={2}>{it.nombre}</T>
              <T v="fuerte">x {it.cantidad}</T>
            </View>
          ))}
        </Tarjeta>

        <Pressable
          accessibilityRole="button"
          onPress={repetir}
          style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1 })}
        >
          <Icono name="repeat" color={colors.muted} />
          <View style={{ flex: 1 }}>
            <T v="fuerte">Volver a pedir lo mismo</T>
            <T v="chico">Se carga en tu pedido con los precios de hoy</T>
          </View>
          <Icono name="chevron-right" color={colors.muted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
