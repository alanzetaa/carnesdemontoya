# Carnes de Montoya

## Qué es esto

Plataforma de pedidos para De Montoya, productora de carne envasada al vacío
en Entre Ríos (Establecimiento Oficial SENASA N.º 5620) que vende cortes y
combos con envío refrigerado a **Rosario** y **Buenos Aires**. Es un
proyecto hermano de "Comunidad Metales Julio" (mismo dueño, `../Metales
Julio`) y replica su arquitectura y convenciones, pero el caso de uso es
distinto: acá la gente arma un **pedido de compra**, no publica ni busca
contactos.

El pedido que se confirma en la plataforma **no es un cobro**: es una
solicitud que le llega a `ventas@demontoya.com` (y al comprador, de
confirmación); el pago y la entrega se coordinan aparte, por WhatsApp o
email. Ver [reglas.md](reglas.md) para el detalle de las reglas de negocio.

## Estado actual / stack

React 19 + TypeScript + Vite (`web/`), Supabase (Postgres + Auth + Storage +
Edge Functions), Vercel para el hosting (deploys por branch). Mismas
librerías y versiones que Metales Julio: `react-router-dom`,
`@tanstack/react-query`, `react-hook-form` + `zod`, `@supabase/supabase-js`,
oxlint, Vitest + Testing Library, Playwright.

El esquema completo de la base (tablas, RLS, funciones RPC, bucket de
Storage) vive en [supabase-schema.sql](supabase-schema.sql) y se corre desde
el SQL Editor del dashboard de Supabase — es seguro volver a correrlo si hay
cambios. La Edge Function que manda los mails de pedido nuevo vive en
[supabase/functions/notificar-pedido](supabase/functions/notificar-pedido/index.ts).

**La sesión no persiste entre recargas de página**, misma decisión que en
Metales Julio / Biddit: `web/src/lib/supabaseClient.ts` crea el cliente con
`{ auth: { persistSession: false } }` y borra cualquier resto de sesión
vieja en `localStorage` al cargar (salvo que la URL traiga `access_token`,
login con Google o recuperar contraseña en curso).

**Login: email + contraseña, o Google** (mismo patrón que Metales Julio —
`loginConGoogle` en `LoginModal.tsx`). **Recuperar contraseña**: mismo flujo
con `resetPasswordForEmail` + evento `PASSWORD_RECOVERY` que abre
`NewPasswordModal` (sin botón de cerrar, hay que completar el cambio para
seguir).

## Estructura de `web/src/`

```
lib/            supabaseClient.ts, database.types.ts (tipos escritos a mano)
context/        AuthContext, ToastContext, CartContext
components/
  ui/           Modal, PassField (genéricos)
  auth/         Login/Register/ForgotPassword/NewPassword modals
  layout/       AppShell (topbar + sidebar + <Outlet/>), Sidebar, ErrorBoundary
  perfil/       perfilSchema, TerminosModal/Contenido
  catalogo/     ProductoCard
  admin/        tablas y modales de HQ De Montoya (pedidos, stock, miembros)
  pedidos/      EstadoBadge
hooks/          useNominatimSearch, useProductos
constants/      terminos.ts (versión de T&C), categorias.ts
utils/          format.ts, ubicacion.ts, dateRange.ts, suspension.ts,
                adminStats.ts, adminCharts.ts
pages/          LandingPage, CatalogoPage, CarritoPage, MisPedidosPage,
                PerfilPage, AdminPage, stubs.tsx (SuspendedPage)
```

## Modelo de datos

- **`profiles`**: nombre, apellido, email (obligatorios), whatsapp
  (opcional), dirección (obligatoria, con localidad/provincia derivadas de
  Nominatim), términos versionados, `suspendido_hasta`. **Sin DNI/CUIT** a
  propósito (pedido explícito del dueño de que el registro fuera más básico
  que en Metales Julio).
- **`productos`**: cortes y combos (`categoria`: `corte` | `combo`),
  `precio`, `unidad` (`kg`/`caja`/`unidad`), `stock`, `activo`. El catálogo
  con precio es **público** (a diferencia de Metales Julio, esto es una
  tienda, no una comunidad privada) — `select` de RLS permite `activo=true`
  a cualquiera, sin login.
- **`pedidos` / `pedido_items`**: la solicitud de compra. Todo lo que puede
  cambiar después (datos del comprador, precio del producto) queda
  **snapshoteado** en el momento del pedido — ver reglas.md.
- **`super_admins`**: mismo patrón que Metales Julio (`es_super_admin()`
  `security definer`).

### RPCs (`security definer`, mismo patrón que los `admin_*` de Metales Julio)

- **`crear_pedido`**: única forma de crear un pedido. Corre en una
  transacción, bloquea (`for update`) cada fila de `productos` involucrada,
  valida stock, toma el precio actual del servidor (nunca del cliente) y
  descuenta stock. No hay policy de `insert` directa sobre
  `pedidos`/`pedido_items`.
- **`admin_listar_miembros`**, **`admin_suspender_usuario`**,
  **`admin_eliminar_perfil`**: gestión de cuentas desde HQ.
- **`admin_listar_pedidos`**, **`admin_actualizar_estado_pedido`**: HQ ve
  todos los pedidos con sus items agregados en un jsonb; cambiar el estado a
  `cancelado` reintegra stock (y viceversa si se reactiva).
- **`admin_stats_resumen`**, **`admin_stats_pedidos_por_dia`**: tiles y
  gráfico de HQ.

El CRUD de `productos` (crear/editar/borrar cortes y combos) **no usa RPC**:
son policies de RLS directas (`insert`/`update`/`delete` solo si
`es_super_admin()`), porque no hace falta saltar privacidad de otro usuario
para esa tabla.

## Carrito y pedidos

El carrito (`CartContext`) se persiste en `localStorage`, no en la base —
así nadie pierde su selección si recién se le pide crear una cuenta al
confirmar. Armar el pedido (agregar al carrito) **no requiere login**;
**confirmarlo sí**. La validación real de stock y precio pasa siempre por
`crear_pedido` en el servidor.

## Mails de pedido (Resend)

`notificar-pedido` se dispara con un Database Webhook (`insert` sobre
`pedidos`) y manda dos mails vía Resend: uno a `ventas@demontoya.com` con el
detalle completo, y uno de confirmación al comprador. **En modo sandbox de
Resend (sin dominio verificado) solo llegan mails a la casilla con la que se
creó la cuenta de Resend** — hace falta verificar un dominio propio (Resend
> Domains) para que lleguen en producción. Ver el comment header del propio
archivo de la función para el paso a paso de despliegue.

## HQ De Montoya (`/admin`, solo `super_admins`)

Tabs: **Resumen** (stats + gráfico de pedidos por día), **Pedidos**
(listado con detalle de items, cambiar estado), **Stock** (CRUD de
productos con foto), **Clientes** (listado, suspender/reactivar, eliminar
perfil). `RequireSuperAdmin` en `App.tsx` redirige a `/catalogo` si la
cuenta no es admin.

## Convenciones

- Comentarios en español, solo cuando explican un "por qué" no obvio (mismo
  criterio que Metales Julio).
- Tipos de `database.types.ts` escritos a mano con `type` (no `interface`,
  rompe la inferencia genérica de `.insert()`/`.update()` de supabase-js).
- `TERMINOS_VERSION_ACTUAL` (en `constants/terminos.ts`): si el texto de
  Términos y Condiciones cambia de forma relevante, subir este número — a
  todos les vuelve a aparecer la casilla destildada.
