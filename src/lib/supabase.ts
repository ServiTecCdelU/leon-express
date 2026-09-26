// Cliente de Supabase SOLO para Auth (login por OTP). Los datos van siempre por la
// API del SaaS (/api/app/v1): la app nunca lee tablas directo.
// Setup según https://docs.expo.dev/guides/using-supabase (SDK 57).
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { almacen } from '@/lib/almacen';
import { env } from '@/lib/env';

export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: almacen,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
