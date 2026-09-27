// Ofertas vigentes de la distribuidora (cargadas en el panel → "App de pedidos").
// Tarjetas horizontales con imagen; si la oferta tiene producto, se agrega al carrito desde acá.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Boton, Icono, Insignia, T } from '@/components/ui';
import { precio } from '@/lib/format';
import { useOfertas } from '@/lib/queries';
import type { OfertaApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { colors, tarjetaBase, tint } from '@/theme';

export function OfertasInicio({ slug, accent }: { slug: string; accent: string }) {
  const ofertas = useOfertas(slug);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const { width } = useWindowDimensions();
  const ancho = Math.min(300, width - 64);

  if (!ofertas.data?.length) return null;

  const agregar = (o: OfertaApp) => {
    const p = o.producto;
    if (!p) return;
    const actual = carrito[p.id]?.cantidad ?? 0;
    setCantidad(
      slug,
      { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn },
      actual + 1,
    );
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="h2">Ofertas</T>
        <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/catalogo', params: { ofertas: '1' } })} hitSlop={8}>
          <T style={{ color: accent, fontSize: 14 }}>Ver todas</T>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={ofertas.data}
        keyExtractor={(o) => o.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        style={{ marginRight: -16 }}
        renderItem={({ item: o }) => {
          const p = o.producto;
          const enCarrito = p ? carrito[p.id]?.cantidad ?? 0 : 0;
          return (
            <View style={[tarjetaBase, { width: ancho, overflow: 'hidden' }]}>
              <View style={{ aspectRatio: 16 / 9, backgroundColor: tint(accent, 0.08) }}>
                {o.imagenUrl ? (
                  <Image source={{ uri: o.imagenUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} accessibilityLabel={o.titulo} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icono name="tag-outline" size={32} color={accent} />
                  </View>
                )}
                {o.descuentoPct ? (
                  <View style={{ position: 'absolute', top: 10, left: 10 }}>
                    <Insignia texto={`−${o.descuentoPct}%`} bg={accent} fg={colors.white} />
                  </View>
                ) : null}
              </View>
              <View style={{ padding: 12, gap: 6 }}>
                <T v="fuerte" numberOfLines={2}>{o.titulo}</T>
                {o.descripcion ? <T v="chico" numberOfLines={2}>{o.descripcion}</T> : null}
                {p && (
                  <>
                    <T v="chico" numberOfLines={1} style={{ fontSize: 12 }}>{p.nombre}</T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                      <View>
                        {p.precioOferta !== null && (
                          <T v="chico" style={{ fontSize: 12, textDecorationLine: 'line-through' }}>{precio(p.precio)}</T>
                        )}
                        <T v="numero" style={{ color: p.precioOferta !== null ? accent : colors.ink }}>{precio(p.precioOferta ?? p.precio)}</T>
                      </View>
                      <Boton chico color={accent} icono={enCarrito ? 'check' : 'plus'} onPress={() => agregar(o)}>
                        {enCarrito ? `${enCarrito} en carrito` : 'Agregar'}
                      </Boton>
                    </View>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
