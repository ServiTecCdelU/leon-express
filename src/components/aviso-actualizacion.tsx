// Cartel "Hay una nueva versión": compara el versionCode instalado con el que publica el SaaS
// (Superadmin → App). Si la instalada es más vieja que la última, avisa y se puede cerrar
// ("Más tarde", vuelve a aparecer al abrir la app de nuevo). Si es más vieja que la mínima,
// no se puede cerrar: hay que actualizar. En la web no aparece (no hay versión instalada).
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Modal, View } from 'react-native';
import { anchoHoja } from '@/components/marco-app';
import { Boton, Icono, T } from '@/components/ui';
import { useVersionApp } from '@/lib/queries';
import { estadoVersion, versionInstalada } from '@/lib/version-app';
import { colors, radius, tarjetaBase, tint } from '@/theme';

/** Qué app es (una fila en app_versiones del SaaS). Se configura en app.json → extra.appId. */
const APP_ID: string | undefined = Constants.expoConfig?.extra?.appId;
const INSTALADA = versionInstalada(Application.nativeBuildVersion);

async function abrirTienda(urlTienda: string | null) {
  const id = Application.applicationId;
  // Primero la app de Play Store; si no abre, el link web.
  const intentos = [id ? `market://details?id=${id}` : null, urlTienda, id ? `https://play.google.com/store/apps/details?id=${id}` : null];
  for (const url of intentos) {
    if (!url) continue;
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // probar el siguiente
    }
  }
}

export function AvisoActualizacion() {
  const version = useVersionApp(APP_ID, INSTALADA !== null);
  const [cerrado, setCerrado] = useState(false);
  const estado = estadoVersion(INSTALADA, version.data);
  const obligatoria = estado === 'obligatoria';

  if (estado === 'al-dia' || (cerrado && !obligatoria)) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => !obligatoria && setCerrado(true)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={[tarjetaBase, anchoHoja, { padding: 20, gap: 14, borderRadius: radius.lg }]}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(colors.tealInk, 0.1), alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="cellphone-arrow-down" size={26} color={colors.tealInk} />
          </View>
          <View style={{ gap: 6 }}>
            <T v="h2">Hay una nueva versión de {Constants.expoConfig?.name ?? 'la app'}</T>
            <T v="chico" style={{ fontSize: 14, lineHeight: 20 }}>
              {obligatoria
                ? 'Para seguir haciendo pedidos tenés que actualizar la app. Es gratis y tarda un minuto.'
                : 'Actualizala para tener las últimas mejoras y que todo funcione bien.'}
            </T>
          </View>
          <View style={{ gap: 8 }}>
            <Boton icono="google-play" onPress={() => abrirTienda(version.data?.urlTienda ?? null)}>
              Actualizar
            </Boton>
            {!obligatoria && (
              <Boton variante="borde" onPress={() => setCerrado(true)}>
                Más tarde
              </Boton>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
