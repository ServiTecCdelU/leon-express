import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Icono, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useCarrito } from '@/state/carrito';
import { colors, fonts } from '@/theme';

const icono = (name: IconName) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icono name={name} color={color} size={24} />;
  };

export default function TabsLayout() {
  const { slug, accent } = useComercioActivo();
  const carrito = useCarrito(slug);
  const lineas = Object.keys(carrito).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: '#E6E2D8', height: 84, paddingTop: 8 },
        tabBarBadgeStyle: { backgroundColor: colors.offer, fontFamily: fonts.bodyBold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('home-outline') }} />
      <Tabs.Screen name="catalogo" options={{ title: 'Catálogo', tabBarIcon: icono('view-grid-outline') }} />
      <Tabs.Screen
        name="pedido"
        options={{ title: 'Pedido', tabBarIcon: icono('cart-outline'), tabBarBadge: lineas > 0 ? lineas : undefined }}
      />
      <Tabs.Screen name="pedidos" options={{ title: 'Mis pedidos', tabBarIcon: icono('truck-delivery-outline') }} />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', tabBarIcon: icono('wallet-outline') }} />
    </Tabs>
  );
}
