import { Insignia } from '@/components/ui';
import type { EstadoPedido } from '@/lib/tipos';
import { colors } from '@/theme';

export const ESTADOS: { clave: EstadoPedido; titulo: string; detalle: string }[] = [
  { clave: 'recibido', titulo: 'Recibido', detalle: 'La distribuidora ya tiene tu pedido' },
  { clave: 'preparando', titulo: 'Preparando', detalle: 'Lo están armando; ya no se puede editar' },
  { clave: 'en_camino', titulo: 'En reparto', detalle: 'Salió con el reparto de tu zona' },
  { clave: 'entregado', titulo: 'Entregado', detalle: 'Llegó a tu comercio' },
];

const ESTILO: Record<EstadoPedido, { texto: string; bg: string; fg: string }> = {
  recibido: { texto: 'Recibido', bg: '#E0F2FE', fg: '#075985' },
  preparando: { texto: 'Preparando', bg: colors.amberSoft, fg: colors.amberInk },
  en_camino: { texto: 'En reparto', bg: '#EDE9FE', fg: '#5B21B6' },
  entregado: { texto: 'Entregado', bg: colors.okSoft, fg: colors.okInk },
  cancelado: { texto: 'Cancelado', bg: colors.lineSoft, fg: colors.inkSoft },
};

export function EstadoPedidoInsignia({ estado, retenido }: { estado: EstadoPedido; retenido?: boolean }) {
  if (retenido && estado === 'recibido') return <Insignia texto="En revisión" bg={colors.offerSoft} fg={colors.offerInk} />;
  const e = ESTILO[estado];
  return <Insignia texto={e.texto} bg={e.bg} fg={e.fg} />;
}
