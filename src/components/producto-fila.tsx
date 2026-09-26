// Fila de producto del catálogo: ficha por rubro (sin foto), precio por unidad de venta y stepper.
import { memo } from 'react';
import { View } from 'react-native';
import { Boton, FichaProducto, Stepper, T } from '@/components/ui';
import { iniciales, precio, presentacion } from '@/lib/format';
import { colorRubro } from '@/lib/rubro';
import type { ProductoApp } from '@/lib/tipos';
import { colors, radius } from '@/theme';

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
  const { bg, fg } = colorRubro(producto.rubro || producto.nombre);
  const unidad = presentacion(producto.unidadesPorBulto, producto.seDivideEn);
  const etiqueta = unidad === 'Unidad' ? 'u.' : unidad.startsWith('Pack') ? 'pack' : cantidad === 1 ? 'bulto' : 'bultos';

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, flexDirection: 'row', gap: 12 }}>
      <FichaProducto iniciales={iniciales(producto.rubro || producto.nombre)} bg={bg} fg={fg} pie={producto.rubro.slice(0, 12) || undefined} />
      <View style={{ flex: 1, gap: 4 }}>
        <T v="fuerte" numberOfLines={2}>{producto.nombre}</T>
        <T v="chico" style={{ fontSize: 12 }}>
          {unidad}{producto.codigo ? ` · Cód. ${producto.codigo}` : ''}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <T v="numero">{precio(producto.precio)}</T>
          {cantidad > 0 ? (
            <Stepper
              cantidad={cantidad}
              etiqueta={etiqueta}
              onMenos={() => onCambiar(producto, cantidad - 1)}
              onMas={() => onCambiar(producto, cantidad + 1)}
            />
          ) : (
            <Boton color={accent} onPress={() => onCambiar(producto, 1)} style={{ minHeight: 44, paddingHorizontal: 16 }}>
              Agregar
            </Boton>
          )}
        </View>
      </View>
    </View>
  );
});
