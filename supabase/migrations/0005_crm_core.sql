-- CRM: clientes, historial de interacciones, planes (con corte/vencimiento) y pagos.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).
-- Reutiliza public.profiles y public.set_updated_at(), creados en 0001_editorial_portal.sql.

-- 1) crm_clients
create table if not exists public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text,
  phone text,
  status text not null default 'lead' check (status in ('lead', 'negociacion', 'activo', 'inactivo')),
  service text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_clients enable row level security;

drop policy if exists "crm_clients_admin_all" on public.crm_clients;
create policy "crm_clients_admin_all"
  on public.crm_clients for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_clients_status_idx on public.crm_clients (status);

drop trigger if exists crm_clients_set_updated_at on public.crm_clients;
create trigger crm_clients_set_updated_at
  before update on public.crm_clients
  for each row execute function public.set_updated_at();

-- 2) crm_client_history: bitácora/timeline por cliente (notas manuales + eventos automáticos)
create table if not exists public.crm_client_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  entry_type text not null default 'nota'
    check (entry_type in ('nota', 'llamada', 'reunion', 'email', 'pago', 'plan', 'cambio_estado', 'otro')),
  description text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.crm_client_history enable row level security;

drop policy if exists "crm_history_admin_all" on public.crm_client_history;
create policy "crm_history_admin_all"
  on public.crm_client_history for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_history_client_idx on public.crm_client_history (client_id, created_at desc);

-- 3) crm_plans: servicio recurrente por cliente, con día de corte y próxima fecha de vencimiento
create table if not exists public.crm_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  name text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  billing_cycle text not null default 'mensual' check (billing_cycle in ('mensual', 'trimestral', 'anual')),
  cutoff_day int not null check (cutoff_day between 1 and 31),
  next_due_date date not null,
  status text not null default 'activo' check (status in ('activo', 'pausado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_plans enable row level security;

drop policy if exists "crm_plans_admin_all" on public.crm_plans;
create policy "crm_plans_admin_all"
  on public.crm_plans for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_plans_client_idx on public.crm_plans (client_id);
create index if not exists crm_plans_due_date_idx on public.crm_plans (next_due_date);

drop trigger if exists crm_plans_set_updated_at on public.crm_plans;
create trigger crm_plans_set_updated_at
  before update on public.crm_plans
  for each row execute function public.set_updated_at();

-- 4) crm_payments: cargos puntuales, opcionalmente ligados a un plan recurrente
create table if not exists public.crm_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  plan_id uuid references public.crm_plans(id) on delete set null,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'vencido')),
  due_date date not null,
  paid_date date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.crm_payments enable row level security;

drop policy if exists "crm_payments_admin_all" on public.crm_payments;
create policy "crm_payments_admin_all"
  on public.crm_payments for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_payments_client_idx on public.crm_payments (client_id);
create index if not exists crm_payments_status_idx on public.crm_payments (status);
