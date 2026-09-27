// Hooks de datos (TanStack Query) sobre /api/app/v1.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Comercio,
  Cotizacion,
  Cuenta,
  Me,
  PaginaCatalogo,
  PedidoCreado,
  OfertaApp,
  PedidoResumen,
} from '@/lib/tipos';

const PAGE_SIZE = 20;

export const qk = {
  me: ['me'] as const,
  comercio: (slug: string) => ['comercio', slug] as const,
  catalogo: (slug: string, q: string, rubro: string) => ['catalogo', slug, q, rubro] as const,
  rubros: (slug: string) => ['rubros', slug] as const,
  ofertas: (slug: string) => ['ofertas', slug] as const,
  cotizacion: (slug: string, clave: string) => ['cotizacion', slug, clave] as const,
  pedidos: (slug: string) => ['pedidos', slug] as const,
  cuenta: (slug: string) => ['cuenta', slug] as const,
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: qk.me, queryFn: () => api<Me>('/me'), enabled });
}

/** Marca pública de la distribuidora (pantalla de invitación, sin sesión). */
export function useComercioPublico(slug: string | undefined) {
  return useQuery({
    queryKey: qk.comercio(slug ?? ''),
    queryFn: () => api<Omit<Comercio, never>>(`/comercios/${encodeURIComponent(slug!)}`, { auth: false }),
    enabled: !!slug,
    retry: false,
  });
}

export function useCatalogo(slug: string, q: string, rubro: string, soloOfertas = false) {
  return useInfiniteQuery({
    queryKey: [...qk.catalogo(slug, q, rubro), soloOfertas],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), pageSize: String(PAGE_SIZE) });
      if (q) params.set('q', q);
      if (rubro) params.set('rubro', rubro);
      if (soloOfertas) params.set('soloOfertas', '1');
      return api<PaginaCatalogo>(`/comercios/${slug}/catalogo?${params}`);
    },
    getNextPageParam: (ultima) => (ultima.page < ultima.totalPages ? ultima.page + 1 : undefined),
  });
}

export function useOfertas(slug: string) {
  return useQuery({
    queryKey: qk.ofertas(slug),
    queryFn: () => api<OfertaApp[]>(`/comercios/${slug}/ofertas`),
    staleTime: 5 * 60_000,
  });
}

export function useRubros(slug: string) {
  return useQuery({
    queryKey: qk.rubros(slug),
    queryFn: () => api<string[]>(`/comercios/${slug}/rubros`),
    staleTime: 10 * 60_000,
  });
}

export function useCotizacion(slug: string, items: { productId: string; quantity: number }[]) {
  const clave = items.map((i) => `${i.productId}:${i.quantity}`).sort().join('|');
  return useQuery({
    queryKey: qk.cotizacion(slug, clave),
    queryFn: () => api<Cotizacion>(`/comercios/${slug}/cotizar`, { method: 'POST', body: { items } }),
    enabled: items.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function usePedidos(slug: string) {
  return useQuery({
    queryKey: qk.pedidos(slug),
    queryFn: () => api<PedidoResumen[]>(`/comercios/${slug}/pedidos`),
    refetchInterval: 60_000,
  });
}

export function useCuenta(slug: string) {
  return useQuery({ queryKey: qk.cuenta(slug), queryFn: () => api<Cuenta>(`/comercios/${slug}/cuenta`) });
}

export function useCrearPedido(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { items: { productId: string; quantity: number }[]; clientRequestId: string; notas?: string }) =>
      api<PedidoCreado>(`/comercios/${slug}/pedidos`, { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pedidos(slug) });
      qc.invalidateQueries({ queryKey: qk.cuenta(slug) });
    },
  });
}

export function useCanjearInvitacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api<{ slug: string; nombre: string }>('/invitaciones/canjear', { method: 'POST', body: { token } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}
