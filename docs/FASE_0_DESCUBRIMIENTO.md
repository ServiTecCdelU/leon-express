# Fase 0 — Descubrimiento: App de pedidos conectada al SaaS

Relevado el 2026-09-26 sobre `DEMOS/Distribuidora DEMO 001` (código + base Supabase real, solo lectura).

---

## 1. Qué es el SaaS hoy

| Aspecto | Estado real |
|---|---|
| Stack | Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui, en Vercel |
| Base | Supabase Postgres, **una sola base para todos los tenants**, aislada por RLS con `distribuidora_id` |
| Tenant | Tabla `distribuidoras` (`slug`, `logo_url`, `plan`, flags de módulos: `pos_habilitado`, `mayorista_habilitado`, `descuentos_habilitados`, …) |
| Ruteo | Todo bajo `/{slug}/...`; `/superadmin` es cross-tenant |
| Estructura | `sucursales` → `depositos` → `stock_por_deposito` (stock real por depósito; `productos.stock` es la suma cacheada) |
| Tienda pública | **Ya existe**: `/{slug}/tienda` + APIs `app/api/public/{productos,pedidos,clientes,vendedores,mas-vendidos}` resueltas por slug |
| Auth | Supabase Auth (Google). Roles: `superadmin`, `admin`, `gerente`, `seller`, `cajero`, `customer` |
| Pagos | Mercado Pago **QR de mostrador** (`lib/mercadopago.ts`, `mp_ordenes`). No hay checkout online |
| Promos | Por producto, en `productos`: `descuento`, `descuento_cantidad`, `regalo_mismo_*`, `regalo_otro_*`, `regalo_producto_*`. Se calculan en el cliente dentro de `hooks/useCart.ts` |
| Pedidos | `pedidos.status`: `pending → preparation → delivery → completed`; `source = 'tienda'` para los de la web; `client_request_id` con índice único para idempotencia |
| Realtime | Solo en pantallas internas (pedidos, transporte) |

### Datos reales

| Tenant | Activa | Productos | Clientes | Pedidos por tienda | Sucursales |
|---|---|---|---|---|---|
| `demo` | sí | 90 | 26 | 9 | 1 |
| `lubrel` | sí | 7.686 | 1.299 | 0 | 1 |
| `papito` | no | 0 | 0 | 0 | 2 |

7.738 de 7.776 productos tienen `image_url` cargado. Falta verificar que sean imágenes válidas y no placeholders.

---

## 2. Hallazgos que condicionan la app

### Bloqueantes (se resuelven en el SaaS antes o durante la Fase 1)

1. **El precio lo manda el cliente.** `POST /api/public/pedidos` guarda `items` tal como llegan, con el precio incluido. Desde una app (o con `curl`) cualquiera puede pedir a $1. **La app obliga a recalcular precio, promos y total en el servidor.**
2. **La lógica de promos vive en un hook de React** (`hooks/useCart.ts`, 28 referencias a regalos/descuentos). Hay que extraerla a un módulo puro (`lib/pricing/`) con tests. La usarían la tienda web, la API y el servidor de la app: una sola fuente, sin duplicar.
3. **Los pedidos públicos no tienen idempotencia.** No usan `client_request_id`. En celular, con mala señal y reintentos, se duplicarían pedidos. Ya pasó un incidente igual (WALSER, 23/09). El índice `idx_pedidos_client_request_id` ya existe: solo falta usarlo.
4. **La tienda no tiene interruptor.** `PLAN_TIENDA_VIRTUAL.md` está en 0/7: cualquier tenant activo expone su catálogo y acepta pedidos. La app se apoya en ese mismo gate, así que **ese plan va primero** (en particular las fases 1 a 5).
5. **`GET /api/public/clientes` devuelve saldo y límite de crédito** a cualquiera que tenga un DNI. Está incluido en la Fase 5 del plan de tienda.

### Importantes

