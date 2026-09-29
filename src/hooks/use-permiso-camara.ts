// Permiso de cámara para los escáneres. Si Android ya no deja volver a preguntar
// (el usuario lo negó), `habilitar` abre los Ajustes de la app; al volver a la app
// se revisa de nuevo para que la cámara arranque sola si lo activó.
import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { AppState, Linking } from 'react-native';

export function usePermisoCamara() {
  const [permiso, pedir, revisar] = useCameraPermissions();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });
    return () => sub.remove();
  }, [revisar]);

  const habilitar = async () => {
    if (permiso?.canAskAgain) {
      const r = await pedir();
      if (r.granted || r.canAskAgain) return;
    }
    await Linking.openSettings();
  };

  return { permiso, habilitar };
}
