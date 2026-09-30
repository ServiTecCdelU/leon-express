// Carrusel horizontal de productos (usado por "Los más elegidos" y "Destacados de la semana"
// en el inicio): tarjetas del catálogo, con el selector de cantidad de siempre.
import { FlatList, View } from 'react-native';
import { ProductoTarjeta } from '@/components/producto-fila';
import { Cargando, Icono, T, type IconName } from '@/components/ui';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';

const ANCHO_TARJETA = 148;
const GAP = 10;

export function CarruselProductos({
  titulo,
  icono,
  slug,
  accent,
  productos,
  cargando,
}: {
  titulo: string;
  icono: IconName;
  slug: string;
  accent: string;
  productos: ProductoApp[] | undefined;
  cargando: boolean;
}) {
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);

  if (!cargando && (!productos || productos.length === 0)) return null;

  const cambiar = (p: ProductoApp, cantidad: number) =>
    setCantidad(slug, { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl }, cantidad);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icono name={icono} size={18} color={accent} />
        <T v="h2">{titulo}</T>
      </View>

      {cargando ? (
        <Cargando />
      ) : (
        <FlatList
          horizontal
          data={productos}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <View style={{ width: ANCHO_TARJETA }}>
              <ProductoTarjeta producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} />
            </View>
          )}
        />
      )}
    </View>
  );
}
