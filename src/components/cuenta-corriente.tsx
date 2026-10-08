// Cuenta corriente en "Mi cuenta": últimos movimientos, pagos informados y la hoja
// "Informar un pago" (monto, medio y foto del comprobante). Un pago informado no baja el
// saldo: la distribuidora lo verifica en su panel y recién ahí se descuenta.
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/datos-comercio';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, Insignia, T, Tarjeta } from '@/components/ui';
import { fechaCorta, precio } from '@/lib/format';
import { parseMonto } from '@/lib/pagos';
import { useInformarPago } from '@/lib/queries';
import type { DatosTransferencia, InformarPago, MetodoPago, MovimientoCuenta, PagoInformado } from '@/lib/tipos';
import { colors, fonts, radius, tint } from '@/theme';

const VISIBLES = 5;
/** ~3 MB de imagen en base64 (mismo tope que el servidor). */
const MAX_BASE64 = 4_000_000;

const METODOS: { clave: MetodoPago; texto: string }[] = [
  { clave: 'transferencia', texto: 'Transferencia' },
  { clave: 'efectivo', texto: 'Efectivo' },
  { clave: 'cheque', texto: 'Cheque' },
  { clave: 'otro', texto: 'Otro' },
];

const ESTADO_PAGO: Record<PagoInformado['estado'], { texto: string; bg: string; fg: string; borde: string }> = {
  pendiente: { texto: 'En revisión', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  aprobado: { texto: 'Acreditado', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  rechazado: { texto: 'Rechazado', bg: colors.errorSoft, fg: colors.errorInk, borde: colors.errorLine },
};

export function TarjetaMovimientos({ movimientos, pagos }: { movimientos: MovimientoCuenta[]; pagos: PagoInformado[] }) {
  const [todos, setTodos] = useState(false);
  const lista = todos ? movimientos : movimientos.slice(0, VISIBLES);
  if (movimientos.length === 0 && pagos.length === 0) return null;

  return (
    <Tarjeta style={{ gap: 10 }}>
      {pagos.length > 0 && (
        <View style={{ gap: 8, paddingBottom: 10, borderBottomWidth: movimientos.length > 0 ? 1 : 0, borderBottomColor: colors.lineSoft }}>
          <T v="etiqueta">Pagos que informaste</T>
          {pagos.map((p) => (
            <View key={p.id} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T style={{ flex: 1, fontSize: 14 }}>{fechaCorta(p.fecha)} · {precio(p.monto)}</T>
                <Insignia {...ESTADO_PAGO[p.estado]} />
              </View>
              {p.estado === 'rechazado' && p.motivoRechazo ? <T v="chico" style={{ fontSize: 12 }}>Motivo: {p.motivoRechazo}</T> : null}
            </View>
          ))}
        </View>
      )}

      {movimientos.length > 0 && (
        <>
          <T v="etiqueta">Últimos movimientos</T>
          {lista.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: m.tipo === 'pago' ? colors.okSoft : colors.lineSoft }}>
                <Icono name={m.tipo === 'pago' ? 'cash-check' : 'receipt-text-outline'} size={18} color={m.tipo === 'pago' ? colors.okInk : colors.inkSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 14 }} numberOfLines={1}>{m.descripcion}</T>
                <T v="chico" style={{ fontSize: 12 }}>{fechaCorta(m.fecha)}</T>
              </View>
              <T v="fuerte" style={{ fontSize: 14, color: m.tipo === 'pago' ? colors.okInk : colors.ink }}>
                {m.tipo === 'pago' ? '−' : ''}{precio(m.monto)}
              </T>
            </View>
          ))}
          {movimientos.length > VISIBLES && (
            <Boton variante="borde" chico onPress={() => setTodos((t) => !t)}>
              {todos ? 'Ver menos' : `Ver todos (${movimientos.length})`}
            </Boton>
          )}
        </>
      )}
    </Tarjeta>
  );
}

function Chip({ texto, activo, accent, onPress }: { texto: string; activo: boolean; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={{ paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: activo ? accent : colors.line, backgroundColor: activo ? tint(accent, 0.1) : colors.card }}
    >
      <T style={{ fontSize: 14, fontFamily: activo ? fonts.bodySemi : fonts.body, color: activo ? accent : colors.inkSoft }}>{texto}</T>
    </Pressable>
  );
}

