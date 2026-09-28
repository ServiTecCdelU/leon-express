import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import type { ColorValue } from 'react-native';
import { RecordatorioRegistro } from '@/components/registro';
import { Icono, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useCarrito } from '@/state/carrito';
import { useRegistroStore } from '@/state/registro';
import { colors, fonts } from '@/theme';

const icono = (name: IconName) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icono name={name} color={color} size={22} />;
  };

export default function TabsLayout() {
  const { slug, accent, visitante, conSesion } = useComercioActivo();
  const carrito = useCarrito(slug);
  const lineas = Object.keys(carrito).length;
  const recordarSiToca = useRegistroStore((s) => s.recordarSiToca);

  useEffect(() => {
    if (visitante) recordarSiToca();
  }, [visitante, recordarSiToca]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 80, paddingTop: 6 },
          tabBarBadgeStyle: { backgroundColor: accent, fontFamily: fonts.bodySemi, fontSize: 11 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('view-dashboard-outline') }} />
        <Tabs.Screen name="catalogo" options={{ title: 'Productos', tabBarIcon: icono('package-variant-closed') }} />
        <Tabs.Screen
          name="pedido"
          options={{ title: 'Carrito', tabBarIcon: icono('cart-outline'), tabBarBadge: lineas > 0 ? lineas : undefined }}
        />
        <Tabs.Screen name="pedidos" options={{ title: 'Pedidos', tabBarIcon: icono('clipboard-list-outline') }} />
        <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', tabBarIcon: icono('wallet-outline') }} />
      </Tabs>
      {visitante && <RecordatorioRegistro conSesion={conSesion} accent={accent} />}
    </>
  );
}
