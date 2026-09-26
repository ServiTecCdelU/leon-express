// Tipos de las respuestas de /api/app/v1. Espejo de SaaS:
// services/app-pedidos-service.ts y services/app-invitaciones-service.ts.

export interface Comercio {
  slug: string;
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string | null;
}

export interface Me {
  telefono: string | null;
  comercios: Comercio[];
}

export interface ProductoApp {
  id: string;
  nombre: string;
  codigo: string;
  rubro: string;
  precio: number;
  unidadesPorBulto: number | null;
  seDivideEn: number | null;
  imageUrl: string | null;
}

export interface PaginaCatalogo {
  items: ProductoApp[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Credito {
  saldo: number;
  limite: number | null;
  disponible: number | null;
  clasificacion: string;
}

export interface LineaCotizada {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  unidadesPorBulto: number | null;
}

export interface Cotizacion {
  lineas: LineaCotizada[];
  total: number;
  lista: { id: string; nombre: string } | null;
  credito: Credito;
  retencion: string | null;
}

export interface PedidoCreado {
  pedidoId: string;
  retenido: boolean;
  mensaje: string | null;
  duplicado: boolean;
}

export type EstadoPedido = 'recibido' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado';

export interface PedidoResumen {
  id: string;
  numero: number | null;
  estado: EstadoPedido;
  retenido: boolean;
  fecha: string;
  desdeApp: boolean;
  cantidadProductos: number;
  total: number;
  items: { productId: string | null; nombre: string; cantidad: number }[];
}

export interface Cuenta {
  cliente: { nombre: string; direccion: string | null; localidad: string | null };
  vendedor: string | null;
  credito: Credito;
}
