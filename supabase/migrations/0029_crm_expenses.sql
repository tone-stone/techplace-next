-- Egresos: el dinero que sale (hosting, dominios, herramientas, subcontratación,
-- comisiones…). Opcionalmente ligado a un cliente, a su plan recurrente y/o al
-- cobro concreto que compensa, para poder ver el neto por cliente
-- (cobrado − gastado).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.crm_expenses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.crm_clients(id) on delete set null,
  plan_id uuid references public.crm_plans(id) on delete set null,
  payment_id uuid references public.crm_payments(id) on delete set null,
  category text not null default 'otro',
  concept text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  vendor text,
  method text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.crm_expenses enable row level security;

-- RLS: dios / admin / ejecutivo (mismo patrón que contratos/servicios, 0023).
drop policy if exists crm_expenses_select on public.crm_expenses;
drop policy if exists crm_expenses_insert on public.crm_expenses;
drop policy if exists crm_expenses_update on public.crm_expenses;
drop policy if exists crm_expenses_delete on public.crm_expenses;

create policy crm_expenses_select on public.crm_expenses for select
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_expenses_insert on public.crm_expenses for insert
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_expenses_update on public.crm_expenses for update
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']))
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy crm_expenses_delete on public.crm_expenses for delete
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));

create index if not exists crm_expenses_client_idx on public.crm_expenses (client_id);
create index if not exists crm_expenses_date_idx on public.crm_expenses (expense_date desc);
create index if not exists crm_expenses_alive_idx
  on public.crm_expenses (deleted_at) where deleted_at is null;

drop trigger if exists crm_expenses_set_updated_at on public.crm_expenses;
create trigger crm_expenses_set_updated_at
  before update on public.crm_expenses
  for each row execute function public.set_updated_at();

-- El timeline del cliente ya acepta 'egreso' (ver history.ts).
alter table public.crm_client_history drop constraint if exists crm_client_history_entry_type_check;
alter table public.crm_client_history add constraint crm_client_history_entry_type_check
  check (entry_type in (
    'nota', 'llamada', 'reunion', 'email', 'pago', 'plan', 'cambio_estado',
    'proyecto', 'factura', 'cotizacion', 'egreso', 'otro'
  ));
