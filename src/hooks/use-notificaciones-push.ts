// Con cuenta vinculada: registra el celular para los avisos de pedidos (una vez por
// cuenta) y, al tocar una notificación, abre ese pedido en su distribuidora.
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { datosPedido, registrarDispositivo } from '@/lib/notificaciones';
import { useComercioStore } from '@/state/comercio';
import { useSesion } from '@/state/sesion';

export function useNotificacionesPush(vinculado: boolean) {
  const { session } = useSesion();
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const qc = useQueryClient();
  const registradoPara = useRef<string | null>(null);
  const abierta = useRef<string | null>(null);
  const ultima = Notifications.useLastNotificationResponse();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!vinculado || !userId || registradoPara.current === userId) return;
    registradoPara.current = userId;
    // Sin permiso o sin conexión la app sigue igual; se reintenta en la próxima apertura.
    registrarDispositivo().catch(() => {
      registradoPara.current = null;
    });
  }, [vinculado, userId]);

  // Con la app abierta, un aviso de pedido refresca la lista (el estado cambió).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const d = datosPedido(n.request.content.data);
      if (d) qc.invalidateQueries({ queryKey: ['pedidos', d.slug] });
    });
    return () => sub.remove();
  }, [qc]);

  // Tocar el aviso (también con la app cerrada) abre el pedido.
  useEffect(() => {
    if (!vinculado || !ultima || ultima.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const d = datosPedido(ultima.notification.request.content.data);
    const id = ultima.notification.request.identifier;
    if (!d || abierta.current === id) return;
    abierta.current = id;
    setSlugActivo(d.slug);
    qc.invalidateQueries({ queryKey: ['pedidos', d.slug] });
    router.push({ pathname: '/pedidos/[id]', params: { id: d.pedidoId } });
  }, [vinculado, ultima, setSlugActivo, qc]);
}
