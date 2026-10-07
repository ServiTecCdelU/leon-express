// Hoja "Completá tu registro": después de ingresar con Google, antes del alta en la
// distribuidora del QR, se pide el nombre de la persona y el de su supermercado (la ficha
// del cliente se crea con ese nombre, no con el de la cuenta de Google).
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/datos-comercio';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { errorDatosAlta } from '@/lib/datos-comercio';
import { useAltaQr } from '@/lib/queries';
import { useSesion } from '@/state/sesion';
import { colors, radius, tint } from '@/theme';

/** Nombre que trae la cuenta de Google ('' si no trae). */
export function nombreDeGoogle(meta: Record<string, unknown> | undefined): string {
  const v = [meta?.full_name, meta?.name].find((x): x is string => typeof x === 'string' && x.trim() !== '');
  return v?.trim() ?? '';
}

export function HojaAlta({
  visible,
  slug,
  accent,
  onCerrar,
  onListo,
}: {
  visible: boolean;
  slug: string | null;
  accent: string;
  onCerrar: () => void;
  onListo: (slug: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { session } = useSesion();
  const alta = useAltaQr();
  const [nombre, setNombre] = useState('');
  const [negocio, setNegocio] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Al abrir se precarga el nombre de la cuenta de Google (ajuste durante el render, no en un efecto).
  const [abierto, setAbierto] = useState(false);
  if (visible !== abierto) {
    setAbierto(visible);
    if (visible) {
      setNombre((n) => n || nombreDeGoogle(session?.user.user_metadata));
      setError(null);
    }
  }

  const enviar = () => {
    if (!slug) return;
    const problema = errorDatosAlta({ nombre, negocio });
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    alta.mutate(
      { slug, nombre: nombre.trim(), negocio: negocio.trim() },
      { onSuccess: (r) => onListo(r.slug), onError: (e) => setError(e.message) },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCerrar} style={{ flex: 1 }} />
        <View style={[anchoHoja, { maxHeight: '90%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="account-check-outline" color={accent} size={26} />
            </View>
            <View style={{ gap: 6 }}>
              <T v="h1">Completá tu registro</T>
              <T v="chico" style={{ fontSize: 14 }}>Así te reconoce la distribuidora cuando hagas tus pedidos.</T>
            </View>

            <Campo etiqueta="Tu nombre" value={nombre} onChangeText={setNombre} placeholder="Ej.: Juan Pérez" autoCapitalize="words" autoComplete="name" returnKeyType="next" />
            <Campo etiqueta="Nombre del supermercado" value={negocio} onChangeText={setNegocio} placeholder="Ej.: Súper Don Pepe" autoCapitalize="words" returnKeyType="done" onSubmitEditing={enviar} />

            {error && <Aviso texto={error} />}
            <Boton color={accent} icono="check" onPress={enviar} cargando={alta.isPending}>
              Terminar registro
            </Boton>
            <Boton variante="borde" onPress={onCerrar} disabled={alta.isPending}>
              Ahora no
            </Boton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
