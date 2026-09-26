// Ingreso con código (SMS o email), con el estilo del login del panel: tarjeta centrada.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Icono, T, Tarjeta } from '@/components/ui';
import { useComercioPublico } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { celularE164 } from '@/lib/telefono';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT, colors, fonts, radius, tint } from '@/theme';

type Medio = 'sms' | 'email';

// Largo del código que manda Supabase Auth: SMS 6 dígitos, email 8 (mailer_otp_length).
const LARGO_CODIGO: Record<Medio, number> = { sms: 6, email: 8 };

const inputStyle = {
  height: 48,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: colors.card,
  paddingHorizontal: 12,
  fontSize: 16,
  fontFamily: fonts.body,
  color: colors.ink,
} as const;

export default function Ingresar() {
  const invitacion = useComercioStore((s) => s.invitacion);
  const marca = useComercioPublico(invitacion?.slug);
  const accent = marca.data?.colorPrimario || ACCENT_DEFAULT;

  const [medio, setMedio] = useState<Medio>('sms');
  const [contacto, setContacto] = useState('');
  const [destino, setDestino] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const largo = LARGO_CODIGO[medio];

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

  const cambiarMedio = () => {
    setMedio(medio === 'sms' ? 'email' : 'sms');
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="storefront-outline" color={colors.white} size={26} />
            </View>
            <T v="titulo" style={{ textAlign: 'center' }}>{marca.data?.nombre ?? 'Pedidos ServiTec'}</T>
            <T v="chico" style={{ textAlign: 'center', fontSize: 14 }}>
              {invitacion ? 'Tu vendedor te invitó a hacer los pedidos desde el celular.' : 'Hacé tus pedidos, mirá su estado y tu cuenta corriente.'}
            </T>
          </View>

          <Tarjeta style={{ gap: 14, padding: 20 }}>
            {!destino ? (
              <>
                <View style={{ gap: 4 }}>
                  <T v="h2">Ingresar</T>
                  <T v="chico">{medio === 'sms' ? 'Te mandamos un código por SMS. Sin contraseñas.' : 'Te mandamos un código por email.'}</T>
                </View>
                <View style={{ gap: 6 }}>
                  <T v="fuerte" style={{ fontSize: 14 }}>{medio === 'sms' ? 'Celular' : 'Email'}</T>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {medio === 'sms' && (
                      <View style={[inputStyle, { justifyContent: 'center', backgroundColor: colors.lineSoft }]}>
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
                      style={[inputStyle, { flex: 1 }]}
                    />
                  </View>
                </View>
                {error && <Aviso texto={error} />}
                <Boton color={accent} onPress={enviarCodigo} cargando={enviando}>
                  Enviarme el código
                </Boton>
                <Pressable accessibilityRole="button" onPress={cambiarMedio} style={{ alignSelf: 'center', padding: 6 }}>
                  <T style={{ color: accent, fontFamily: fonts.bodyMedium, fontSize: 14 }}>
                    {medio === 'sms' ? 'Ingresar con email' : 'Ingresar con el celular'}
                  </T>
                </Pressable>
              </>
            ) : (
              <>
                <View style={{ gap: 4 }}>
                  <T v="h2">Código de {largo} dígitos</T>
                  <T v="chico">Lo mandamos a {destino}</T>
                </View>
                <TextInput
                  accessibilityLabel="Código de verificación"
                  value={codigo}
                  onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, largo))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={largo}
                  autoFocus
                  style={[inputStyle, { height: 56, textAlign: 'center', letterSpacing: 10, fontFamily: fonts.display, fontSize: 24, borderColor: accent }]}
                />
                {error && <Aviso texto={error} />}
                <Boton color={accent} onPress={verificar} cargando={enviando} disabled={codigo.length < largo}>
                  Ingresar
                </Boton>
                <Pressable accessibilityRole="button" onPress={() => { setDestino(null); setCodigo(''); setError(null); }} style={{ alignSelf: 'center', padding: 6 }}>
                  <T style={{ color: accent, fontFamily: fonts.bodyMedium, fontSize: 14 }}>Cambiar {medio === 'sms' ? 'número' : 'email'}</T>
                </Pressable>
              </>
            )}
          </Tarjeta>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: tint(accent, 0.06) }}>
            <Icono name={invitacion ? 'check-circle-outline' : 'qrcode'} color={accent} size={18} />
            <T v="chico" style={{ flex: 1 }}>
              {invitacion ? 'Invitación lista: al ingresar, tu comercio queda vinculado.' : '¿Primera vez? Pedile a tu vendedor el QR de tu comercio.'}
            </T>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
