-- Fase 2: borrado lógico recuperable + bitácora de eliminaciones.
-- Nada se elimina de verdad: se marca deleted_at/deleted_by y se guarda una
-- copia en deletion_log. Ejecutar completo en el SQL Editor de Supabase.

-- ----------------------------------------------------------------------------
-- 1. Columnas deleted_at / deleted_by en cada entidad borrable
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'crm_clients','crm_projects','crm_invoices','crm_quotes','crm_quote_items',
    'crm_tasks','articles','profiles'
  ] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
    execute format(
      'alter table public.%I add column if not exists deleted_by uuid references auth.users(id) on delete set null', t);
    execute format(
      'create index if not exists %I on public.%I (deleted_at) where deleted_at is null',
      t || '_alive_idx', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Bitácora inmutable de eliminaciones
-- ----------------------------------------------------------------------------

create table if not exists public.deletion_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  snapshot jsonb not null,
  reason text,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_by_email text,
  deleted_at timestamptz not null default now()
);

alter table public.deletion_log enable row level security;

drop policy if exists deletion_log_select on public.deletion_log;
create policy deletion_log_select on public.deletion_log for select
  using (public.current_role_name() = any (array['dios','admin']));

-- Insert lo hace el server (cliente autenticado); sin update/delete: inmutable.
drop policy if exists deletion_log_insert on public.deletion_log;
create policy deletion_log_insert on public.deletion_log for insert with check (true);

create index if not exists deletion_log_at_idx on public.deletion_log (deleted_at desc);

-- ----------------------------------------------------------------------------
-- 3. current_role_name(): una cuenta desactivada (profiles.deleted_at) deja
--    de tener rol -> pierde todo acceso vía RLS y vía el proxy.
-- ----------------------------------------------------------------------------

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and deleted_at is null
$$;
