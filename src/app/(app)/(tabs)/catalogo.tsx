// Productos: catálogo paginado con búsqueda (nombre, código o código de barras), filtro
// por rubro, vista lista o cuadrícula (se recuerda) y cantidades tipeables.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { ProductoFila, ProductoTarjeta } from '@/components/producto-fila';
import { Aviso, Boton, Cargando, Chip, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { precio } from '@/lib/format';
import { useCatalogo, useRubros } from '@/lib/queries';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { usePreferencias } from '@/state/preferencias';
import { colors, fonts, radius } from '@/theme';

function useDebounce<T>(valor: T, ms: number): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}

export default function Catalogo() {
  const { comercio, slug, accent } = useComercioActivo();
  const params = useLocalSearchParams<{ rubro?: string; ofertas?: string }>();
  const rubroParam = typeof params.rubro === 'string' ? params.rubro : '';
  const [rubro, setRubro] = useState(rubroParam);
  // Llegar desde un rubro del inicio preselecciona el filtro (ajuste durante el render,
  // no en un efecto: https://react.dev/learn/you-might-not-need-an-effect).
  const ofertasParam = params.ofertas === '1';
  const [soloOfertas, setSoloOfertas] = useState(ofertasParam);
  const [ultimoParam, setUltimoParam] = useState(`${rubroParam}|${ofertasParam}`);
  if (`${rubroParam}|${ofertasParam}` !== ultimoParam) {
    setUltimoParam(`${rubroParam}|${ofertasParam}`);
    setRubro(rubroParam);
    setSoloOfertas(ofertasParam);
  }
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto.trim(), 350);

  const catalogo = useCatalogo(slug!, q, rubro, soloOfertas);
  const rubros = useRubros(slug!);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const { vista, setVista } = usePreferencias();
  const grilla = vista === 'cuadricula';

  const productos = useMemo(() => catalogo.data?.pages.flatMap((p) => p.items) ?? [], [catalogo.data]);
  const total = catalogo.data?.pages[0]?.total;
  const lineas = Object.values(carrito);
  const estimado = lineas.reduce((acc, i) => acc + i.precioReferencia * i.cantidad, 0);

  const cambiar = useCallback(
    (p: ProductoApp, cantidad: number) =>
      setCantidad(
        slug!,
        { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn },
        cantidad,
      ),
    [setCantidad, slug],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Productos" subtitulo={total !== undefined ? `${total} productos · ${comercio?.nombre ?? ''}` : comercio?.nombre} color={accent} />
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12 }}>
            <Icono name="magnify" color={colors.muted} size={18} />
            <TextInput
              accessibilityLabel="Buscar producto"
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar por nombre, código o código de barras"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.ink }}
            />
            {texto ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setTexto('')} hitSlop={10}>
                <Icono name="close-circle" color={colors.muted} size={18} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escanear código de barras"
              onPress={() => router.push('/escanear')}
              style={{ marginRight: -6, width: 36, height: 36, borderRadius: radius.sm, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icono name="barcode-scan" color={colors.white} size={20} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={grilla ? 'Ver en lista' : 'Ver en cuadrícula'}
            onPress={() => setVista(grilla ? 'lista' : 'cuadricula')}
            style={{ width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icono name={grilla ? 'view-list-outline' : 'view-grid-outline'} color={accent} size={22} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
          <Chip texto="Todos" activo={!rubro && !soloOfertas} color={accent} onPress={() => { setRubro(''); setSoloOfertas(false); }} />
          <Chip texto="Ofertas" activo={soloOfertas} color={accent} onPress={() => setSoloOfertas(!soloOfertas)} />
          {(rubros.data ?? []).map((r) => (
            <Chip key={r} texto={r} activo={rubro === r} color={accent} onPress={() => setRubro(rubro === r ? '' : r)} />
          ))}
        </ScrollView>
      </View>

      {catalogo.isLoading ? (
        <Cargando />
      ) : catalogo.error ? (
        <View style={{ padding: 16 }}>
          <Aviso texto={catalogo.error.message} accion={<Boton variante="borde" chico onPress={() => catalogo.refetch()}>Reintentar</Boton>} />
        </View>
      ) : (
        <FlatList
          // numColumns no puede cambiar en caliente: la key fuerza a rearmar la lista.
          key={vista}
          data={productos}
          keyExtractor={(p) => p.id}
          numColumns={grilla ? 2 : 1}
          columnWrapperStyle={grilla ? { gap: 8 } : undefined}
          contentContainerStyle={{ padding: 16, paddingTop: 10, gap: 8, paddingBottom: lineas.length ? 100 : 24 }}
          renderItem={({ item }) =>
            grilla ? (
              <ProductoTarjeta producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
            ) : (
              <ProductoFila producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
            )
          }
          onEndReached={() => catalogo.hasNextPage && !catalogo.isFetchingNextPage && catalogo.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={catalogo.isFetchingNextPage ? <Cargando /> : null}
          ListEmptyComponent={
            <T v="chico" style={{ textAlign: 'center', paddingTop: 30 }}>
              {q ? `No encontramos "${q}".` : soloOfertas ? 'No hay ofertas vigentes.' : 'No hay productos en este rubro.'}
            </T>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {lineas.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver carrito"
          onPress={() => router.navigate('/pedido')}
          style={{ position: 'absolute', left: 16, right: 16, bottom: 12, height: 52, borderRadius: radius.md, backgroundColor: accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, elevation: 4, shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icono name="cart-outline" color={colors.white} size={20} />
            <T v="fuerte" style={{ color: colors.white }}>
              {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <T v="fuerte" style={{ color: colors.white }}>{precio(estimado)}</T>
            <Icono name="chevron-right" color={colors.white} size={20} />
          </View>
        </Pressable>
      )}
    </View>
  );
}