6. **El catálogo se entrega completo.** `/api/public/productos` devuelve todo: son 7.686 productos para `lubrel`. En la app hace falta paginado, búsqueda del lado del servidor y columnas explícitas (hoy es `select *`).
7. **Stock por sucursal.** Si el cliente elige la sucursal "Centro", el stock tiene que salir de `stock_por_deposito` del depósito de esa sucursal, no de `productos.stock` (suma global).
8. **Los cambios de estado no pasan por el servidor.** El panel cambia `pedidos.status` con la anon key desde el navegador. Para mandar un push al cliente hace falta un **trigger o Database Webhook de Supabase** que llame a una ruta de la API. No se puede enganchar desde un service.
9. **`rate-limit` es en memoria** y se resetea en cada redeploy o instancia de Vercel. Con tráfico de app conviene uno persistente (tabla o Upstash). Es para una fase posterior.
10. **IDs legibles con un loop de hasta 1.000 queries** (`generateAdminReadableId`) y posibilidad de carrera entre dos pedidos simultáneos. Con la idempotencia del punto 3 queda mitigado.

---

## 3. Decisiones de arquitectura propuestas

### D1 — La app no habla directo con Supabase: usa una API propia en el SaaS

- Rutas nuevas en el SaaS: `app/api/app/v1/*`, en el mismo deploy de Vercel. Usan `supabaseAdmin` y filtran siempre por `distribuidora_id`.
- **Motivo:** el RLS actual resuelve el tenant con `auth_distribuidora_id()`, que devuelve **una** distribuidora por usuario. Un cliente de la app compra en **varios** comercios, así que no encaja en ese modelo. Además, precios, puntos y sorteos no pueden quedar del lado del cliente.

### D2 — Identidad del cliente: una cuenta global y un vínculo por comercio

```sql
-- Cuenta global del cliente de la app (una por persona)
app_clientes (id uuid, auth_uid text unique, telefono, nombre, email, fecha_nacimiento, created_at)

-- Vínculo con cada comercio; apunta al `clientes` que ya usa el SaaS
app_cliente_comercios (
  app_cliente_id → app_clientes,
  distribuidora_id → distribuidoras,
  cliente_id → clientes,          -- la ficha que ve el comercio en su panel
  sucursal_preferida_id → sucursales,
  origen text,                    -- 'qr' | 'link' | 'busqueda' | 'referido'
  unique (app_cliente_id, distribuidora_id)
)
```

- **No** se usa `usuarios` para los clientes de la app. Esa tabla es de empleados, tiene un solo `distribuidora_id` y las policies de RLS dependen de ella.
- El comercio sigue viendo a su cliente en `clientes`, como hoy. La app solo agrega el vínculo.
- Login: **OTP por teléfono** (Supabase Auth, proveedor SMS) + Google como alternativa.

### D3 — La app es un módulo por tenant

- `distribuidoras.app_habilitada boolean default false`, en el mismo patrón que `tienda_habilitada` (`modulos-panel.tsx` de superadmin).
- El gate está en el servidor: comercio apagado = 404 en `app/api/app/v1/*`.

### D4 — QR y deep links

```
https://{dominio}/a/{slug}?s={sucursal_id}
```

- Una ruta nueva en el SaaS (`app/a/[slug]/page.tsx`) sirve el `assetlinks.json` para Android App Links.
  - Si la app está instalada, Android la abre directo en ese comercio.
  - Si no está instalada, la página muestra el logo del comercio y **"Descargar app"**, que lleva a Play Store con `referrer=slug%3D…%26s%3D…` (Install Referrer API). También ofrece **"Pedir desde la web"**, que lleva a `/{slug}/tienda`: la tienda web actual queda como respaldo gratuito.
- Desde el panel del comercio: una pantalla nueva, **"QR de mi comercio"**, para descargar el afiche en PDF por sucursal. Se reutiliza `qrcode`, que ya está en las dependencias.

