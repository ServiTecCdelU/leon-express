// Logo de la distribuidora (se carga en el superadmin del SaaS). Sin logo, o si no carga,
// cuadrado del color de la marca con la inicial del nombre (sin nombre todavía: ícono de negocio).
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { Icono, T } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

export function LogoMarca({
  nombre,
  logoUrl,
  color,
  size = 36,
}: {
  nombre: string;
  logoUrl?: string | null;
  color: string;
  size?: number;
}) {
  // Se guarda la URL que falló (no un booleano) por si cambia la distribuidora.
  const [fallida, setFallida] = useState<string | null>(null);
  const redondeo = size >= 48 ? radius.lg : radius.md;

  if (logoUrl && logoUrl !== fallida) {
    return (
      <View style={{ width: size, height: size, borderRadius: redondeo, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
        <Image
          source={{ uri: logoUrl }}
          style={{ flex: 1, margin: 2 }}
          contentFit="contain"
          accessibilityLabel={`Logo de ${nombre}`}
          onError={() => setFallida(logoUrl)}
        />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: redondeo, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      {nombre.trim() ? (
        <T style={{ fontFamily: fonts.display, color: colors.white, fontSize: Math.round(size * 0.44) }}>{nombre.trim().charAt(0).toUpperCase()}</T>
      ) : (
        <Icono name="storefront-outline" size={Math.round(size * 0.55)} color={colors.white} />
      )}
    </View>
  );
}
