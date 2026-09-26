// Pantalla 3 del diseño: catálogo paginado con búsqueda, rubros y stepper por bulto.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductoFila } from '@/components/producto-fila';
import { Aviso, Boton, Cargando, Chip, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { precio } from '@/lib/format';
import { useCatalogo, useRubros } from '@/lib/queries';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
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
  const { slug, accent } = useComercioActivo();
  const [texto, setTexto] = useState('');
  const params = useLocalSearchParams<{ rubro?: string }>();
  const rubroParam = typeof params.rubro === 'string' ? params.rubro : '';
  const [rubro, setRubro] = useState(rubroParam);
  // Llegar desde un rubro del inicio preselecciona el filtro (ajuste durante el render,
  // no en un efecto: https://react.dev/learn/you-might-not-need-an-effect).
  const [ultimoParam, setUltimoParam] = useState(rubroParam);
  if (rubroParam !== ultimoParam) {
    setUltimoParam(rubroParam);
    setRubro(rubroParam);
  }
  const q = useDebounce(texto.trim(), 350);

  const catalogo = useCatalogo(slug!, q, rubro);
  const rubros = useRubros(slug!);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);

  const productos = useMemo(() => catalogo.data?.pages.flatMap((p) => p.items) ?? [], [catalogo.data]);
  const lineas = Object.values(carrito);
  const estimado = lineas.reduce((acc, i) => acc + i.precioReferencia * i.cantidad, 0);

  const cambiar = useCallback(
    (p: ProductoApp, cantidad: number) =>
      setCantidad(
        slug!,
        {
          productId: p.id,
          nombre: p.nombre,
          rubro: p.rubro,
          precioReferencia: p.precio,
          unidadesPorBulto: p.unidadesPorBulto,
          seDivideEn: p.seDivideEn,
        },
        cantidad,
      ),
    [setCantidad, slug],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
        <T v="h1">Catálogo</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 14 }}>
          <Icono name="magnify" color={colors.muted} />
          <TextInput
            accessibilityLabel="Buscar producto"
            value={texto}
            onChangeText={setTexto}
            placeholder="Nombre, marca, código o código de barras"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 16, fontFamily: fonts.body, color: colors.ink }}
          />
          {texto ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setTexto('')} hitSlop={10}>
              <Icono name="close-circle" color={colors.muted} size={20} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          <Chip texto="Todos" activo={!rubro} color={accent} onPress={() => setRubro('')} />
          {(rubros.data ?? []).map((r) => (
            <Chip key={r} texto={r} activo={rubro === r} color={accent} onPress={() => setRubro(rubro === r ? '' : r)} />
          ))}
        </ScrollView>
      </View>

      {catalogo.isLoading ? (
        <Cargando />
      ) : catalogo.error ? (
        <View style={{ padding: 20 }}>
          <Aviso texto={catalogo.error.message} accion={<Boton variante="borde" onPress={() => catalogo.refetch()}>Reintentar</Boton>} />
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, paddingTop: 10, gap: 10, paddingBottom: lineas.length ? 110 : 30 }}
          renderItem={({ item }) => (
            <ProductoFila producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
          )}
          onEndReached={() => catalogo.hasNextPage && !catalogo.isFetchingNextPage && catalogo.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={catalogo.isFetchingNextPage ? <Cargando /> : null}
          ListEmptyComponent={
            <T v="chico" style={{ textAlign: 'center', paddingTop: 30 }}>
              {q ? `No encontramos "${q}".` : 'No hay productos en este rubro.'}
            </T>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {lineas.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver pedido"
          onPress={() => router.navigate('/pedido')}
          style={{ position: 'absolute', left: 16, right: 16, bottom: 14, height: 60, borderRadius: radius.lg, backgroundColor: accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, elevation: 8, shadowColor: accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }}
        >
          <View>
            <T style={{ color: colors.white, fontSize: 12, opacity: 0.9 }}>
              {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} · estimado
            </T>
            <T v="numero" style={{ color: colors.white }}>{precio(estimado)}</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="fuerte" style={{ color: colors.white, fontSize: 16 }}>Ver pedido</T>
            <Icono name="chevron-right" color={colors.white} />
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
