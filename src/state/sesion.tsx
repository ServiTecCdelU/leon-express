// Sesión de Supabase Auth expuesta a toda la app.
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface SesionValue {
  session: Session | null;
  cargando: boolean;
}

const SesionContext = createContext<SesionValue>({ session: null, cargando: true });

export function SesionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SesionValue>({ session: null, cargando: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setValue({ session: data.session, cargando: false }));
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => setValue({ session, cargando: false }));
    return () => data.subscription.unsubscribe();
  }, []);

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);
