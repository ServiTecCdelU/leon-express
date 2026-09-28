// En web (computadora) la app se muestra en un marco del ancho de un celular, centrado,
// en vez de estirarse a toda la pantalla. En el celular no cambia nada.
import type { ReactNode } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { colors } from '@/theme';

export const ANCHO_CELULAR = 430;

const esWeb = Platform.OS === 'web';

/** Ancho útil de la app: el de la ventana, tope ANCHO_CELULAR en web. */
export function useAnchoApp(): number {
  const { width } = useWindowDimensions();
  return esWeb ? Math.min(width, ANCHO_CELULAR) : width;
}

export function MarcoCelular({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (!esWeb || width <= ANCHO_CELULAR) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: '#E7E5E4', alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: ANCHO_CELULAR,
          backgroundColor: colors.bg,
          overflow: 'hidden',
          shadowColor: colors.ink,
          shadowOpacity: 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Para contenido de Modal (que en web se dibuja sobre toda la ventana): centrado al ancho del celular. */
export const anchoModalWeb = esWeb ? ({ width: '100%', maxWidth: ANCHO_CELULAR, alignSelf: 'center' } as const) : null;
