// Productos: catálogo paginado con búsqueda (nombre, código o código de barras), filtro
// por rubro (chips con ícono + hoja con todos), vista lista o cuadrícula (se recuerda)
// y cantidades tipeables. Desde el inicio llega con ?q=, ?rubro=, ?ofertas=1 o ?buscar=.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { anchoHoja, useAnchoApp } from '@/components/marco-app';
import { ProductoFila, ProductoTarjeta } from '@/components/producto-fila';
import { iconoDeRubro, SelectorRubros } from '@/components/rubros';
import { Aviso, Boton, Cargando, Chip, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { precio } from '@/lib/format';
import { useCatalogo, useRubros } from '@/lib/queries';
import { nombreRubro, rubrosVisibles } from '@/lib/rubros';
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

const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
const miles = (n: number) => n.toLocaleString('es-AR');

const PAD = 16;
const GAP = 8;
const ANCHO_TARJETA = 180;
const ANCHO_FILA = 360;

/** Columnas del catálogo según el ancho: el celular queda como siempre (1 en lista, 2 en cuadrícula). */
function columnasPara(ancho: number, grilla: boolean): number {
  const util = ancho - PAD * 2;
  if (grilla) return Math.max(2, Math.min(8, Math.floor((util + GAP) / (ANCHO_TARJETA + GAP))));
  return Math.max(1, Math.min(4, Math.floor((util + GAP) / (ANCHO_FILA + GAP))));
}

function BarraBusqueda({
  valor,
  onCambiar,
  accent,
  enfoque,
}: {
  valor: string;
  onCambiar: (t: string) => void;
  accent: string;
  /** Cambia cada vez que el inicio pide abrir el teclado. */
  enfoque: string;
}) {
  const ref = useRef<TextInput>(null);
  const [enfocado, setEnfocado] = useState(false);
  useEffect(() => {
    if (enfoque) ref.current?.focus();
  }, [enfoque]);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: radius.md, borderWidth: enfocado ? 2 : 1, borderColor: enfocado ? accent : colors.line, backgroundColor: colors.card, paddingLeft: enfocado ? 13 : 14, paddingRight: 6 }}>
      <Icono name="magnify" color={enfocado ? accent : colors.muted} size={20} />
      <TextInput
        ref={ref}
        accessibilityLabel="Buscar producto"
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder="Buscá por nombre, marca o código"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.ink, outlineStyle: 'none' } as object}
      />
      {valor ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => onCambiar('')} hitSlop={10}>
          <Icono name="close-circle" color={colors.muted} size={18} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escanear código de barras"
        onPress={() => router.push('/escanear')}
        style={({ pressed }) => ({ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: accent, opacity: pressed ? 0.85 : 1, alignItems: 'center', justifyContent: 'center' })}
      >
        <Icono name="barcode-scan" color={colors.white} size={20} />
      </Pressable>
    </View>
  );
}

function Filtros({
  rubros,
  rubro,
  soloOfertas,
  accent,
  onRubro,
  onOfertas,
  onVerRubros,
}: {
  rubros: string[];
  rubro: string;
  soloOfertas: boolean;
  accent: string;
  onRubro: (r: string) => void;
  onOfertas: () => void;
  onVerRubros: () => void;
}) {
  // El rubro elegido va primero para que se vea aunque esté al final de la lista.
  const orden = rubro ? [rubro, ...rubros.filter((r) => r !== rubro)] : rubros;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 2 }}>
      <Chip texto="Rubros" icono="tune-variant" color={accent} onPress={onVerRubros} />
      <Chip texto="Ofertas" icono="tag-outline" activo={soloOfertas} color={accent} onPress={onOfertas} />
      {orden.map((r) => (
        <Chip key={r} texto={nombreRubro(r)} icono={iconoDeRubro(r)} activo={rubro === r} color={accent} onPress={() => onRubro(rubro === r ? '' : r)} />
      ))}
    </ScrollView>
  );
}

