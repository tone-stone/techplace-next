-- CRM: múltiples contactos por cliente (empresa).
-- `crm_clients` sigue siendo la entidad cuenta/empresa; `crm_contacts` son las
-- personas dentro de ella (director, gerente IT, técnico, administración…).
-- Exactamente un contacto por cliente lleva `is_primary`, y su name/email/phone
-- se refleja en `crm_clients.name/email/phone` para no romper la lista de
-- clientes, el resumen ni los PDFs, que leen ese snapshot.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- 1) Tabla
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  is_primary boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.crm_contacts enable row level security;

-- 2) RLS: mismo conjunto que crm_clients (dios / admin / ejecutivo), patrón de 0017.
drop policy if exists crm_contacts_select on public.crm_contacts;
drop policy if exists crm_contacts_insert on public.crm_contacts;
drop policy if exists crm_contacts_update on public.crm_contacts;
drop policy if exists crm_contacts_delete on public.crm_contacts;

create policy crm_contacts_select on public.crm_contacts for select
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_contacts_insert on public.crm_contacts for insert
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_contacts_update on public.crm_contacts for update
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']))
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_contacts_delete on public.crm_contacts for delete
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));

-- 3) Índices
create index if not exists crm_contacts_client_idx on public.crm_contacts (client_id);
create index if not exists crm_contacts_alive_idx
  on public.crm_contacts (deleted_at) where deleted_at is null;
-- Máximo un contacto principal vivo por cliente.
create unique index if not exists crm_contacts_one_primary_idx
  on public.crm_contacts (client_id) where is_primary and deleted_at is null;

-- 4) updated_at
drop trigger if exists crm_contacts_set_updated_at on public.crm_contacts;
create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row execute function public.set_updated_at();

-- 5) Backfill: un contacto principal por cada cliente vivo, desde el snapshot actual.
insert into public.crm_contacts (client_id, name, email, phone, is_primary, created_by)
select c.id, c.name, c.email, c.phone, true, c.created_by
from public.crm_clients c
where c.deleted_at is null
  and not exists (select 1 from public.crm_contacts k where k.client_id = c.id);
