// Inicio: resumen tipo dashboard del panel (ofertas, último pedido, accesos). Al visitante
// (entró por el QR, todavía sin registrarse) le suma el banner "Registrarme".
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { OfertasInicio } from '@/components/ofertas-inicio';
import { BannerRegistro } from '@/components/registro';
import { Chip, Icono, T, Tarjeta, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, precio } from '@/lib/format';
import { useCuenta, usePedidos } from '@/lib/queries';
import { useCarritoStore } from '@/state/carrito';
import { useComercioStore } from '@/state/comercio';
import { colors, radius, tarjetaBase, tint } from '@/theme';

function Acceso({ icono, titulo, detalle, accent, onPress }: { icono: IconName; titulo: string; detalle: string; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [tarjetaBase, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="fuerte" style={{ fontSize: 14 }}>{titulo}</T>
        <T v="chico" style={{ fontSize: 12 }}>{detalle}</T>
      </View>
      <Icono name="chevron-right" color={colors.muted} />
    </Pressable>
  );
}

export default function Inicio() {
  const { comercio, comercios, slug, accent, visitante, conSesion } = useComercioActivo();
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const cuenta = useCuenta(slug!, !visitante);
  const pedidos = usePedidos(slug!, !visitante);
  const setCantidad = useCarritoStore((s) => s.setCantidad);

  const ultimo = pedidos.data?.[0];

  const repetirUltimo = () => {
    if (!ultimo || !slug) return;
    for (const it of ultimo.items) {
      if (!it.productId || it.cantidad <= 0) continue;
      // El precio lo pone /cotizar al abrir el carrito; acá solo qué y cuánto.
      setCantidad(slug, { productId: it.productId, nombre: it.nombre, rubro: '', precioReferencia: 0, unidadesPorBulto: null, seDivideEn: null }, it.cantidad);
    }
    router.navigate('/pedido');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo={comercio?.nombre ?? ''} subtitulo={cuenta.data?.cliente.nombre} color={accent} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={cuenta.isRefetching || pedidos.isRefetching}
            onRefresh={() => {
              cuenta.refetch();
              pedidos.refetch();
            }}
          />
        }
      >
        {comercios.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {comercios.map((c) => (
              <Chip key={c.slug} texto={c.nombre} activo={c.slug === slug} color={accent} onPress={() => setSlugActivo(c.slug)} />
            ))}
          </ScrollView>
        )}

        {visitante && <BannerRegistro conSesion={conSesion} accent={accent} />}

        <OfertasInicio slug={slug!} accent={accent} />

        {ultimo && (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: ultimo.id } })}>
            <Tarjeta style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="etiqueta">Último pedido · {fechaCorta(ultimo.fecha)}</T>
                <EstadoPedidoInsignia estado={ultimo.estado} retenido={ultimo.retenido} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <T v="fuerte">{ultimo.cantidadProductos} productos</T>
                <T v="numero">{precio(ultimo.total)}</T>
              </View>
            </Tarjeta>
          </Pressable>
        )}

        <T v="h2" style={{ marginTop: 4 }}>Accesos rápidos</T>
        <Acceso icono="barcode-scan" titulo="Escanear productos" detalle="Apuntá la cámara al código de barras de la góndola" accent={accent} onPress={() => router.push('/escanear')} />
        <Acceso icono="package-variant-closed" titulo="Hacer un pedido" detalle="Buscá por nombre, código o código de barras" accent={accent} onPress={() => router.navigate('/catalogo')} />
        {ultimo && <Acceso icono="repeat" titulo="Repetir último pedido" detalle="Se carga en el carrito con los precios de hoy" accent={accent} onPress={repetirUltimo} />}
        <Acceso icono="clipboard-list-outline" titulo="Mis pedidos" detalle="Estado y seguimiento" accent={accent} onPress={() => router.navigate('/pedidos')} />
      </ScrollView>
    </View>
  );
}