function Resumen({ total, q, rubro, soloOfertas, onLimpiar }: { total?: number; q: string; rubro: string; soloOfertas: boolean; onLimpiar: () => void }) {
  if (total === undefined) return null;
  const filtrado = !!(q || rubro || soloOfertas);
  const partes = [q ? `para “${q}”` : '', rubro ? `en ${nombreRubro(rubro)}` : '', soloOfertas ? 'en oferta' : ''].filter(Boolean).join(' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 }}>
      <T v="chico" style={{ flex: 1 }} numberOfLines={1}>
        <T v="chico" style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{miles(total)}</T>
        {` ${total === 1 ? 'producto' : 'productos'}${partes ? ` ${partes}` : ''}`}
      </T>
      {filtrado && (
        <Pressable accessibilityRole="button" onPress={onLimpiar} hitSlop={8}>
          <T v="chico" style={{ fontFamily: fonts.bodySemi, color: colors.tealInk }}>Limpiar</T>
        </Pressable>
      )}
    </View>
  );
}

function SinResultados({ q, accent, onLimpiar }: { q: string; accent: string; onLimpiar: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="magnify" size={30} color={colors.muted} />
      </View>
      <T v="h2" style={{ textAlign: 'center' }}>{q ? `No encontramos “${q}”` : 'No hay productos acá'}</T>
      <T v="chico" style={{ textAlign: 'center' }}>Probá con otra palabra, la marca o el código. También podés sacar los filtros.</T>
      <Boton variante="suave" color={accent} chico onPress={onLimpiar}>Ver todos los productos</Boton>
    </View>
  );
}

