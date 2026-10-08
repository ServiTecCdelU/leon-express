// "Eliminar mi cuenta" (exigencia de Play Store): explica qué se borra y qué conserva la
// distribuidora, y pide confirmar. Al terminar se cierra la sesión.
import { useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { env } from '@/lib/env';
import { eliminarCuenta } from '@/lib/notificaciones';
import { colors, fonts, radius } from '@/theme';

export const URL_PRIVACIDAD = `${env.apiUrl}/pdp`;

/** Links al pie de Mi cuenta: política de privacidad y eliminar la cuenta (si hay sesión). */
export function LinksCuenta({ conSesion }: { conSesion: boolean }) {
  const [eliminando, setEliminando] = useState(false);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingTop: 4 }}>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(URL_PRIVACIDAD)} hitSlop={8}>
        <T v="chico" style={{ textDecorationLine: 'underline' }}>Política de privacidad</T>
      </Pressable>
      {conSesion && (
        <Pressable accessibilityRole="button" onPress={() => setEliminando(true)} hitSlop={8}>
          <T v="chico" style={{ textDecorationLine: 'underline', color: colors.errorInk }}>Eliminar mi cuenta</T>
        </Pressable>
      )}
      <HojaEliminarCuenta visible={eliminando} onCerrar={() => setEliminando(false)} />
    </View>
  );
}

function HojaEliminarCuenta({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setError(null);
    setEnviando(true);
    try {
      // Al cerrarse la sesión la app vuelve sola al inicio: no hace falta navegar.
      await eliminarCuenta();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos eliminar tu cuenta. Probá de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable accessibilityLabel="Cerrar" onPress={enviando ? undefined : onCerrar} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={[{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 14 }, anchoHoja]}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="account-remove-outline" color={colors.errorInk} size={26} />
          </View>
          <View style={{ gap: 8 }}>
            <T v="h1">¿Eliminar tu cuenta?</T>
            <T v="chico" style={{ fontSize: 14 }}>
              Se borran tu cuenta de acceso (nombre, email y foto de Google) y el vínculo con tu distribuidora. No se puede deshacer.
            </T>
            <T v="chico" style={{ fontSize: 14 }}>
              Tus pedidos, pagos y saldo quedan en los registros de la distribuidora, que puede estar obligada a guardarlos. Si querés volver a usar la app, te registrás de nuevo.
            </T>
          </View>
          {error && <Aviso texto={error} />}
          <Boton color={colors.errorInk} icono="delete-outline" onPress={confirmar} cargando={enviando}>
            Sí, eliminar mi cuenta
          </Boton>
          <Boton variante="borde" onPress={onCerrar} disabled={enviando}>
            No, volver
          </Boton>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(URL_PRIVACIDAD)} style={{ alignSelf: 'center' }}>
            <T style={{ fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.inkSoft, textDecorationLine: 'underline' }}>Qué datos se conservan</T>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
