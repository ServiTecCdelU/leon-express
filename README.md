# App de pedidos B2B

App móvil (Expo SDK 57 + Expo Router) para que los comercios clientes de cada distribuidora hagan sus pedidos. Se conecta al SaaS (`DEMOS/Distribuidora DEMO 001`, repo `ServiTecCdelU/distridemo01`) solo a través de `/api/app/v1`.

- Relevamiento y decisiones: `docs/FASE_0_DESCUBRIMIENTO.md`
- Plan de la fase actual (en el repo del SaaS): `PLAN_APP_PEDIDOS.md`

## Cómo correrla

```bash
cp .env.example .env      # completar con la URL y la publishable key de Supabase
npm install
npx expo start            # abrir con Expo Go o un development build
```

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/app/` | Rutas (Expo Router). `ingresar` (OTP), `invitacion` (deep link), `(app)/(tabs)/` inicio, catálogo, pedido, mis pedidos, cuenta; `(app)/pedidos/[id]` seguimiento |
| `src/lib/` | Cliente de la API (`api.ts`), Supabase **solo para Auth**, hooks de datos (`queries.ts`), tipos de respuesta |
| `src/state/` | Sesión, comercio activo + invitación pendiente, carrito por comercio (Zustand persistido) |
| `src/components/` | Primitivas del diseño (`ui.tsx`), fila de producto, estado del pedido |

## Reglas

- **Los precios los pone el servidor.** El carrito guarda qué y cuánto; lo que se muestra sale de `POST /cotizar`. El `precioReferencia` del carrito es solo el estimado de la barra del catálogo.
- **Confirmar un pedido reusa el mismo `clientRequestId`** en cada reintento hasta que el carrito cambia: el servidor no duplica.
- **La app no lee tablas de Supabase.** Supabase se usa únicamente para el login por OTP.
- Alta por invitación: el vendedor genera el QR en la ficha del cliente (panel) → `/a/{slug}?inv=…` → `servitecpedidos://invitacion?slug=…&inv=…`.

## Pendiente para publicar

- Proveedor de SMS en Supabase Auth (Twilio/Vonage/MessageBird). Mientras tanto: "test phone numbers" o el ingreso por email.
- Para el ingreso por email con código: la plantilla "Magic Link" de Supabase tiene que incluir `{{ .Token }}`.
- EAS: `npx eas-cli@latest build -p android` y el SHA-256 del keystore en `public/.well-known/assetlinks.json` del SaaS (App Links).
- Íconos y splash propios (hoy son los del template).
