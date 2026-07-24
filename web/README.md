# Carnes de Montoya — web

React 19 + TypeScript + Vite + Supabase. Ver [../CLAUDE.md](../CLAUDE.md)
(arquitectura) y [../reglas.md](../reglas.md) (reglas de negocio) para el
detalle completo.

## Setup local

```bash
npm install
cp .env.example .env   # completar con las credenciales del proyecto de Supabase
npm run dev
```

Variables de entorno (`.env`, nunca se commitea — ver `.env.example`):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

## Scripts

| Comando               | Qué hace                                   |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Vite)               |
| `npm run build`        | Typecheck + build de producción             |
| `npm run typecheck`    | Solo typecheck (`tsc -b`)                   |
| `npm run lint`         | oxlint                                      |
| `npm run test`         | Tests unitarios/componentes (Vitest)        |
| `npm run test:e2e`     | Tests end-to-end (Playwright)                |

## Pasos pendientes fuera del código (dueño del proyecto)

1. **Base de datos**: correr [`../supabase-schema.sql`](../supabase-schema.sql)
   entero en el SQL Editor del proyecto de Supabase (es seguro re-correrlo
   si hay cambios).
2. **Super admin**: crear la cuenta `justo@carnesdemontoya.com` (registro
   normal en el sitio, o Dashboard > Authentication > Users > Add user) y
   correr el `insert into public.super_admins ...` que está comentado al
   final del schema SQL.
3. **Storage**: el bucket `productos-fotos` lo crea el propio script SQL.
4. **Mails de pedido**: desplegar la Edge Function
   [`../supabase/functions/notificar-pedido`](../supabase/functions/notificar-pedido/index.ts)
   desde el Dashboard (Edge Functions > New function, pegar el archivo tal
   cual), cargar el secret `RESEND_API_KEY`, y configurar un Database
   Webhook (Database > Webhooks) sobre `insert` en la tabla `pedidos`
   apuntando a esa función.
5. **Dominio en Resend**: sin verificar un dominio propio (Resend >
   Domains), los mails **no van a llegar** a `ventas@demontoya.com` ni a los
   compradores (modo sandbox solo manda a la casilla dueña de la cuenta de
   Resend).
6. **Google OAuth** (opcional, para "Continuar con Google"): configurar un
   cliente OAuth en Google Cloud Console, cargar el Client ID/Secret en
   Supabase (Authentication > Providers > Google), y poner el **Site URL** +
   **Redirect URLs** de Supabase (Authentication > URL Configuration) en la
   URL real de Vercel.
7. **Vercel**: importar el repo de GitHub, configurar el *root directory*
   en `web/`, cargar `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` como
   variables de entorno (Production + Preview), y listo — cada push a una
   rama nueva genera su propio preview deploy.
