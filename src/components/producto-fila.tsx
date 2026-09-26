// Fila de producto del catálogo (estilo tabla/lista del panel): iniciales, nombre, código,
// presentación y precio; a la derecha "Agregar" o el stepper.
import { memo } from 'react';
import { View } from 'react-native';
import { Boton, FichaProducto, Stepper, T } from '@/components/ui';
import { iniciales, precio, presentacion } from '@/lib/format';
import type { ProductoApp } from '@/lib/tipos';
import { tarjetaBase } from '@/theme';

export const ProductoFila = memo(function ProductoFila({
  producto,
  cantidad,
  accent,
  onCambiar,
}: {
  producto: ProductoApp;
  cantidad: number;
  accent: string;
  onCambiar: (producto: ProductoApp, cantidad: number) => void;
}) {
  return (
    <View style={[tarjetaBase, { padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
      <FichaProducto iniciales={iniciales(producto.nombre)} color={accent} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="fuerte" numberOfLines={2} style={{ fontSize: 14 }}>{producto.nombre}</T>
        <T v="chico" style={{ fontSize: 12 }}>
          {presentacion(producto.unidadesPorBulto, producto.seDivideEn)}
          {producto.codigo ? ` · Cód. ${producto.codigo}` : ''}
        </T>
        <T v="numero" style={{ fontSize: 16, marginTop: 2 }}>{precio(producto.precio)}</T>
      </View>
      {cantidad > 0 ? (
        <Stepper
          cantidad={cantidad}
          color={accent}
          onMenos={() => onCambiar(producto, cantidad - 1)}
          onMas={() => onCambiar(producto, cantidad + 1)}
        />
      ) : (
        <Boton chico color={accent} icono="plus" onPress={() => onCambiar(producto, 1)}>
          Agregar
        </Boton>
      )}
    </View>
  );
});
