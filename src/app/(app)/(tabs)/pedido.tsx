// Pantalla 4 del diseño: el pedido. Los precios y el total vienen de /cotizar (servidor);
// confirmar reusa el mismo clientRequestId en cada reintento (el servidor no duplica).
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, FichaProducto, Insignia, Stepper, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { ApiError } from '@/lib/api';
import { iniciales, precio, presentacion } from '@/lib/format';
import { useCotizacion, useCrearPedido } from '@/lib/queries';
import { colorRubro } from '@/lib/rubro';
import { useCarrito, useCarritoStore, type ItemCarrito } from '@/state/carrito';
import { colors, fonts, radius, tint } from '@/theme';

export default function Pedido() {
  const { slug, accent } = useComercioActivo();
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const vaciar = useCarritoStore((s) => s.vaciar);
  const requestId = useCarritoStore((s) => (slug ? s.requestIds[slug] : undefined));
  const setRequestId = useCarritoStore((s) => s.setRequestId);
  const [notas, setNotas] = useState('');

  const lineas = Object.values(carrito);
  const items = useMemo(() => lineas.map((l) => ({ productId: l.productId, quantity: l.cantidad })), [lineas]);
  const cot = useCotizacion(slug!, items);
  const crear = useCrearPedido(slug!);

  const precioServidor = new Map((cot.data?.lineas ?? []).map((l) => [l.productId, l]));
  const errorProducto = cot.error instanceof ApiError ? (cot.error.extra?.productId as string | undefined) : undefined;

  const cambiar = (l: ItemCarrito, cantidad: number) => setCantidad(slug!, l, cantidad);

  const confirmar = () => {
    const id = requestId ?? Crypto.randomUUID();
    if (!requestId) setRequestId(slug!, id);
    crear.mutate(
      { items, clientRequestId: id, notas: notas.trim() || undefined },
      {
        onSuccess: (r) => {
          vaciar(slug!);
          setNotas('');
          router.push({ pathname: '/pedidos/[id]', params: { id: r.pedidoId, nuevo: '1' } });
        },
      },
    );
  };

  if (lineas.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16, justifyContent: 'center' }}>
        <T v="h1">Tu pedido está vacío</T>
        <T>Sumá productos desde el catálogo o repetí tu último pedido desde el inicio.</T>
        <Boton color={accent} icono="view-grid-outline" onPress={() => router.navigate('/catalogo')}>
          Ir al catálogo
        </Boton>
      </SafeAreaView>
    );
  }

  const credito = cot.data?.credito;
  const total = cot.data?.total;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <T v="h1">Tu pedido</T>
          <T v="chico">{lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}</T>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: radius.lg }}>
          {lineas.map((l, i) => {
            const srv = precioServidor.get(l.productId);
            const { bg, fg } = colorRubro(l.rubro || l.nombre);
            const conError = errorProducto === l.productId;
            return (
              <View key={l.productId} style={{ padding: 14, gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft, backgroundColor: conError ? colors.warnSoft : undefined }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <FichaProducto iniciales={iniciales(l.rubro || l.nombre)} bg={bg} fg={fg} size={48} />
                  <View style={{ flex: 1 }}>
                    <T v="fuerte" numberOfLines={2}>{l.nombre}</T>
                    <T v="chico" style={{ fontSize: 12 }}>
                      {presentacion(l.unidadesPorBulto, l.seDivideEn)} · {precio(srv?.price ?? l.precioReferencia)} c/u
                    </T>
                  </View>
                  <T v="numero" style={{ fontSize: 16 }}>{precio(srv?.subtotal ?? l.precioReferencia * l.cantidad)}</T>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {conError ? <Insignia texto="Ya no está disponible" bg={colors.offerSoft} fg={colors.offerInk} /> : <View />}
                  <Stepper cantidad={l.cantidad} etiqueta="" onMenos={() => cambiar(l, l.cantidad - 1)} onMas={() => cambiar(l, l.cantidad + 1)} />
                </View>
              </View>
            );
          })}
        </View>

        {cot.error && <Aviso texto={cot.error.message} />}

        {credito && (
          <Tarjeta style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="fuerte">Tu cuenta corriente</T>
              <Insignia
                texto={credito.clasificacion === 'normal' ? 'Al día' : credito.clasificacion === 'atrasado' ? 'Con atraso' : 'Moroso'}
                bg={credito.clasificacion === 'normal' ? colors.okSoft : colors.amberSoft}
                fg={credito.clasificacion === 'normal' ? colors.okInk : colors.amberInk}
              />
            </View>
            {credito.limite ? (
              <>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.lineSoft, flexDirection: 'row', overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, (credito.saldo / credito.limite) * 100)}%`, backgroundColor: colors.inkSoft }} />
                  <View style={{ width: `${Math.min(100, ((total ?? 0) / credito.limite) * 100)}%`, backgroundColor: accent }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T v="chico" style={{ fontSize: 12 }}>Deuda {precio(credito.saldo)}</T>
                  <T v="chico" style={{ fontSize: 12 }}>Límite {precio(credito.limite)}</T>
                </View>
              </>
            ) : (
              <T v="chico">Saldo actual {precio(credito.saldo)}</T>
            )}
          </Tarjeta>
        )}

        {cot.data?.retencion && <Aviso tono="info" texto={cot.data.retencion} />}

        <View style={{ gap: 6 }}>
          <T v="fuerte">Nota para la distribuidora</T>
          <TextInput
            accessibilityLabel="Nota para la distribuidora"
            value={notas}
            onChangeText={setNotas}
            placeholder="Ej.: si no hay aceite de 1,5 L, mandar el de 900 ml"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={{ minHeight: 70, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, padding: 12, fontSize: 15, fontFamily: fonts.body, color: colors.ink, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ gap: 8 }}>
          {cot.data?.lista && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T v="chico">Tu lista de precios</T>
              <T v="chico">{cot.data.lista.nombre}</T>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: '#CFCABF', paddingTop: 10 }}>
            <T v="h2" style={{ fontSize: 18 }}>Total</T>
            <T style={{ fontFamily: fonts.display, fontSize: 26 }}>{total !== undefined ? precio(total) : '…'}</T>
          </View>
          <T v="chico" style={{ fontSize: 12 }}>Se paga a cuenta corriente, como siempre.</T>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: '#E6E2D8', padding: 16, gap: 8 }}>
        {crear.error && <Aviso texto={crear.error.message} />}
        <Boton
          color={accent}
          onPress={confirmar}
          cargando={crear.isPending}
          disabled={!cot.data || cot.isFetching || !!cot.error}
        >
          Confirmar pedido
        </Boton>
        <View style={{ backgroundColor: tint(accent, 0.08), borderRadius: radius.sm, padding: 8 }}>
          <T v="chico" style={{ fontSize: 12, textAlign: 'center' }}>Tu vendedor recibe el pedido en su panel.</T>
        </View>
      </View>
    </SafeAreaView>
  );
}
