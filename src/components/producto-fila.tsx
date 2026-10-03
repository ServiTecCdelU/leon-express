// Producto del catálogo en dos vistas: fila (lista) y tarjeta (cuadrícula). A la derecha
// o abajo, "+" chico para agregar; ya en el carrito, el selector de cantidad tipeable.
import { memo } from 'react';
import { View } from 'react-native';
import { BotonAgregar, DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { FotoProducto } from '@/components/foto-producto';
import { Insignia, T } from '@/components/ui';
import { precio, presentacion } from '@/lib/format';
import type { ProductoApp } from '@/lib/tipos';
import { colors, tarjetaBase, tint } from '@/theme';

interface Props {
  producto: ProductoApp;
  cantidad: number;
  accent: string;
  onCambiar: (producto: ProductoApp, cantidad: number) => void;
}

function Precio({ producto, accent }: { producto: ProductoApp; accent: string }) {
  if (producto.precioOferta === null) return <T v="numero" style={{ fontSize: 15 }}>{precio(producto.precio)}</T>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <T v="numero" style={{ fontSize: 15, color: accent }}>{precio(producto.precioOferta)}</T>
      <T v="chico" style={{ fontSize: 12, textDecorationLine: 'line-through' }}>{precio(producto.precio)}</T>
      <Insignia texto={`−${producto.descuentoPct}%`} bg={accent} fg={colors.white} />
    </View>
  );
}

function Controles({ producto, cantidad, accent, onCambiar }: Props) {
  if (cantidad <= 0) return <BotonAgregar color={accent} etiqueta={`Agregar ${producto.nombre}`} onPress={() => onCambiar(producto, 1)} />;
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <SelectorCantidad cantidad={cantidad} color={accent} nombre={producto.nombre} onCambiar={(n) => onCambiar(producto, n)} />
      <DetalleCantidad cantidad={cantidad} unidadesPorBulto={producto.unidadesPorBulto} seDivideEn={producto.seDivideEn} />
    </View>
  );
}

/** Ya en el carrito: fondo suave y borde del color de marca atenuado (con varios agregados la
 *  lista no tiene que parecer "toda seleccionada"). */
const estiloEnCarrito = (cantidad: number, accent: string) =>
  cantidad > 0 ? { backgroundColor: tint(accent, 0.06), borderColor: tint(accent, 0.4) } : { borderColor: colors.line };

const subtitulo = (p: ProductoApp) => `${presentacion(p.unidadesPorBulto, p.seDivideEn)}${p.codigo ? ` · Cód. ${p.codigo}` : ''}`;

export const ProductoFila = memo(function ProductoFila(props: Props) {
  const { producto, cantidad, accent } = props;
  return (
    <View style={[tarjetaBase, { flexGrow: 1, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }, estiloEnCarrito(cantidad, accent)]}>
      <FotoProducto nombre={producto.nombre} imagenUrl={producto.imageUrl} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="fuerte" numberOfLines={2} style={{ fontSize: 14 }}>{producto.nombre}</T>
        <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>{subtitulo(producto)}</T>
        <Precio producto={producto} accent={accent} />
      </View>
      <Controles {...props} />
    </View>
  );
});

export const ProductoTarjeta = memo(function ProductoTarjeta(props: Props) {
  const { producto, cantidad, accent } = props;
  return (
    <View style={[tarjetaBase, { flex: 1, padding: 10, gap: 6 }, estiloEnCarrito(cantidad, accent)]}>
      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <FotoProducto nombre={producto.nombre} imagenUrl={producto.imageUrl} size={56} />
      </View>
      <T v="fuerte" numberOfLines={2} style={{ fontSize: 13, minHeight: 34 }}>{producto.nombre}</T>
      <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>{subtitulo(producto)}</T>
      <Precio producto={producto} accent={accent} />
      <View style={{ alignItems: cantidad > 0 ? 'center' : 'flex-end', marginTop: 'auto', paddingTop: 4 }}>
        <Controles {...props} />
      </View>
    </View>
  );
});
