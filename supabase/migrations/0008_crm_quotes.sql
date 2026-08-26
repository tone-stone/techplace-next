-- CRM: cotizaciones independientes (no requieren cliente existente en el CRM).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.crm_quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid references public.crm_clients(id) on delete set null,
  client_name text not null,
  client_company text,
  client_email text,
  status text not null default 'borrador'
    check (status in ('borrador', 'enviada', 'aceptada', 'rechazada')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  notes text,
  valid_until date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_quotes enable row level security;

drop policy if exists "crm_quotes_admin_all" on public.crm_quotes;
create policy "crm_quotes_admin_all"
  on public.crm_quotes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_quotes_client_idx on public.crm_quotes (client_id);
create index if not exists crm_quotes_status_idx on public.crm_quotes (status);

drop trigger if exists crm_quotes_set_updated_at on public.crm_quotes;
create trigger crm_quotes_set_updated_at
  before update on public.crm_quotes
  for each row execute function public.set_updated_at();

create table if not exists public.crm_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.crm_quotes(id) on delete cascade,
  concept text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.crm_quote_items enable row level security;

drop policy if exists "crm_quote_items_admin_all" on public.crm_quote_items;
create policy "crm_quote_items_admin_all"
  on public.crm_quote_items for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists crm_quote_items_quote_idx on public.crm_quote_items (quote_id, position);

-- Now that crm_quotes exists, let invoices optionally record which quote they came
-- from. No conversion flow is built yet — this just leaves the column in place.
alter table public.crm_invoices add column if not exists quote_id uuid references public.crm_quotes(id) on delete set null;

-- Widen crm_client_history so quote events can log to the client timeline too
-- (only when a quote is linked to a real client — prospect-only quotes don't log).
alter table public.crm_client_history drop constraint if exists crm_client_history_entry_type_check;
alter table public.crm_client_history add constraint crm_client_history_entry_type_check
  check (entry_type in ('nota', 'llamada', 'reunion', 'email', 'pago', 'plan', 'cambio_estado', 'proyecto', 'factura', 'cotizacion', 'otro'));
