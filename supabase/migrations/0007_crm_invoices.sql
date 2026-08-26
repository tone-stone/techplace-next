-- CRM: facturas reales, ligadas a un cliente y opcionalmente a un proyecto.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.crm_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  project_id uuid references public.crm_projects(id) on delete set null,
  number text not null unique,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'borrador'
    check (status in ('borrador', 'enviada', 'pagada', 'vencida')),
  issued_date date not null default current_date,
  due_date date not null,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_invoices enable row level security;

drop policy if exists "crm_invoices_admin_all" on public.crm_invoices;
create policy "crm_invoices_admin_all"
  on public.crm_invoices for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_invoices_client_idx on public.crm_invoices (client_id);
create index if not exists crm_invoices_status_idx on public.crm_invoices (status);
create index if not exists crm_invoices_due_date_idx on public.crm_invoices (due_date);

drop trigger if exists crm_invoices_set_updated_at on public.crm_invoices;
create trigger crm_invoices_set_updated_at
  before update on public.crm_invoices
  for each row execute function public.set_updated_at();

-- Widen crm_client_history so invoice events can log to the client timeline too.
alter table public.crm_client_history drop constraint if exists crm_client_history_entry_type_check;
alter table public.crm_client_history add constraint crm_client_history_entry_type_check
  check (entry_type in ('nota', 'llamada', 'reunion', 'email', 'pago', 'plan', 'cambio_estado', 'proyecto', 'factura', 'otro'));
