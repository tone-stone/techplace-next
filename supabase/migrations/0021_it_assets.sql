-- IT Asset Management: inventario de activos por cliente (cómputo, red,
-- servidores, dominios, licencias…). En la fase de Soporte los tickets
-- podrán enlazarse a un activo. Enums (no tablas configurables) mientras
-- haya un solo tenant.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.it_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  name text not null,
  asset_type text not null default 'otro'
    check (asset_type in (
      'computo', 'servidor', 'router', 'switch', 'firewall', 'access_point',
      'impresora', 'telefonia', 'dominio', 'sitio_web', 'licencia', 'otro'
    )),
  status text not null default 'activo'
    check (status in ('activo', 'en_reparacion', 'retirado')),
  identifier text,          -- número de serie / etiqueta de inventario / hostname
  location text,
  ip_address text,
  vendor text,
  notes text,
  acquired_on date,
  warranty_until date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.it_assets enable row level security;

-- RLS: dios / admin / ejecutivo (mismo conjunto que crm_clients), patrón de 0017.
drop policy if exists it_assets_select on public.it_assets;
drop policy if exists it_assets_insert on public.it_assets;
drop policy if exists it_assets_update on public.it_assets;
drop policy if exists it_assets_delete on public.it_assets;

create policy it_assets_select on public.it_assets for select
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_assets_insert on public.it_assets for insert
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_assets_update on public.it_assets for update
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']))
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_assets_delete on public.it_assets for delete
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));

create index if not exists it_assets_client_idx on public.it_assets (client_id);
create index if not exists it_assets_type_idx on public.it_assets (asset_type);
create index if not exists it_assets_alive_idx
  on public.it_assets (deleted_at) where deleted_at is null;

drop trigger if exists it_assets_set_updated_at on public.it_assets;
create trigger it_assets_set_updated_at
  before update on public.it_assets
  for each row execute function public.set_updated_at();
