// Modo visitante: modal "Registrarme" y banner. Sin sesión lleva a Google (al volver, el
// alta en la distribuidora es automática); con sesión y sin alta todavía, la reintenta.
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { ingresarConGoogle } from '@/lib/google';
import { useAltaQr } from '@/lib/queries';
import { useComercioStore } from '@/state/comercio';
import { useRegistroStore } from '@/state/registro';
import { colors, fonts, radius, tint } from '@/theme';

function textos(conSesion: boolean) {
  return conSesion
    ? { titulo: 'Terminá tu registro', detalle: 'No pudimos completar tu alta en la distribuidora. Probá de nuevo.', corto: 'Falta terminar tu registro', accion: 'Completar registro' }
    : { titulo: 'Registrate', detalle: 'Con tu cuenta vas a ver tus precios, hacer pedidos y seguir tu cuenta corriente.', corto: 'Registrate para ver tus precios y pedir', accion: 'Registrarme con Google' };
}

function useAccionRegistro(conSesion: boolean) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cerrar = useRegistroStore((s) => s.cerrar);
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const alta = useAltaQr();

  const ejecutar = async () => {
    setError(null);
    if (conSesion) {
      if (!distribuidora) return;
      alta.mutate(distribuidora, { onSuccess: cerrar, onError: (e) => setError(e.message) });
      return;
    }
    setEnviando(true);
    try {
      if (await ingresarConGoogle()) cerrar();
    } catch {
      setError('No pudimos ingresar con Google. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };
  return { ejecutar, enviando: enviando || alta.isPending, error };
}

export function RecordatorioRegistro({ conSesion, accent }: { conSesion: boolean; accent: string }) {
  const { visible, motivo, cerrar } = useRegistroStore();
  const { ejecutar, enviando, error } = useAccionRegistro(conSesion);
  const t = textos(conSesion);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
      <Pressable accessibilityLabel="Cerrar" onPress={cerrar} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={[{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 14 }, anchoHoja]}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
            <Icono name={conSesion ? 'account-check-outline' : 'account-plus-outline'} color={accent} size={26} />
          </View>
          <View style={{ gap: 6 }}>
            <T v="h1">{t.titulo}</T>
            <T v="chico" style={{ fontSize: 14 }}>{motivo ?? t.detalle}</T>
          </View>
          {error && <Aviso texto={error} />}
          <Boton color={accent} icono={conSesion ? 'refresh' : 'google'} onPress={ejecutar} cargando={enviando}>
            {t.accion}
          </Boton>
          <Boton variante="borde" onPress={cerrar}>Ahora no</Boton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Tira de una línea arriba del inicio (el detalle va en la hoja que abre): no le quita lugar a las ofertas. */
export function BannerRegistro({ conSesion, accent }: { conSesion: boolean; accent: string }) {
  const abrir = useRegistroStore((s) => s.abrir);
  const t = textos(conSesion);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => abrir()}
      accessibilityLabel={`${t.corto}. ${conSesion ? 'Reintentar' : 'Registrarme'}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 12, paddingRight: 8, borderRadius: radius.md, backgroundColor: tint(accent, 0.08), borderWidth: 1, borderColor: tint(accent, 0.25), opacity: pressed ? 0.85 : 1 })}
    >
      <Icono name={conSesion ? 'account-check-outline' : 'account-plus-outline'} color={accent} size={20} />
      <T v="fuerte" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{t.corto}</T>
      <View style={{ backgroundColor: accent, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
        <T style={{ color: colors.white, fontFamily: fonts.bodySemi, fontSize: 13 }}>{conSesion ? 'Reintentar' : 'Registrarme'}</T>
      </View>
    </Pressable>
  );
}

