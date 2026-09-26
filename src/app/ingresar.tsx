// Pantalla 1 del diseño: invitación + ingreso con código por SMS (o email como alternativa).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { useComercioPublico } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { celularE164 } from '@/lib/telefono';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT, colors, fonts, radius, tint } from '@/theme';

type Medio = 'sms' | 'email';

// Largo del código que manda Supabase Auth: SMS 6 dígitos, email 8 (mailer_otp_length).
const LARGO_CODIGO: Record<Medio, number> = { sms: 6, email: 8 };

const inputStyle = {
  height: 56,
  borderRadius: radius.md,
  borderWidth: 1.5,
  borderColor: colors.line,
  backgroundColor: colors.card,
  paddingHorizontal: 16,
  fontSize: 18,
  fontFamily: fonts.bodySemi,
  color: colors.ink,
} as const;

export default function Ingresar() {
  const invitacion = useComercioStore((s) => s.invitacion);
  const marca = useComercioPublico(invitacion?.slug);
  const accent = marca.data?.colorPrimario || ACCENT_DEFAULT;

  const [medio, setMedio] = useState<Medio>('sms');
  const [contacto, setContacto] = useState('');
  const [destino, setDestino] = useState<string | null>(null); // teléfono E.164 o email al que se mandó el código
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarCodigo = async () => {
    setError(null);
    const valor = medio === 'sms' ? celularE164(contacto) : contacto.trim().toLowerCase();
    if (!valor || (medio === 'email' && !/^\S+@\S+\.\S+$/.test(valor))) {
      setError(medio === 'sms' ? 'Revisá el número: código de área + número, sin 0 ni 15.' : 'Revisá el email.');
      return;
    }
    setEnviando(true);
    const { error: e } =
      medio === 'sms'
        ? await supabase.auth.signInWithOtp({ phone: valor })
        : await supabase.auth.signInWithOtp({ email: valor, options: { shouldCreateUser: true } });
    setEnviando(false);
    if (e) {
      setError('No pudimos mandar el código. Esperá un minuto y probá de nuevo.');
      return;
    }
    setDestino(valor);
  };

  const largo = LARGO_CODIGO[medio];

  const verificar = async () => {
    if (!destino || codigo.length < largo) return;
    setError(null);
    setEnviando(true);
    const { error: e } =
      medio === 'sms'
        ? await supabase.auth.verifyOtp({ phone: destino, token: codigo, type: 'sms' })
        : await supabase.auth.verifyOtp({ email: destino, token: codigo, type: 'email' });
    setEnviando(false);
    // Con sesión, el layout raíz lleva solo a la app (Stack.Protected).
    if (e) setError('El código no es correcto o venció.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ backgroundColor: accent, paddingHorizontal: 24, paddingBottom: 72 }}>
          <SafeAreaView edges={['top']}>
            <View style={{ paddingTop: 24, gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ fontFamily: fonts.display, fontSize: 24, color: accent }}>
                    {(marca.data?.nombre ?? 'S').charAt(0).toUpperCase()}
                  </T>
                </View>
                <View>
                  <T style={{ color: colors.white, opacity: 0.85, fontSize: 13 }}>Distribuidora</T>
                  <T v="h2" style={{ color: colors.white, fontSize: 20 }}>
                    {marca.data?.nombre ?? 'Pedidos ServiTec'}
                  </T>
                </View>
              </View>
              <T v="titulo" style={{ color: colors.white, fontSize: 34, lineHeight: 36 }}>
                {invitacion ? 'Tu vendedor te invitó a pedir desde el celular' : 'Hacé tus pedidos desde el celular'}
              </T>
              <T style={{ color: colors.white, opacity: 0.9 }}>
                Catálogo con tus precios, seguimiento del pedido y tu cuenta corriente.
              </T>
            </View>
          </SafeAreaView>
        </View>

        <View style={{ marginTop: -44, marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 22, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center', shadowColor: colors.ink, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
            <Icono name={invitacion ? 'storefront-outline' : 'qrcode-scan'} color={accent} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="etiqueta" style={{ color: colors.muted }}>{invitacion ? 'Invitación lista' : 'Sin invitación'}</T>
            <T v="fuerte">
              {invitacion
                ? 'Al ingresar, tu comercio queda vinculado'
                : 'Si ya tenés cuenta, ingresá. Si no, pedile el QR a tu vendedor.'}
            </T>
          </View>
        </View>

        <View style={{ padding: 24, gap: 14 }}>
          {!destino ? (
            <>
              <T v="fuerte">{medio === 'sms' ? 'Tu número de celular' : 'Tu email'}</T>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {medio === 'sms' && (
                  <View style={[inputStyle, { justifyContent: 'center' }]}>
                    <T v="fuerte">+54</T>
                  </View>
                )}
                <TextInput
                  accessibilityLabel={medio === 'sms' ? 'Número de celular' : 'Email'}
                  value={contacto}
                  onChangeText={setContacto}
                  placeholder={medio === 'sms' ? '11 5555-0000' : 'nombre@comercio.com'}
                  placeholderTextColor={colors.muted}
                  keyboardType={medio === 'sms' ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  autoComplete={medio === 'sms' ? 'tel' : 'email'}
                  style={[inputStyle, { flex: 1, borderColor: accent }]}
                />
              </View>
              <T v="chico">
                {medio === 'sms' ? 'Te mandamos un código por SMS. Sin contraseñas.' : 'Te mandamos un código por email.'}
              </T>
              {error && <Aviso texto={error} />}
              <Boton onPress={enviarCodigo} cargando={enviando}>
                Enviarme el código
              </Boton>
              <Pressable accessibilityRole="button" onPress={() => { setMedio(medio === 'sms' ? 'email' : 'sms'); setError(null); }} style={{ alignSelf: 'center', padding: 10 }}>
                <T v="fuerte" style={{ color: accent }}>
                  {medio === 'sms' ? 'Prefiero ingresar con email' : 'Prefiero ingresar con el celular'}
                </T>
              </Pressable>
            </>
          ) : (
            <>
              <T v="fuerte">Código de {largo} dígitos</T>
              <T v="chico">Lo mandamos a {destino}</T>
              <TextInput
                accessibilityLabel="Código de verificación"
                value={codigo}
                onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, largo))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={largo}
                autoFocus
                style={[inputStyle, { borderColor: accent, textAlign: 'center', letterSpacing: 12, fontFamily: fonts.display, fontSize: 26 }]}
              />
              {error && <Aviso texto={error} />}
              <Boton onPress={verificar} cargando={enviando} disabled={codigo.length < largo}>
                Entrar a mi cuenta
              </Boton>
              <Pressable accessibilityRole="button" onPress={() => { setDestino(null); setCodigo(''); setError(null); }} style={{ alignSelf: 'center', padding: 10 }}>
                <T v="fuerte" style={{ color: accent }}>Cambiar {medio === 'sms' ? 'número' : 'email'}</T>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
