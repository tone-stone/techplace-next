-- CRM: tareas simples por proyecto, tablero de 3 columnas (sin drag-and-drop).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.crm_projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'por_hacer'
    check (status in ('por_hacer', 'en_progreso', 'terminado')),
  assignee text,
  due_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_tasks enable row level security;

drop policy if exists "crm_tasks_admin_all" on public.crm_tasks;
create policy "crm_tasks_admin_all"
  on public.crm_tasks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_tasks_project_idx on public.crm_tasks (project_id, status);

drop trigger if exists crm_tasks_set_updated_at on public.crm_tasks;
create trigger crm_tasks_set_updated_at
  before update on public.crm_tasks
  for each row execute function public.set_updated_at();

-- No crm_client_history widening here — tasks intentionally don't log to the
-- client timeline (see src/lib/crm/tasks.ts).
