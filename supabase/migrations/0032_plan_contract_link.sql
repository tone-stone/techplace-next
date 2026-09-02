-- Liga el plan de cobro recurrente (crm_plans) con su servicio espejo
-- (crm_contracts) y con las tareas de mantenimiento que genera el cron.
-- Modelo "dos entidades ligadas": el plan factura, el servicio es el acuerdo;
-- se crean y se borran juntos.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- 1. Cada plan puede tener un servicio (contrato) espejo.
alter table public.crm_plans
  add column if not exists contract_id uuid references public.crm_contracts(id) on delete set null;
create index if not exists crm_plans_contract_idx on public.crm_plans (contract_id);

-- 2. Cada tarea puede venir de un plan (mantenimiento recurrente). Sirve para
--    no duplicar la tarea del mismo periodo.
alter table public.crm_tasks
  add column if not exists plan_id uuid references public.crm_plans(id) on delete set null;
create index if not exists crm_tasks_plan_period_idx on public.crm_tasks (plan_id, due_date);

-- 3. Una cotización aceptada puede convertirse en plan; se guarda el vínculo
--    para no generarlo dos veces.
alter table public.crm_quotes
  add column if not exists plan_id uuid references public.crm_plans(id) on delete set null;
