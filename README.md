# TechPlace

Sitio corporativo de **TechPlace** (desarrollo de software, ciberseguridad e IA en
Tijuana). Un solo proyecto Next.js con cuatro superficies:

| Superficie | Rutas | Qué es |
|---|---|---|
| **Landing** | `/`, `/legal/*` | Sitio de marketing (hero, stack tecnológico, servicios, "plataforma integral", portafolio, feed de redes, contacto) + documentos legales. |
| **Blog + Portal de Redacción** | `/blog`, `/blog/[slug]`, `/blog/login`, `/blog/dashboard` | Blog público y CMS para el equipo de contenido (crear/editar artículos, galerías, gestión de usuarios del equipo de blog). |
| **CRM / Panel de Administración** | `/login`, `/admin` | Admin general de toda la app: clientes, proyectos, facturación, cotizaciones, tareas, usuarios de ambos equipos, y el panel de Monitoreo. |
| **Monitoreo interno** | pestaña "Monitoreo" en `/admin` | Errores (cliente + servidor), Web Vitals, consultas/operaciones lentas, e intentos de login fallidos — construido sobre Supabase, sin servicio externo. |

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions, `instrumentation.ts`) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** (sin config JS; tokens en `src/app/globals.css`)
- **Supabase** — auth (email/contraseña), Postgres (con RLS) y Storage
- **Cloudinary** — imágenes y video del blog
- **Meta Graph API** — feed de Facebook/Instagram en la home (opcional)
- **Swiper** (carruseles), **lucide-react** + **react-icons** (iconos)
- **Vitest** + **Testing Library** — pruebas
- **Playwright** — pruebas end-to-end manuales antes de desplegar (no forma parte del CI)

## Requisitos

- Node.js 22+
- Una cuenta de Supabase (proyecto + migraciones aplicadas)
- Opcional: Cloudinary (media del blog) y una Página de Facebook con Instagram Business vinculado (feed de redes)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena los valores reales
npm run dev
```

Abre <http://localhost:3000>.

### Base de datos

El esquema vive en `supabase/migrations/`. Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

Si no tienes el proyecto enlazado por CLI, cada migración se puede correr a mano en
**Supabase → SQL Editor → New query**, en orden, una por una.

Migraciones: portal editorial (`0001`–`0004`), CRM (`0005` núcleo, `0006` proyectos,
`0007` facturas, `0008` cotizaciones, `0009` tareas), monitoreo (`0010` tabla base,
`0011` latencia, `0012` seguridad), y modelo de equipos/roles (`0013`, con un fix de
recursión en RLS aplicado después en `0014` — ver la nota de esa migración si vas a
recrear el esquema desde cero).

## Variables de entorno

Van en `.env.local` para desarrollo y en **Vercel → Settings → Environment Variables** para producción (y en **GitHub → Settings → Secrets and variables → Actions** para el paso de build de CI).

| Variable | ¿Obligatoria? | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Operaciones de servidor (gestión de usuarios, logging de monitoreo) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Para media del blog | Cloud de Cloudinary |
| `CLOUDINARY_URL` | Para subir media | Credenciales de la API de Cloudinary |
| `META_PAGE_ID` | Opcional | ID de la Página de Facebook (feed de la home) |
| `META_PAGE_ACCESS_TOKEN` | Opcional | Page Access Token de larga duración |
| `META_IG_BUSINESS_ID` | Opcional | Cuenta de Instagram Business vinculada |
| `NEXT_PUBLIC_GA_ID` | Opcional | ID de medición de Google Analytics 4 (`G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Opcional | ID del Meta (Facebook) Pixel (numérico) |
| `FORMSPREE_ENDPOINT` | Opcional | Endpoint de Formspree al que `/api/contact` reenvía (por defecto el ID actual) |
| `PAGESPEED_API_KEY` | Recomendada | API key de Google (PageSpeed Insights API habilitada) para la tarjeta PSI del monitoreo. Sin ella se usa la cuota anónima compartida, que se agota seguido. |

Sin las variables de Meta, la sección "Síguenos en redes" simplemente no se renderiza.
Sin `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` no se carga ningún script de
analítica de terceros, y el CSP no se abre para esos dominios.

## Equipos y roles

Cada cuenta pertenece a **un equipo** (`crm` | `blog`) con **un rol** dentro de ese
equipo — cuatro combinaciones posibles en total, forzadas por un `check constraint`
en `profiles` (migración `0013`):

| Equipo · rol | Puede |
|---|---|
| `crm` · `admin` | Todo: CRM completo (crear/modificar/eliminar), blog completo (eliminar artículos, ver actividad), y gestiona usuarios de **ambos** equipos. Es el admin general de la app. |
| `crm` · `operativo` | Crear y modificar en el CRM. No elimina, no gestiona usuarios, sin acceso al blog. |
| `blog` · `admin` | Crear/editar/eliminar artículos, ver actividad, y gestionar cuentas del equipo de blog (no del CRM). |
| `blog` · `redactor` | Crear/editar artículos (no eliminar). Sin acceso al CRM ni a gestión de usuarios. |

