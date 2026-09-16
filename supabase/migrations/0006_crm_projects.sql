-- CRM: proyectos reales, ligados a un cliente.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.crm_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planeacion'
    check (status in ('planeacion', 'en_progreso', 'revision', 'completado')),
  progress int not null default 0 check (progress between 0 and 100),
  budget numeric(10, 2) not null default 0 check (budget >= 0),
  due_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_projects enable row level security;

drop policy if exists "crm_projects_admin_all" on public.crm_projects;
create policy "crm_projects_admin_all"
  on public.crm_projects for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_projects_client_idx on public.crm_projects (client_id);
create index if not exists crm_projects_status_idx on public.crm_projects (status);

drop trigger if exists crm_projects_set_updated_at on public.crm_projects;
create trigger crm_projects_set_updated_at
  before update on public.crm_projects
  for each row execute function public.set_updated_at();

-- Widen crm_client_history so project events can log to the client timeline too.
-- NOTE: if the auto-generated constraint name below doesn't match what's actually
-- in your database, look it up first (information_schema.check_constraints) and
-- adjust before running.
alter table public.crm_client_history drop constraint if exists crm_client_history_entry_type_check;
alter table public.crm_client_history add constraint crm_client_history_entry_type_check
  check (entry_type in ('nota', 'llamada', 'reunion', 'email', 'pago', 'plan', 'cambio_estado', 'proyecto', 'otro'));
