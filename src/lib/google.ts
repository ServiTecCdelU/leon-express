// Ingreso con Google vía Supabase (PKCE). En el celular abre el navegador del sistema y
// vuelve por servitecpedidos://auth/callback; en web redirige la página completa y vuelve
// a /auth/callback, que canjea el código (ver src/app/auth/callback.tsx).
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const RUTA_CALLBACK = 'auth/callback';

export async function canjearCodigoDeUrl(url: string): Promise<void> {
  const params = new URL(url).searchParams;
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error(error);
  const code = params.get('code');
  if (!code) throw new Error('Google no devolvió el código de ingreso.');
  const { error: e } = await supabase.auth.exchangeCodeForSession(code);
  if (e) throw e;
}

/** Devuelve false si la persona cerró la ventana de Google sin ingresar. */
export async function ingresarConGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL(RUTA_CALLBACK);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) throw error;
  if (Platform.OS === 'web') return true;

  const r = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (r.type !== 'success') return false;
  await canjearCodigoDeUrl(r.url);
  return true;
}
