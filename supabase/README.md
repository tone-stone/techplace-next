# Base de datos — flujo de migraciones

Desde octubre 2026 las migraciones se gestionan con el **Supabase CLI** en lugar
de pegar SQL a mano en el SQL Editor. Los archivos `migrations/00NN_*.sql`
antiguos (0001–0024) se conservan tal cual; los headers que dicen "Ejecutar
completo en el SQL Editor" son históricos.

No usamos el stack local (`supabase start` / Docker). Las migraciones se aplican
directo contra la base de datos remota enlazada con `supabase db push`.

---

## Bootstrap (una sola vez, por máquina)

Necesita tus credenciales, así que lo corres tú (no se puede en automático):

```bash
# 1. Autenticarte (abre el navegador o pega un Personal Access Token)
supabase login

# 2. Enlazar el proyecto (pedirá el password de la base de datos)
supabase link --project-ref edejuwlzfxpuafuyihgr

# 3. Marcar las migraciones 0001–0024 como YA APLICADAS.
#    Se corrieron a mano en su momento, así que hay que decirle al CLI que no
#    las vuelva a ejecutar. Sin esto, `db push` intentaría re-correrlas.
supabase migration repair --status applied \
  0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 \
  0013 0014 0015 0016 0017 0018 0019 0020 0021 0022 0023 0024

# 4. Verificar: la lista debe salir toda como "applied", sin pendientes.
supabase migration list
```

---

## Día a día

```bash
# Crear una migración nueva (genera migrations/<timestamp>_nombre.sql)
supabase migration new agregar_tabla_x

# ...editas el archivo SQL...

# Ver qué está pendiente contra la base remota
supabase migration list

# Aplicar las pendientes a producción (pide confirmación)
supabase db push
```

Reglas del proyecto:

- SQL crudo, siempre. RLS, funciones, triggers y enums lo necesitan; **no** Prisma.
- Toda tabla nueva: `id uuid primary key default gen_random_uuid()`, `created_at`,
  `updated_at` (si muta, con trigger `set_updated_at`), `deleted_at` /
  `deleted_by`, e índice parcial `*_alive_idx` (`where deleted_at is null`).
- **`org_id uuid not null references public.organizations(id)`** en toda tabla de
  negocio nueva (ver "Multi-tenant" abajo). Ponlo aunque hoy no haya política que
  lo use — así no hay que retrofitear.
- Políticas RLS con el patrón `public.current_role_name() = any (array[...])`
  (ver `0017_five_role_model.sql`).
- Los archivos nuevos ya no llevan el header de "Ejecutar en el SQL Editor".

---

## Multi-tenant (estado y plan)

`0025_tenant_seam.sql` dejó la **costura**: existe `public.organizations`,
`profiles.org_id` (una sola org, "TechPlace"), `handle_new_user()` asigna la org
por defecto, y `public.current_org_id()` está disponible como
`public.current_role_name()`. **Ninguna política filtra por org todavía** — el
comportamiento no cambió.

Cuando entre el **segundo cliente**, se hace el milestone completo como su propia
tanda de migraciones:

1. `alter table <t> add column org_id uuid references public.organizations(id)`
   en cada tabla de negocio (todas menos `organizations`, `profiles`,
   `monitoring_events`, `activity_log`, `deletion_log`).
2. Backfill: `update <t> set org_id = (select id from public.organizations where slug = 'techplace')`.
3. `alter table <t> alter column org_id set not null`.
4. Reescribir las 4 políticas de cada tabla añadiendo `and org_id = public.current_org_id()`
   al `using` / `with check`. Trigger `before insert` que rellene `org_id` con
   `current_org_id()` si viene null, para no tocar cada `insert` de la app.
5. Resolución de tenant (subdominio o selector), rol por-organización
   (`memberships` en vez de `profiles.role`), y portal `/portal` para contactos
   de cliente (auth separada). Probar aislamiento con 2 orgs reales.
6. `app_settings` pasa de fila única a PK `org_id`.

## Archivos

- `config.toml` — configuración del CLI (commiteado).
- `.temp/` — estado local del link, **ignorado** por git.
- `migrations/` — historial, commiteado.
