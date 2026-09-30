// Carrusel de ofertas vigentes (cargadas en el panel → "App de pedidos").
// En celular, una oferta por vez: se desliza con el dedo y avanza sola. En pantallas anchas
// (enGrilla) se muestran todas en dos columnas. La imagen se muestra entera (sirve la foto
// vertical del producto o un banner apaisado) sobre fondo blanco.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Boton, Icono, Insignia, T } from '@/components/ui';
import { precio } from '@/lib/format';
import { useOfertas } from '@/lib/queries';
import type { OfertaApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { colors, radius, tarjetaBase, tint } from '@/theme';

const GAP = 12;
const ALTO = 188;
const AUTOPLAY_MS = 4500;

export function OfertasInicio({ slug, accent, enGrilla = false }: { slug: string; accent: string; enGrilla?: boolean }) {
  const ofertas = useOfertas(slug);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  // Ancho real del contenedor: la tarjeta ocupa todo (carrusel) o la mitad (grilla).
  const [anchoCont, setAnchoCont] = useState(0);
  const ancho = enGrilla ? (anchoCont - GAP) / 2 : anchoCont;
  const paso = ancho + GAP;
  const medir = (e: LayoutChangeEvent) => setAnchoCont(Math.round(e.nativeEvent.layout.width));

  const lista = useRef<FlatList<OfertaApp>>(null);
  const [actual, setActual] = useState(0);
  const tocando = useRef(false);
  const items = ofertas.data ?? [];
  const total = items.length;

  // Avance automático; se pausa mientras el usuario desliza.
  useEffect(() => {
    if (total < 2 || enGrilla || !paso) return;
    const id = setInterval(() => {
      if (tocando.current) return;
      setActual((i) => {
        const siguiente = (i + 1) % total;
        lista.current?.scrollToOffset({ offset: siguiente * paso, animated: true });
        return siguiente;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [total, paso, enGrilla]);

  const alSoltar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      tocando.current = false;
      setActual(Math.max(0, Math.min(total - 1, Math.round(e.nativeEvent.contentOffset.x / paso))));
    },
    [paso, total],
  );

  if (total === 0) return null;

  const agregar = (o: OfertaApp) => {
    const p = o.producto;
    if (!p) return;
    const enCarrito = carrito[p.id]?.cantidad ?? 0;
    setCantidad(
      slug,
      { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl },
      enCarrito + 1,
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

      <View onLayout={medir}>
        {anchoCont === 0 ? null : enGrilla ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {items.map((o) => (
              <TarjetaOferta key={o.id} oferta={o} ancho={ancho} accent={accent} enCarrito={o.producto ? carrito[o.producto.id]?.cantidad ?? 0 : 0} onAgregar={() => agregar(o)} />
            ))}
          </View>
        ) : (
          <FlatList
            ref={lista}
            horizontal
            data={items}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={paso}
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={{ gap: GAP }}
            getItemLayout={(_, index) => ({ length: paso, offset: paso * index, index })}
            onScrollBeginDrag={() => (tocando.current = true)}
            onMomentumScrollEnd={alSoltar}
            renderItem={({ item: o }) => (
              <TarjetaOferta oferta={o} ancho={ancho} accent={accent} enCarrito={o.producto ? carrito[o.producto.id]?.cantidad ?? 0 : 0} onAgregar={() => agregar(o)} />
            )}
          />
        )}
      </View>

      {total > 1 && !enGrilla && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityLabel={`Oferta ${actual + 1} de ${total}`}>
          {items.map((o, i) => (
            <View key={o.id} style={{ width: i === actual ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === actual ? accent : colors.line }} />
          ))}
        </View>
      )}
    </View>
  );
}

function TarjetaOferta({
  oferta: o,
  ancho,
  accent,
  enCarrito,
  onAgregar,
}: {
  oferta: OfertaApp;
  ancho: number;
  accent: string;
  enCarrito: number;
  onAgregar: () => void;
}) {
  const p = o.producto;
  return (
    <View style={[tarjetaBase, { width: ancho, height: ALTO, flexDirection: 'row', overflow: 'hidden' }]}>
      <View style={{ width: '40%', backgroundColor: colors.white, borderRightWidth: 1, borderRightColor: colors.lineSoft }}>
        {o.imagenUrl ? (
          <Image source={{ uri: o.imagenUrl }} style={{ flex: 1, margin: 8 }} contentFit="contain" transition={150} accessibilityLabel={o.titulo} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(accent, 0.08) }}>
            <Icono name="tag-outline" size={34} color={accent} />
          </View>
        )}
        {o.descuentoPct ? (
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <Insignia texto={`−${o.descuentoPct}%`} bg={accent} fg={colors.white} />
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}>
          <T v="fuerte" numberOfLines={2}>{o.titulo}</T>
          {p ? (
            <T v="chico" numberOfLines={2} style={{ fontSize: 12 }}>{p.nombre}</T>
          ) : o.descripcion ? (
            <T v="chico" numberOfLines={4}>{o.descripcion}</T>
          ) : null}
        </View>

        {p && (
          <View style={{ gap: 8 }}>
            <View>
              {p.precioOferta !== null && (
                <T v="chico" style={{ fontSize: 12, textDecorationLine: 'line-through' }}>{precio(p.precio)}</T>
              )}
              <T v="numero" style={{ fontSize: 19, color: p.precioOferta !== null ? accent : colors.ink }}>
                {precio(p.precioOferta ?? p.precio)}
              </T>
            </View>
            <Boton chico color={accent} icono={enCarrito ? 'check' : 'cart-plus'} onPress={onAgregar} style={{ borderRadius: radius.md }}>
              {enCarrito ? `${enCarrito} en carrito` : 'Agregar'}
            </Boton>
          </View>
        )}
      </View>
    </View>
  );
}