### D5 — Precios y promos: una sola fuente en el servidor

- Nuevo `lib/pricing/` (puro, con tests en Vitest), extraído de `useCart.ts` sin cambiar el comportamiento.
- `POST /api/app/v1/carrito/cotizar` → devuelve precios, promos aplicadas y total. La app **muestra**; no calcula.
- `POST /api/app/v1/pedidos` → vuelve a cotizar del lado del servidor, ignora los precios que manda el cliente y exige `client_request_id`.

### D6 — Pedidos de la app en el flujo existente

- Se insertan en `pedidos` con `source = 'app'`, `sucursal_id` elegida y `client_request_id`. El comercio los ve y los gestiona en su panel **sin cambios de UI** (a lo sumo un badge "App").
- Estados para el cliente: `pending` = Recibido, `preparation` = Preparando, `delivery` = En camino / Listo para retirar, `completed` = Entregado. Un pedido anulado (`anulado_at`) se muestra como Cancelado.
- Push: trigger `AFTER UPDATE OF status ON pedidos WHERE source='app'` → `pg_net` → `/api/app/v1/hooks/pedido-estado` (protegido con secreto) → Expo Push.

### D7 — Módulos nuevos en el SaaS (tablas nuevas, todas con `distribuidora_id` + RLS)

| Módulo | Tablas | Notas |
|---|---|---|
| Branding | columnas en `distribuidoras`: `color_primario`, `color_secundario`, `banner_urls` | `logo_url` ya existe |
| Ofertas / folleto | `app_banners`, `app_folletos` (+ ítems) | Las promos por producto **ya existen** y se reutilizan; esto agrega vitrina y vigencia |
| Puntos | `puntos_reglas` (config por comercio), `puntos_movimientos` (**ledger** de solo alta, idempotente por `pedido_id`) | Se acreditan cuando el pedido pasa a `completed`, no al crearlo |
| Niveles y cupones | `cupones`, `cupones_usos` | Fase 2 |
| Sorteos | `sorteos`, `sorteos_participaciones`, `sorteos_ganadores` | Con bases y condiciones, y participación sin compra (ver riesgos) |
| Push | `app_dispositivos` (token Expo por `app_cliente_id`) | |

### D8 — Stack de la app

- **Expo (React Native) + TypeScript + Expo Router**, builds con EAS y actualizaciones OTA.
- Estado del servidor: TanStack Query. Carrito: Zustand persistido. Formularios: react-hook-form + zod, igual que el SaaS.
- El repo de la app vive en esta carpeta (`app pedidos`), separado del SaaS. Los contratos (schemas zod de la API) se definen en el SaaS (`lib/app-api/contracts.ts`) y se copian a la app con un script de sync. No hace falta monorepo.

---

## 4. Orden de trabajo resultante

| # | Dónde | Qué |
|---|---|---|
| 0.a | SaaS | ✅ 2026-09-26 (commit `a835e1b`): `PLAN_TIENDA_VIRTUAL.md` fases 1–5 (gate + endurecer APIs públicas). De paso, SQL/096 cierra la escritura pública sobre `distribuidoras` |
| 0.b | SaaS | Extraer `lib/pricing/` desde `useCart.ts` + tests (listas de precios + promos). **Pendiente**: la tienda web no aplica promos ni listas, así que para ella alcanzó con el precio de catálogo (0.c). La app B2B sí lo necesita: se hace al arrancar la API `/api/app/v1` |
| 0.c | SaaS | ✅ 2026-09-26: pedido público con precio del catálogo en el servidor (`lib/tienda/pedido-publico.ts`) + `clientRequestId` idempotente |
| 1 | SaaS | SQL: `app_habilitada`, `app_clientes`, `app_cliente_comercios`, `app_dispositivos`, branding |
| 1 | SaaS | API `app/api/app/v1`: comercio (branding, sucursales), catálogo paginado, cotizar, pedidos, mis pedidos |
| 1 | SaaS | `/a/{slug}` + `assetlinks.json` + pantalla "QR de mi comercio" |
| 1 | App | Expo: QR/deep link, login OTP, catálogo, carrito, checkout (retiro/envío), seguimiento + push |
| 2 | Ambos | Ofertas/folleto, puntos (ledger), niveles, cupones, repetir pedido |
| 3 | Ambos | Sorteos, rachas, referidos |
| 4 | Ambos | Mercado Pago Checkout Pro, Scan & Go, faltantes/reemplazos, métricas |

