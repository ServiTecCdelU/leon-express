// Publicidad de ServiTec al pie de la pantalla Cuenta.
import { Linking, Pressable, View } from 'react-native';
import { Icono, T } from '@/components/ui';
import { ACCENT_DEFAULT, colors, fonts, radius } from '@/theme';

const TELEFONO_VISIBLE = '3442 646670';
const TELEFONO_E164 = '+5493442646670';
const WHATSAPP = 'https://wa.me/5493442646670?text=' + encodeURIComponent('Hola ServiTec, quiero información sobre el Sistema de Gestión.');

export function PieServiTec() {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: ACCENT_DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontFamily: fonts.display, color: colors.white, fontSize: 14 }}>S</T>
        </View>
        <T style={{ fontFamily: fonts.display, fontSize: 16 }}>ServiTec</T>
      </View>
      <T v="chico" style={{ textAlign: 'center' }}>Sistemas de Gestión</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Escribir a ServiTec por WhatsApp"
          onPress={() => Linking.openURL(WHATSAPP)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 })}
        >
          <Icono name="whatsapp" size={18} color="#16a34a" />
          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 13 }}>{TELEFONO_VISIBLE}</T>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Llamar a ServiTec"
          onPress={() => Linking.openURL(`tel:${TELEFONO_E164}`)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 })}
        >
          <Icono name="phone-outline" size={18} color={colors.inkSoft} />
          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 13 }}>Llamar</T>
        </Pressable>
      </View>
    </View>
  );
}
