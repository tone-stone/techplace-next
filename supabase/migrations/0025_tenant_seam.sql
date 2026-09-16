-- Costura de multi-tenant: la base para escalar a SaaS más adelante SIN
-- reescribir RLS todavía. Introduce el concepto de "organización", lo cuelga de
-- cada cuenta (profiles.org_id) y expone public.current_org_id() al estilo de
-- public.current_role_name().
--
-- Por ahora hay UNA sola organización (TechPlace) y NINGUNA política filtra por
-- ella: el comportamiento no cambia. Cuando entre el segundo cliente se hace el
-- milestone completo (org_id en toda tabla de negocio + backfill + reescribir
-- las ~70 políticas para incluir `org_id = public.current_org_id()`). La receta
-- está documentada en supabase/README.md.

-- ----------------------------------------------------------------------------
-- 1. organizations
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

drop policy if exists organizations_select on public.organizations;
drop policy if exists organizations_write on public.organizations;

-- Cualquier cuenta con rol válido ve su(s) organización(es); solo `dios` escribe.
create policy organizations_select on public.organizations for select
  using (public.current_role_name() is not null);
create policy organizations_write on public.organizations for all
  using (public.current_role_name() = 'dios')
  with check (public.current_role_name() = 'dios');

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- Organización de TechPlace (idempotente).
insert into public.organizations (name, slug)
values ('TechPlace', 'techplace')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. profiles.org_id + backfill
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists org_id uuid references public.organizations(id);

update public.profiles
set org_id = (select id from public.organizations order by created_at asc limit 1)
where org_id is null;

-- ----------------------------------------------------------------------------
-- 3. Cuentas nuevas -> la organización por defecto (la más antigua mientras
--    solo haya una). Reemplaza handle_new_user() de 0017 añadiendo org_id.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, org_id)
  values (
    new.id,
    new.email,
    'redactor',
    (select id from public.organizations order by created_at asc limit 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. current_org_id(): organización de la cuenta firmada (null si desactivada).
--    SECURITY DEFINER -> sin RLS, igual que current_role_name() (evita recursión).
-- ----------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid() and deleted_at is null
$$;
