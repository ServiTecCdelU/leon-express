// Detalle / seguimiento de un pedido.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { ESTADOS, EstadoPedidoInsignia } from '@/components/estado-pedido';
import { columnaLectura } from '@/components/marco-app';
import { Aviso, Boton, Cargando, Fila, Icono, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaHora, precio } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { useCarritoStore } from '@/state/carrito';
import { colors, radius } from '@/theme';

export default function Seguimiento() {
  const { id, nuevo } = useLocalSearchParams<{ id: string; nuevo?: string }>();
  const { slug, accent } = useComercioActivo();
  const pedidos = usePedidos(slug!);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const pedido = pedidos.data?.find((p) => p.id === id);

  const volver = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.navigate('/pedidos'))}
      style={{ width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icono name="arrow-left" size={18} />
    </Pressable>
  );

  if (pedidos.isLoading) return <Cargando />;
  if (!pedido) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <BarraSuperior titulo="Pedido" color={accent} izquierda={volver} />
        <View style={[columnaLectura, { padding: 16 }]}><Aviso texto="No encontramos este pedido." /></View>
      </View>
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
      <BarraSuperior
        titulo={pedido.numero ? `Pedido N° ${pedido.numero}` : 'Pedido'}
        subtitulo={fechaHora(pedido.fecha)}
        color={accent}
        izquierda={volver}
        derecha={<EstadoPedidoInsignia estado={pedido.estado} retenido={pedido.retenido} />}
      />
      <ScrollView contentContainerStyle={[columnaLectura, { padding: 16, gap: 12, paddingBottom: 32 }]}>
        {nuevo === '1' && !pedido.retenido && <Aviso tono="ok" texto="Listo, tu pedido llegó a la distribuidora." />}
        {pedido.retenido && <Aviso tono="info" texto="La distribuidora va a revisar el pedido por el estado de tu cuenta antes de prepararlo." />}

        {!cancelado && (
          <Tarjeta>
            {ESTADOS.map((e, i) => {
              const hecho = i < idx || pedido.estado === 'entregado';
              const actual = i === idx && pedido.estado !== 'entregado';
              return (
                <View key={e.clave} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: hecho ? accent : colors.card,
                        borderWidth: hecho ? 0 : 2,
                        borderColor: actual ? accent : colors.line,
                      }}
                    >
                      {hecho ? <Icono name="check" color={colors.white} size={14} /> : actual ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} /> : null}
                    </View>
                    {i < ESTADOS.length - 1 && <View style={{ width: 2, height: 30, backgroundColor: i < idx ? accent : colors.line }} />}
                  </View>
                  <View style={{ paddingTop: 2, flex: 1 }}>
                    <T v="fuerte" style={{ fontSize: 14, color: actual ? accent : hecho ? colors.ink : colors.muted }}>{e.titulo}</T>
                    <T v="chico" style={{ fontSize: 12 }}>{e.detalle}</T>
                  </View>
                </View>
              );
            })}
          </Tarjeta>
        )}

        <Tarjeta style={{ gap: 8 }}>
          <T v="fuerte" style={{ fontSize: 14 }}>Productos</T>
          {pedido.items.map((it, i) => (
            <View key={`${it.productId}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <T style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{it.nombre}</T>
              <T v="fuerte" style={{ fontSize: 14 }}>x {it.cantidad}</T>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.lineSoft, marginVertical: 4 }} />
          <Fila etiqueta="Total" valor={precio(pedido.total)} fuerte />
        </Tarjeta>

        <Boton variante="suave" color={accent} icono="repeat" onPress={repetir}>
          Volver a pedir lo mismo
        </Boton>
      </ScrollView>
    </View>
  );
}