export function HojaInformarPago({
  visible,
  slug,
  accent,
  transferencia,
  onCerrar,
}: {
  visible: boolean;
  slug: string;
  accent: string;
  transferencia?: DatosTransferencia | null;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const informar = useInformarPago(slug);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('transferencia');
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<{ uri: string; comprobante: NonNullable<InformarPago['comprobante']> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  // Al abrir arranca vacía (ajuste durante el render, no en un efecto).
  const [abierta, setAbierta] = useState(false);
  if (visible !== abierta) {
    setAbierta(visible);
    if (visible) {
      setMonto('');
      setMetodo('transferencia');
      setNota('');
      setFoto(null);
      setError(null);
      setEnviado(false);
    }
  }

  const elegirFoto = async (camara: boolean) => {
    setError(null);
    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.4, base64: true };
    if (camara) {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        setError('Necesitamos la cámara para sacar la foto. Podés elegirla de la galería.');
        return;
      }
    }
    const r = camara ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
    const a = r.canceled ? null : r.assets[0];
    if (!a?.base64) return;
    if (a.base64.length > MAX_BASE64) {
      setError('La foto es muy pesada. Probá con una captura de pantalla del comprobante.');
      return;
    }
    const tipo = a.mimeType === 'image/png' || a.mimeType === 'image/webp' ? a.mimeType : 'image/jpeg';
    setFoto({ uri: a.uri, comprobante: { base64: a.base64, tipo } });
  };

  const enviar = () => {
    const n = parseMonto(monto);
    if (!n) {
      setError('Escribí el monto que pagaste.');
      return;
    }
    setError(null);
    informar.mutate(
      { monto: n, metodo, nota: nota.trim() || undefined, comprobante: foto?.comprobante ?? null },
      { onSuccess: () => setEnviado(true), onError: (e) => setError(e.message) },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCerrar} style={{ flex: 1 }} />
        <View style={[anchoHoja, { maxHeight: '92%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
              <Icono name={enviado ? 'check-circle-outline' : 'cash-fast'} color={accent} size={26} />
            </View>
            {enviado ? (
              <>
                <View style={{ gap: 6 }}>
                  <T v="h1">Listo, avisamos tu pago</T>
                  <T v="chico" style={{ fontSize: 14 }}>La distribuidora lo va a revisar. Cuando lo acredite, se descuenta de tu saldo.</T>
                </View>
                <Boton color={accent} onPress={onCerrar}>Entendido</Boton>
              </>
            ) : (
              <>
                <View style={{ gap: 6 }}>
                  <T v="h1">Informar un pago</T>
                  <T v="chico" style={{ fontSize: 14 }}>Avisale a la distribuidora que pagaste. Se descuenta de tu saldo cuando lo verifiquen.</T>
                </View>

                <Campo etiqueta="Monto" value={monto} onChangeText={setMonto} placeholder="Ej.: 25.000" keyboardType="decimal-pad" returnKeyType="done" />
                <View style={{ gap: 6 }}>
                  <T v="etiqueta">¿Cómo pagaste?</T>
                  <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {METODOS.map((m) => (
                      <Chip key={m.clave} texto={m.texto} activo={metodo === m.clave} accent={accent} onPress={() => setMetodo(m.clave)} />
                    ))}
                  </View>
                </View>
                {metodo === 'transferencia' && transferencia && (
                  <View style={{ gap: 4, padding: 12, borderRadius: radius.md, backgroundColor: tint(accent, 0.06), borderWidth: 1, borderColor: tint(accent, 0.25) }}>
                    <T v="etiqueta">Datos para transferir</T>
                    <T v="fuerte" selectable style={{ fontSize: 16 }}>Alias: {transferencia.alias}</T>
                    {transferencia.titular ? <T v="chico" selectable>Titular: {transferencia.titular}</T> : null}
                    {transferencia.banco ? <T v="chico" selectable>Banco: {transferencia.banco}</T> : null}
                  </View>
                )}
                <Campo etiqueta="Nota (opcional)" value={nota} onChangeText={setNota} placeholder="Ej.: transferí desde Banco Nación" maxLength={300} />

                <View style={{ gap: 6 }}>
                  <T v="etiqueta">Comprobante (opcional)</T>
                  {foto ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Image source={{ uri: foto.uri }} style={{ width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line }} contentFit="cover" accessibilityLabel="Foto del comprobante" />
                      <Boton variante="borde" chico icono="close" onPress={() => setFoto(null)}>Quitar foto</Boton>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {Platform.OS !== 'web' && (
                        <Boton variante="suave" color={accent} chico icono="camera-outline" onPress={() => elegirFoto(true)} style={{ flex: 1 }}>
                          Sacar foto
                        </Boton>
                      )}
                      <Boton variante="suave" color={accent} chico icono="image-outline" onPress={() => elegirFoto(false)} style={{ flex: 1 }}>
                        Elegir imagen
                      </Boton>
                    </View>
                  )}
                </View>

                {error && <Aviso texto={error} />}
                <Boton color={accent} icono="send" onPress={enviar} cargando={informar.isPending}>
                  Enviar aviso de pago
                </Boton>
                <Boton variante="borde" onPress={onCerrar} disabled={informar.isPending}>
                  Cancelar
                </Boton>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