function CarritoFlotante({ cantidad, total, accent }: { cantidad: number; total: number; accent: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver carrito"
      onPress={() => router.navigate('/pedido')}
      style={[anchoHoja, { position: 'absolute', left: 16, right: 16, bottom: 12, marginHorizontal: 'auto', width: undefined, height: 52, borderRadius: radius.md, backgroundColor: accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, elevation: 4, shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icono name="cart-outline" color={colors.white} size={20} />
        <T v="fuerte" style={{ color: colors.white }}>
          {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
        </T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <T v="fuerte" style={{ color: colors.white }}>{precio(total)}</T>
        <Icono name="chevron-right" color={colors.white} size={20} />
      </View>
    </Pressable>
  );
}

/** Filtros que llegan por parámetro (desde el inicio): se aplican cada vez que cambian. */
function useFiltrosDeRuta() {
  const params = useLocalSearchParams<{ rubro?: string; ofertas?: string; q?: string; buscar?: string }>();
  const desdeRuta = { rubro: texto(params.rubro), ofertas: params.ofertas === '1', q: texto(params.q), buscar: texto(params.buscar) };
  const [rubro, setRubro] = useState(desdeRuta.rubro);
  const [soloOfertas, setSoloOfertas] = useState(desdeRuta.ofertas);
  const [busqueda, setBusqueda] = useState(desdeRuta.q);
  // Ajuste durante el render, no en un efecto: https://react.dev/learn/you-might-not-need-an-effect
  const clave = `${desdeRuta.rubro}|${desdeRuta.ofertas}|${desdeRuta.q}|${desdeRuta.buscar}`;
  const [ultimaClave, setUltimaClave] = useState(clave);
  if (clave !== ultimaClave) {
    setUltimaClave(clave);
    setRubro(desdeRuta.rubro);
    setSoloOfertas(desdeRuta.ofertas);
    setBusqueda(desdeRuta.q);
  }
  return { rubro, setRubro, soloOfertas, setSoloOfertas, busqueda, setBusqueda, enfoque: desdeRuta.buscar };
}

export default function Catalogo() {
  const { comercio, slug, accent } = useComercioActivo();
  const { rubro, setRubro, soloOfertas, setSoloOfertas, busqueda, setBusqueda, enfoque } = useFiltrosDeRuta();
  const [verRubros, setVerRubros] = useState(false);
  const q = useDebounce(busqueda.trim(), 350);

  const catalogo = useCatalogo(slug!, q, rubro, soloOfertas);
  const rubrosQuery = useRubros(slug!);
  const rubros = useMemo(() => rubrosVisibles(rubrosQuery.data ?? []), [rubrosQuery.data]);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const { vista, setVista } = usePreferencias();
  const grilla = vista === 'cuadricula';
  const ancho = useAnchoApp();
  const columnas = columnasPara(ancho, grilla);
  // Ancho fijo por columna: así la última fila incompleta no se estira.
  const anchoItem = columnas > 1 ? (ancho - PAD * 2 - GAP * (columnas - 1)) / columnas : undefined;

  const productos = useMemo(() => catalogo.data?.pages.flatMap((p) => p.items) ?? [], [catalogo.data]);
  const total = catalogo.data?.pages[0]?.total;
  const lineas = Object.values(carrito);
  const estimado = lineas.reduce((acc, i) => acc + i.precioReferencia * i.cantidad, 0);

  const limpiar = () => {
    setBusqueda('');
    setRubro('');
    setSoloOfertas(false);
  };

  const cambiar = useCallback(
    (p: ProductoApp, cantidad: number) =>
      setCantidad(
        slug!,
        { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl },
        cantidad,
      ),
    [setCantidad, slug],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Productos" subtitulo={comercio?.nombre} color={accent} />
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 12, paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
          <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} accent={accent} enfoque={enfoque} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={grilla ? 'Ver en lista' : 'Ver en cuadrícula'}
            onPress={() => setVista(grilla ? 'lista' : 'cuadricula')}
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.lineSoft : colors.card, alignItems: 'center', justifyContent: 'center' })}
          >
            <Icono name={grilla ? 'view-list-outline' : 'view-grid-outline'} color={accent} size={22} />
          </Pressable>
        </View>
        <Filtros rubros={rubros} rubro={rubro} soloOfertas={soloOfertas} accent={accent} onRubro={setRubro} onOfertas={() => setSoloOfertas(!soloOfertas)} onVerRubros={() => setVerRubros(true)} />
      </View>
      <Resumen total={total} q={q} rubro={rubro} soloOfertas={soloOfertas} onLimpiar={limpiar} />

      {catalogo.isLoading ? (
        <Cargando />
      ) : catalogo.error ? (
        <View style={{ padding: 16 }}>
          <Aviso texto={catalogo.error.message} accion={<Boton variante="borde" chico onPress={() => catalogo.refetch()}>Reintentar</Boton>} />
        </View>
      ) : (
        <FlatList
          // numColumns no puede cambiar en caliente: la key fuerza a rearmar la lista.
          key={`${vista}-${columnas}`}
          data={productos}
          keyExtractor={(p) => p.id}
          numColumns={columnas}
          columnWrapperStyle={columnas > 1 ? { gap: GAP } : undefined}
          contentContainerStyle={{ padding: PAD, paddingTop: 8, gap: GAP, paddingBottom: lineas.length ? 100 : 24 }}
          renderItem={({ item }) => (
            <View style={anchoItem ? { width: anchoItem } : undefined}>
              {grilla ? (
                <ProductoTarjeta producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
              ) : (
                <ProductoFila producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
              )}
            </View>
          )}
          onEndReached={() => catalogo.hasNextPage && !catalogo.isFetchingNextPage && catalogo.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={catalogo.isFetchingNextPage ? <Cargando /> : null}
          ListEmptyComponent={<SinResultados q={q} accent={accent} onLimpiar={limpiar} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {lineas.length > 0 && <CarritoFlotante cantidad={lineas.length} total={estimado} accent={accent} />}

      <SelectorRubros visible={verRubros} rubros={rubros} activo={rubro} color={accent} onElegir={setRubro} onCerrar={() => setVerRubros(false)} />
    </View>
  );
}
