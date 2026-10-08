// Texto del comprobante de un pedido para compartir (WhatsApp, mail, etc.).
import { precio } from '@/lib/format';
import type { EstadoPedido, PedidoResumen } from '@/lib/tipos';

const ESTADO_TEXTO: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  preparando: 'En preparación',
  en_camino: 'En reparto',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function textoComprobante(pedido: PedidoResumen, distribuidora: string | null | undefined): string {
  const fecha = new Date(pedido.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const titulo = pedido.numero ? `Pedido N° ${pedido.numero}` : 'Pedido';
  const lineas = pedido.items.filter((i) => i.cantidad > 0).map((i) => `• ${i.cantidad} x ${i.nombre}`);
  return [
    `*${titulo}*${distribuidora ? ` — ${distribuidora}` : ''}`,
    `Fecha: ${fecha}`,
    `Estado: ${ESTADO_TEXTO[pedido.estado]}`,
    '',
    ...lineas,
    '',
    `*Total: ${precio(pedido.total)}*`,
  ].join('\n');
}