SQL nuevo: se escribe en `SQL/0XX_*.sql` del SaaS (regla del proyecto) y el DDL se confirma antes de ejecutarse.

---

## 5. Decisión: la app es B2B (2026-09-26)

**Quién compra:** los comercios clientes de la distribuidora (almacenes, supermercados, kioscos) que le hacen pedidos a Lubrel, Demo, etc. La app es "el vendedor en el bolsillo" del comerciante.

### Datos de Lubrel que lo sostienen

| Dato | Valor | Implicancia |
|---|---|---|
| Clientes | 1.299, todos con cuenta corriente habilitada | Pago por defecto: **a cuenta corriente**, no online |
| Con vendedor asignado (`seller_id`) | 840 | El pedido de la app **se atribuye a su vendedor** (comisión por `listas_precios.commission_rate`) |
| Con teléfono | 673 | El login por OTP puede vincular automáticamente por teléfono en la mitad de los casos |
| Con CUIT | 51 | No sirve como identificador principal |
| Con lista de precios asignada | 1 | Se usa la lista default del tenant (L2, ×1.02) |
| Productos vendidos por bulto (`unidades_por_bulto > 1`) | 5.990 de 7.686 | El catálogo muestra bulto y unidad, con precio por bulto |
| Productos con imagen válida | **0** (todas vacías o placeholder) | Riesgo de diseño: ver 5.4 |
| Pedidos de los últimos 30 días | 324, todos `direct_sale` (cargados por vendedores) | Ese es el volumen a migrar a autogestión |

### 5.1 Qué cambia respecto del plan original

**Alta y login: el comercio tiene que existir y estar aprobado**
- **QR personal por cliente:** el panel genera un QR o link por cada ficha de `clientes` (`/a/{slug}?inv={token}`, de un solo uso y con vencimiento). El vendedor se lo da al almacenero en la visita, por WhatsApp o impreso en el remito. Al escanearlo y validar el teléfono con OTP, la cuenta queda vinculada a esa ficha. Es el camino principal.
- **QR general de la distribuidora:** el comercio que no tiene ficha, o no tiene invitación, pide el alta. La solicitud queda **pendiente de aprobación** en el panel y el admin o vendedor la vincula a un cliente existente o crea uno nuevo.
- **Vínculo automático:** si el teléfono validado coincide con un único `clientes.phone` del tenant, se ofrece vincularlo. Se confirma igual con el admin si el cliente tiene deuda o está moroso.
- Tabla `app_invitaciones (token, distribuidora_id, cliente_id, creado_por, expira_at, usado_at)`.

**Precio**
- El precio sale de la **lista del cliente** (`clientes.lista_precio_id`) o, si no tiene, de la lista default del tenant. Se aplican las promos de `lib/pricing/`. Siempre se calcula en el servidor (D5).

**Catálogo**
- El producto se muestra por **bulto** (`unidades_por_bulto`) y, si se divide, también por unidad (`se_divide_en`). El stepper de cantidad avanza de a bulto.
- Búsqueda también por código y por código de barras (`producto_codigos`). **Escanear el código de barras de la góndola del almacén** es una forma rápida de reponer.

