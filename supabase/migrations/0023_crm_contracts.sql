-- Servicios y contratos: catálogo de servicios que ofrece la empresa, y
-- contratos por cliente con horas incluidas / SLA / vigencia. Esto es lo que
-- hace que un ticket signifique "incluido en contrato" vs "facturable"
-- (el consumo de horas llega en la migración de time tracking).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- ----------------------------------------------------------------------------
-- 1. crm_services: catálogo (una sola lista para toda la organización)
-- ----------------------------------------------------------------------------
create table if not exists public.crm_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit text not null default 'hora' check (unit in ('hora', 'mes', 'proyecto')),
  default_rate numeric(10, 2) not null default 0 check (default_rate >= 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.crm_services enable row level security;

-- ----------------------------------------------------------------------------
-- 2. crm_contracts: contrato por cliente
-- ----------------------------------------------------------------------------
create table if not exists public.crm_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  title text not null,
  status text not null default 'borrador'
    check (status in ('borrador', 'activo', 'suspendido', 'vencido', 'cancelado')),
  start_date date,
  end_date date,
  included_hours numeric(8, 2) check (included_hours is null or included_hours >= 0),
  sla_hours int check (sla_hours is null or sla_hours >= 0),
  billing_amount numeric(10, 2) check (billing_amount is null or billing_amount >= 0),
  billing_cycle text check (billing_cycle is null or billing_cycle in ('mensual', 'trimestral', 'anual')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.crm_contracts enable row level security;

-- ----------------------------------------------------------------------------
-- 3. crm_contract_services: líneas de servicio de un contrato
-- ----------------------------------------------------------------------------
create table if not exists public.crm_contract_services (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.crm_contracts(id) on delete cascade,
  service_id uuid not null references public.crm_services(id) on delete restrict,
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  rate numeric(10, 2) check (rate is null or rate >= 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.crm_contract_services enable row level security;

-- ----------------------------------------------------------------------------
-- 4. RLS: dios / admin / ejecutivo en las tres tablas (patrón de 0017)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['crm_services', 'crm_contracts', 'crm_contract_services'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format($f$create policy %I on public.%I for select
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, t || '_select', t);
    execute format($f$create policy %I on public.%I for insert
      with check (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, t || '_insert', t);
    execute format($f$create policy %I on public.%I for update
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))
      with check (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, t || '_update', t);
    execute format($f$create policy %I on public.%I for delete
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, t || '_delete', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 5. Índices y triggers
-- ----------------------------------------------------------------------------
create index if not exists crm_services_alive_idx
  on public.crm_services (deleted_at) where deleted_at is null;
create index if not exists crm_contracts_client_idx on public.crm_contracts (client_id);
create index if not exists crm_contracts_status_idx on public.crm_contracts (status);
create index if not exists crm_contracts_alive_idx
  on public.crm_contracts (deleted_at) where deleted_at is null;
create index if not exists crm_contract_services_contract_idx
  on public.crm_contract_services (contract_id);

drop trigger if exists crm_services_set_updated_at on public.crm_services;
create trigger crm_services_set_updated_at
  before update on public.crm_services
  for each row execute function public.set_updated_at();

drop trigger if exists crm_contracts_set_updated_at on public.crm_contracts;
create trigger crm_contracts_set_updated_at
  before update on public.crm_contracts
  for each row execute function public.set_updated_at();
