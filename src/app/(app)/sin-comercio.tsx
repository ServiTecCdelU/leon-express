// Logueado pero sin comercio vinculado. El alta es por invitación: abrir el link/QR del
// vendedor o pegarlo acá (sirve también en Expo Go, que no abre el esquema propio).
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Boton, Icono, T, Tarjeta } from '@/components/ui';
import { tokenDeInvitacion } from '@/lib/invitacion';
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

  const vincular = () => {
    const token = tokenDeInvitacion(texto);
    if (!token) {
      setAviso('Eso no parece un link o código de invitación. Copialo completo del mensaje del vendedor.');
      return;
    }
    setAviso(null);
    canjear.mutate(token, {
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
          <T v="h1">Vinculá tu comercio</T>
          <T v="chico" style={{ fontSize: 14 }}>
            Tu vendedor te pasa un QR o un link de invitación. Abrilo desde este celular, o pegalo acá abajo.
          </T>
        </View>

        <Tarjeta style={{ gap: 12 }}>
          <T v="fuerte" style={{ fontSize: 14 }}>Link o código de invitación</T>
          <TextInput
            accessibilityLabel="Link o código de invitación"
            value={texto}
            onChangeText={setTexto}
            placeholder="https://…/a/demo?inv=…"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, fontSize: 15, fontFamily: fonts.body, color: colors.ink, backgroundColor: colors.card }}
          />
          {aviso ? <Aviso texto={aviso} /> : null}
          <Boton icono="link-variant" onPress={vincular} cargando={canjear.isPending} disabled={!texto.trim()}>
            Vincular comercio
          </Boton>
        </Tarjeta>

        <Boton variante="borde" icono="logout" onPress={() => supabase.auth.signOut()}>
          Salir
        </Boton>
      </ScrollView>
    </SafeAreaView>
  );
}
