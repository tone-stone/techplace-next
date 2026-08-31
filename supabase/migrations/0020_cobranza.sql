-- CRM: motor de cobranza automática + tareas sueltas.
--  * crm_plans gana last_billed_date (idempotencia del cron que genera cargos).
--  * crm_payments gana marcas de recordatorio para no reenviar correos.
--  * crm_tasks: project_id deja de ser obligatorio y gana client_id, para poder
--    registrar tareas que no cuelgan de un proyecto.
--  * app_settings: una sola fila con la identidad de la organización y la
--    ventana de recordatorio de cobros (evita hardcodear "TechPlace").
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- ----------------------------------------------------------------------------
-- 1. crm_plans / crm_payments: soporte para el cron de cobranza
-- ----------------------------------------------------------------------------
alter table public.crm_plans add column if not exists last_billed_date date;

alter table public.crm_payments add column if not exists reminder_sent_at timestamptz;
alter table public.crm_payments add column if not exists overdue_notified_at timestamptz;

create index if not exists crm_plans_status_due_idx on public.crm_plans (status, next_due_date);
create index if not exists crm_payments_status_due_idx on public.crm_payments (status, due_date);

-- ----------------------------------------------------------------------------
-- 2. crm_tasks: tareas sueltas (sin proyecto) y opcionalmente ligadas a cliente
-- ----------------------------------------------------------------------------
alter table public.crm_tasks alter column project_id drop not null;
alter table public.crm_tasks
  add column if not exists client_id uuid references public.crm_clients(id) on delete set null;
create index if not exists crm_tasks_client_idx on public.crm_tasks (client_id);

-- ----------------------------------------------------------------------------
-- 3. app_settings: fila única de configuración de la organización
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id boolean primary key default true,
  org_name text not null default 'TechPlace',
  billing_from_email text,
  billing_reminder_lead_days int not null default 3 check (billing_reminder_lead_days between 0 and 60),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
drop policy if exists app_settings_update on public.app_settings;

create policy app_settings_select on public.app_settings for select
  using (public.current_role_name() is not null);
create policy app_settings_update on public.app_settings for update
  using (public.current_role_name() = any (array['dios', 'admin']))
  with check (public.current_role_name() = any (array['dios', 'admin']));

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();
