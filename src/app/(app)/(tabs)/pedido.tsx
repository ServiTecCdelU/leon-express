// Carrito: precios y total vienen de /cotizar (servidor); confirmar reusa el mismo
// clientRequestId en cada reintento (el servidor no duplica). El visitante arma el carrito
// con precios de referencia y al confirmar se le pide registrarse.
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarraSuperior } from '@/components/barra-superior';
import { DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { FotoProducto } from '@/components/foto-producto';
import { Aviso, Boton, Fila, Insignia, T, Tarjeta } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { ApiError } from '@/lib/api';
import { precio, presentacion } from '@/lib/format';
import { useCotizacion, useCrearPedido } from '@/lib/queries';
import { useCarrito, useCarritoStore, type ItemCarrito } from '@/state/carrito';
import { useRegistroStore } from '@/state/registro';
import { colors, fonts, radius } from '@/theme';

const CLASIFICACION: Record<string, { texto: string; bg: string; fg: string; borde: string }> = {
  normal: { texto: 'Al día', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  atrasado: { texto: 'Con atraso', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  moroso: { texto: 'Saldo vencido', bg: colors.errorSoft, fg: colors.errorInk, borde: colors.errorLine },
};

export default function Pedido() {
  const { slug, accent, visitante } = useComercioActivo();
  const pedirRegistro = useRegistroStore((s) => s.abrir);
  const insets = useSafeAreaInsets();
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const vaciar = useCarritoStore((s) => s.vaciar);
  const requestId = useCarritoStore((s) => (slug ? s.requestIds[slug] : undefined));
  const setRequestId = useCarritoStore((s) => s.setRequestId);
  const [notas, setNotas] = useState('');

  const lineas = useMemo(() => Object.values(carrito), [carrito]);
  const items = useMemo(() => lineas.map((l) => ({ productId: l.productId, quantity: l.cantidad })), [lineas]);
  const cot = useCotizacion(slug!, items, !visitante);
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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <BarraSuperior titulo="Carrito" color={accent} />
        <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <T v="h2">Tu carrito está vacío</T>
          <T v="chico" style={{ textAlign: 'center' }}>Sumá productos desde el catálogo o repetí tu último pedido desde el inicio.</T>
          <Boton color={accent} icono="package-variant-closed" onPress={() => router.navigate('/catalogo')} style={{ marginTop: 8 }}>
            Ver productos
          </Boton>
        </View>
      </View>
    );
  }

  const credito = cot.data?.credito;
  const total = visitante ? lineas.reduce((acc, l) => acc + l.precioReferencia * l.cantidad, 0) : cot.data?.total;
  const clasif = CLASIFICACION[credito?.clasificacion ?? 'normal'] ?? CLASIFICACION.atrasado;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Carrito" subtitulo={`${lineas.length} ${lineas.length === 1 ? 'producto' : 'productos'}`} color={accent} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 170 }} keyboardShouldPersistTaps="handled">
        <Tarjeta style={{ padding: 0 }}>
          {lineas.map((l, i) => {
            const srv = precioServidor.get(l.productId);
            const conError = errorProducto === l.productId;
            return (
              <View key={l.productId} style={{ padding: 12, gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft, backgroundColor: conError ? colors.errorSoft : undefined }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <FotoProducto nombre={l.nombre} imagenUrl={l.imageUrl} color={accent} size={40} />
                  <View style={{ flex: 1 }}>
                    <T v="fuerte" numberOfLines={2} style={{ fontSize: 14 }}>{l.nombre}</T>
                    <T v="chico" style={{ fontSize: 12 }}>
                      {presentacion(l.unidadesPorBulto, l.seDivideEn)} · {srv ? precio(srv.price) : visitante ? precio(l.precioReferencia) : '…'} c/u
                    </T>
                    {srv?.itemDiscount ? (
                      <View style={{ marginTop: 4 }}>
                        <Insignia texto={`Oferta −${srv.itemDiscount}%`} bg={colors.tealSoft} fg={colors.tealInk} borde={colors.tealLine} />
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {conError ? (
                    <Insignia texto="Ya no está disponible" bg={colors.errorSoft} fg={colors.errorInk} borde={colors.errorLine} />
                  ) : (
                    <T v="numero" style={{ fontSize: 15 }}>{srv ? precio(srv.subtotal) : visitante ? precio(l.precioReferencia * l.cantidad) : '…'}</T>
                  )}
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <SelectorCantidad cantidad={l.cantidad} color={accent} nombre={l.nombre} onCambiar={(n) => cambiar(l, n)} />
                    <DetalleCantidad cantidad={l.cantidad} unidadesPorBulto={l.unidadesPorBulto} seDivideEn={l.seDivideEn} />
                  </View>
                </View>
              </View>
            );
          })}
        </Tarjeta>

        {visitante && <Aviso tono="info" texto="Precios de referencia. Al registrarte se confirman con tu lista de precios." />}
        {cot.error && <Aviso texto={cot.error.message} />}
        {cot.data?.retencion && <Aviso tono="info" texto={cot.data.retencion} />}

        {credito && (
          <Tarjeta style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="fuerte" style={{ fontSize: 14 }}>Cuenta corriente</T>
              <Insignia {...clasif} />
            </View>
            <Fila etiqueta="Saldo actual" valor={precio(credito.saldo)} />
            {credito.limite ? <Fila etiqueta="Límite" valor={precio(credito.limite)} /> : null}
            {credito.disponible != null ? <Fila etiqueta="Disponible" valor={precio(credito.disponible)} /> : null}
          </Tarjeta>
        )}

        <Tarjeta style={{ gap: 8 }}>
          <T v="fuerte" style={{ fontSize: 14 }}>Nota para la distribuidora</T>
          <TextInput
            accessibilityLabel="Nota para la distribuidora"
            value={notas}
            onChangeText={setNotas}
            placeholder="Ej.: si no hay aceite de 1,5 L, mandar el de 900 ml"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={{ minHeight: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 10, fontSize: 14, fontFamily: fonts.body, color: colors.ink, textAlignVertical: 'top' }}
          />
        </Tarjeta>

        <Tarjeta style={{ gap: 8 }}>
          {cot.data?.lista && <Fila etiqueta="Lista de precios" valor={cot.data.lista.nombre} />}
          <Fila etiqueta="Forma de pago" valor="Cuenta corriente" />
          <View style={{ height: 1, backgroundColor: colors.lineSoft, marginVertical: 4 }} />
          <Fila etiqueta="Total" valor={total !== undefined ? precio(total) : '…'} fuerte />
        </Tarjeta>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, padding: 16, paddingBottom: 16 + Math.min(insets.bottom, 8), gap: 8 }}>
        {crear.error && <Aviso texto={crear.error.message} />}
        {visitante ? (
          <Boton color={accent} icono="account-plus-outline" onPress={() => pedirRegistro('Registrate para enviar tu pedido. Tu carrito queda guardado.')}>
            Registrarme y enviar{total !== undefined ? ` · ${precio(total)}` : ''}
          </Boton>
        ) : (
          <Boton color={accent} icono="check" onPress={confirmar} cargando={crear.isPending} disabled={!cot.data || cot.isFetching || !!cot.error}>
            Confirmar pedido{total !== undefined ? ` · ${precio(total)}` : ''}
          </Boton>
        )}
      </View>
    </View>
  );
}