**Pedido**
- Se crea con `source='app'`, `seller_id` = vendedor asignado, `lista_precio_id` y `sucursal_id`.
- Entra al circuito de siempre (preparación → remito → hoja de ruta → reparto → cobro). **El remito sigue siendo inmodificable**; la app no lo toca.
- Pedido mínimo y día de entrega **por zona** (`zonas` / `cliente_zonas`). La app muestra "Tu próximo reparto: jueves".
- Se valida el límite de crédito (`credit_limit` y `current_balance`). Si el cliente está moroso, el pedido queda retenido (`held`) para que lo apruebe el admin, no rechazado.

**Pago**
- Por defecto a cuenta corriente, como hoy.
- La app muestra el **saldo y los movimientos** del propio cliente autenticado (nunca por DNI).
- El cliente puede **informar un pago** subiendo el comprobante de transferencia: ya existe `comprobantes_pago` con `status` y aprobación.
- Mercado Pago online queda para una fase posterior.

**Postventa**
- Descarga de **remitos y facturas** de sus compras (PDFs que ya genera el SaaS).
- **Reclamo de faltantes:** ya existe `cliente_faltantes`.

### 5.2 Fidelización adaptada a B2B

| Idea original | Versión B2B |
|---|---|
| Puntos por pedir en la app | Puntos por **monto comprado por la app** y bonus por pedir antes de la fecha de corte de su zona (ordena la logística). Canje por descuento en el próximo pedido o por productos |
| Ofertas | **Ofertas por lista o por zona**, folleto semanal, "precio especial por X bultos". Las promos por producto (regalos, descuento por cantidad) ya existen: hoy Lubrel no usa ninguna |
| Sorteos | Entre comercios que compraron por la app en el mes (por ejemplo, una heladera exhibidora o una mercadería). Participación también sin compra, por bases legales |
| Niveles | Por volumen mensual. El nivel alto sube el límite de crédito sugerido o da entrega prioritaria (lo decide el admin) |
| Referidos | "Recomendá un comercio": el nuevo cliente entra como solicitud de alta y el que recomendó suma puntos cuando el nuevo hace su primer pedido entregado |

### 5.3 Ideas nuevas que tienen sentido por ser B2B

1. **Pedido sugerido:** según su historial ("hace 15 días llevaste 5 bultos de yerba").
2. **Repetir el último pedido** con 1 toque, con ajuste de cantidades antes de confirmar.
3. **Cierre de pedido por zona:** "Tenés hasta mañana a las 20 h para sumar a tu pedido del jueves". Se puede editar hasta que pase a preparación.
4. **Chat o WhatsApp con su vendedor,** que figura con nombre y foto en la app.
5. **Lanzamientos y novedades** del proveedor.
6. **Aviso de vuelta de stock.**

### 5.4 Riesgo nuevo: no hay fotos

Lubrel tiene 0 productos con imagen válida. Una app "linda" con 7.686 productos sin foto no se sostiene. Opciones, para decidir en el diseño:
- **a)** Diseño que no dependa de fotos: tarjetas tipográficas con ícono o ilustración por rubro, marca destacada y color por categoría. Es viable desde el día 1.
- **b)** Carga masiva de fotos por código de barras (`producto_codigos`) desde un proveedor o banco de imágenes. Hay que evaluar licencia y cobertura.
- **c)** Pantalla en el panel para que el admin suba fotos de los más vendidos primero (el top 200 cubre la mayoría de los pedidos).

La recomendación es **a + c**: la app nace bien con (a) y mejora a medida que se cargan fotos.

### 5.5 Impacto en el orden de trabajo

Se suman a la Fase 1: `app_invitaciones` + QR personal por cliente en el panel, pantalla de solicitudes de alta, cálculo con la lista del cliente, validación de crédito, saldo y movimientos, y atribución al vendedor.
Se mueve de la Fase 4 a la Fase 2: informar pago con comprobante, remitos y facturas, faltantes.
Scan & Go queda fuera, porque es B2C. Lo reemplaza el escaneo de código de barras para reponer.
