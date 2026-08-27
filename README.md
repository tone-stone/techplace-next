# TechPlace

Sitio corporativo de **TechPlace** (desarrollo de software, ciberseguridad e IA en
Tijuana). Un solo proyecto Next.js con tres superficies:

| Superficie | Rutas | Qué es |
|---|---|---|
| **Landing** | `/`, `/legal/*` | Sitio de marketing (hero, stack tecnológico, servicios, portafolio, feed de redes, contacto) + documentos legales. |
| **Blog + Portal de Redacción** | `/blog`, `/blog/[slug]`, `/blog/login`, `/blog/dashboard` | Blog público y CMS para el equipo de contenido (crear/editar artículos, galerías, roles). |
| **CRM / Panel de Administración** | `/login`, `/admin` | Admin principal de la app: clientes, proyectos, facturación, cotizaciones, tareas y usuarios. |

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** (sin config JS; tokens en `src/app/globals.css`)
- **Supabase** — auth (email/contraseña), Postgres y Storage
- **Cloudinary** — imágenes y video del blog
- **Meta Graph API** — feed de Facebook/Instagram en la home (opcional)
- **Swiper** (carruseles), **lucide-react** + **react-icons** (iconos)
- **Vitest** + **Testing Library** — pruebas

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

Migraciones: portal editorial (`0001`–`0004`) y CRM (`0005` núcleo, `0006` proyectos, `0007` facturas, `0008` cotizaciones, `0009` tareas).

## Variables de entorno

Van en `.env.local` para desarrollo y en **Vercel → Settings → Environment Variables** para producción (y en **GitHub → Settings → Secrets and variables → Actions** para el paso de build de CI).

| Variable | ¿Obligatoria? | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Operaciones de servidor (gestión de usuarios) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Para media del blog | Cloud de Cloudinary |
| `CLOUDINARY_URL` | Para subir media | Credenciales de la API de Cloudinary |
| `META_PAGE_ID` | Opcional | ID de la Página de Facebook (feed de la home) |
| `META_PAGE_ACCESS_TOKEN` | Opcional | Page Access Token de larga duración |
| `META_IG_BUSINESS_ID` | Opcional | Cuenta de Instagram Business vinculada |

Sin las variables de Meta, la sección "Síguenos en redes" simplemente no se renderiza.

## Autenticación y sesiones

- Login por email/contraseña vía Supabase. El rol vive en `profiles.role` (`admin` | `redactor`).
- `/admin` requiere rol `admin`; `/blog/dashboard` requiere sesión (un `admin` ve más opciones). Las redirecciones las hace `src/proxy.ts` (middleware).
- Cookies de sesión (se borran al cerrar el navegador) **+ expiración por inactividad de 30 min**, aplicada en tres capas: `IdleTimeout` (cliente), `src/proxy.ts` (cada carga de página protegida) y `requireAdmin()` (cada mutación). Configurable en `src/lib/auth/session.ts`.

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
  app/            Rutas (App Router) + globals.css
  components/
    landing/      Secciones de la home
    blog/         Blog público + dashboards de redacción
    admin/        CRM (CrmDashboard + secciones en admin/crm/)
    auth/         IdleTimeout, LoginFooter
  lib/
    auth/         actions, users, session
    crm/          clients, projects, invoices, quotes, tasks, ...
    supabase/     clientes server/browser/admin
  proxy.ts        Middleware (gate de auth + timeout de inactividad)
supabase/migrations/   Esquema de la base de datos
```

## CI / Deploy

- **CI** (`.github/workflows/ci.yml`): en cada push/PR a `main` corre lint + type-check + test. El paso de build solo corre si los secrets de Actions están configurados (Vercel ya buildea en cada deploy de todas formas).
- **Deploy**: Vercel. Configura las variables de entorno en el proyecto y cada push a `main` despliega.

## Nota sobre Next.js

Esta versión de Next incluye cambios que pueden diferir de la documentación conocida. Ver `AGENTS.md` y `node_modules/next/dist/docs/` antes de tocar APIs del framework.