La lógica vive centralizada en `src/lib/auth/roles.ts` (funciones puras `isCrmAdmin`,
`canAccessBlog`, etc.) y se aplica en tres capas independientes: `src/proxy.ts`
(redirige al portal correcto según el equipo), los `require*()` de cada server
action (`src/lib/crm/auth.ts`, `src/lib/auth/users.ts`, `requireStaff()` en
`src/lib/blog/articles.ts`), y las políticas RLS de cada tabla en Supabase.

## Autenticación y sesiones

- Login por email/contraseña vía Supabase. Si intentas entrar al portal que no te
  corresponde (ej. una cuenta del blog en `/login`), el login lo rechaza con un
  mensaje y un link directo a tu portal — no te deja una sesión "colgada" ahí.
- Cookies de sesión (se borran al cerrar el navegador) **+ expiración por inactividad
  de 30 min**, aplicada en tres capas: `IdleTimeout` (cliente), `src/proxy.ts` (cada
  carga de página protegida) y los `require*()` de cada server action. Configurable
  en `src/lib/auth/session.ts`.

## Monitoreo interno

Pestaña "Monitoreo" dentro de `/admin` (solo CRM admin/operativo la ven — es parte
del CRM, no un servicio aparte):

- **Errores**: cliente (`MonitoringClient.tsx`, `error.tsx`/`global-error.tsx`) y
  servidor (`src/instrumentation.ts` vía `onRequestError`, cubre Server Components,
  Route Handlers, Server Actions y Proxy sin envolver cada `try/catch` a mano).
- **Web Vitals** (LCP, CLS, INP, TTFB, FCP) de cada visita real, en todo el sitio.
- **Consultas/operaciones lentas**: las lecturas del CRM y el chequeo de auth en
  `proxy.ts` se miden con `withTiming()` (`src/lib/monitoring/timing.ts`) y solo se
  registran si superan 300ms — no es un log de trazas completo.
- **Intentos de login fallidos**, con IP y el email intentado.

Todo llega a `/api/monitoring/events` → tabla `monitoring_events` en Supabase (RLS:
solo lectura para CRM admin; inserción abierta porque el sitio público también
reporta errores y Web Vitals).

## Seguridad

- **CSP** y otros headers de seguridad (`X-Frame-Options`, `HSTS`, etc.) en
  `next.config.ts` — el CSP **solo aplica en producción** (`NODE_ENV=production`):
  `next dev`/Turbopack necesita `eval()` para el hot-reload, y bloquearlo rompe la
  hidratación en desarrollo. `script-src` incluye `'unsafe-inline'` a propósito —
  Next.js inyecta scripts inline para hidratar (streaming de RSC), y sin nonce (que
  forzaría renderizado dinámico en todo el sitio, perdiendo el static
  generation/ISR) es el default que la propia documentación de Next recomienda.
- **`npm audit --audit-level=high`** corre en CI — bloquea el merge si hay
  vulnerabilidades sin parchar en dependencias.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (incluye chequeo de tipos) |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas (Vitest, una pasada) |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Pruebas con reporte de cobertura |

## Estructura

```
src/
  app/            Rutas (App Router) + globals.css + instrumentation.ts
    api/
      auth/       Cierre de sesión al cerrar la pestaña (sendBeacon)
      monitoring/ Endpoint de ingesta de eventos de monitoreo
  components/
    landing/      Secciones de la home
    blog/         Blog público + dashboards de redacción (blog/dashboard/)
    admin/        CRM (CrmDashboard + secciones en admin/crm/) + admin/monitoring/
    monitoring/   MonitoringClient (Web Vitals + errores de cliente, montado en layout raíz)
    auth/         IdleTimeout, LoginFooter
    legal/        Render de los documentos legales
  lib/
    auth/         actions, users, session, roles (equipos/roles centralizados)
    crm/          clients, projects, invoices, quotes, tasks, ...
    blog/         articles, media-limits
    monitoring/   client, server, queries, timing, types
    supabase/     clientes server/browser/admin/public
  proxy.ts        Middleware (auth + equipo/rol + timeout de inactividad + timing)
supabase/migrations/   Esquema de la base de datos
```

## CI / Deploy

- **CI** (`.github/workflows/ci.yml`): en cada push/PR a `main` corre lint +
  type-check + test + auditoría de dependencias. El paso de build solo corre si los
  secrets de Actions están configurados (Vercel ya buildea en cada deploy de todas
  formas).
- **Deploy**: Vercel. Configura las variables de entorno en el proyecto y cada push
  a `main` despliega.

## Nota sobre Next.js

Esta versión de Next incluye cambios que pueden diferir de la documentación
conocida (confirmado en esta sesión: `error.tsx`/`global-error.tsx` usan `retry`
en vez de `reset`). Ver `AGENTS.md` y `node_modules/next/dist/docs/` antes de tocar
APIs del framework.
