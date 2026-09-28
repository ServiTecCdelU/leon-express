// Logueado pero sin distribuidora elegida: escanear su QR o pegar su link. Con eso el
// layout de (app) hace el alta automática. Un link de invitación viejo (?inv=) también sirve.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Icono, T, Tarjeta } from '@/components/ui';
import { parseQrDistribuidora } from '@/lib/qr-distribuidora';
import { useCanjearInvitacion } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT, colors, fonts, radius, tint } from '@/theme';

export default function SinComercio() {
  const { error: errorInicial } = useLocalSearchParams<{ error?: string }>();
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState<string | null>(errorInicial || null);
  const canjear = useCanjearInvitacion();
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const setDistribuidora = useComercioStore((s) => s.setDistribuidora);

  const vincular = () => {
    const qr = parseQrDistribuidora(texto);
    if (!qr) {
      setAviso('Eso no parece el link de una distribuidora. Copialo completo.');
      return;
    }
    setAviso(null);
    if (qr.tipo === 'distribuidora') {
      setDistribuidora(qr.slug);
      return;
    }
    canjear.mutate(qr.token, {
      onSuccess: (r) => setSlugActivo(r.slug),
      onError: (e) => setAviso(e.message),
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(ACCENT_DEFAULT), alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="store-plus-outline" size={26} color={ACCENT_DEFAULT} />
        </View>
        <View style={{ gap: 6 }}>
          <T v="h1">Elegí tu distribuidora</T>
          <T v="chico" style={{ fontSize: 14 }}>
            Escaneá el QR de tu distribuidora o pegá su link. Quedás registrado como cliente al instante.
          </T>
        </View>

        <Boton icono="qrcode-scan" onPress={() => router.push('/escanear-qr')}>
          Escanear QR de la distribuidora
        </Boton>

        <Tarjeta style={{ gap: 12 }}>
          <T v="fuerte" style={{ fontSize: 14 }}>Link de la distribuidora</T>
          <TextInput
            accessibilityLabel="Link de la distribuidora"
            value={texto}
            onChangeText={setTexto}
            placeholder="https://…/app/demo"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, fontSize: 15, fontFamily: fonts.body, color: colors.ink, backgroundColor: colors.card }}
          />
          {aviso ? <Aviso texto={aviso} /> : null}
          <Boton icono="link-variant" onPress={vincular} cargando={canjear.isPending} disabled={!texto.trim()}>
            Continuar
          </Boton>
        </Tarjeta>

        {router.canGoBack() ? (
          <Boton variante="borde" onPress={() => router.back()}>
            Volver
          </Boton>
        ) : (
          <Boton variante="borde" icono="logout" onPress={() => supabase.auth.signOut()}>
            Salir
          </Boton>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
