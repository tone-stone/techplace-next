-- IT Service Desk: tickets de soporte por cliente, con hilo de mensajes
-- (interno / público), bitácora de eventos y SLA básico (prioridad + fecha
-- objetivo calculada). Un ticket puede enlazarse a un contacto y a un activo.
-- Folio consecutivo TK-2026-001 (mismo esquema que facturas/cotizaciones).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- ----------------------------------------------------------------------------
-- 1. it_tickets
-- ----------------------------------------------------------------------------
create table if not exists public.it_tickets (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  asset_id uuid references public.it_assets(id) on delete set null,
  assignee_id uuid references auth.users(id) on delete set null,
  subject text not null,
  description text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'abierto', 'en_progreso', 'en_espera', 'resuelto', 'cerrado')),
  priority text not null default 'media'
    check (priority in ('baja', 'media', 'alta', 'critica')),
  category text,
  sla_due_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.it_tickets enable row level security;

-- ----------------------------------------------------------------------------
-- 2. it_ticket_messages: hilo de la conversación
-- ----------------------------------------------------------------------------
create table if not exists public.it_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.it_tickets(id) on delete cascade,
  body text not null,
  is_internal boolean not null default false,
  author_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.it_ticket_messages enable row level security;

-- ----------------------------------------------------------------------------
-- 3. it_ticket_events: bitácora inmutable (creado, cambio de estado, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.it_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.it_tickets(id) on delete cascade,
  kind text not null,
  detail text not null,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.it_ticket_events enable row level security;

-- ----------------------------------------------------------------------------
-- 4. RLS: dios / admin / ejecutivo en las tres tablas (patrón de 0017)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['it_tickets', 'it_ticket_messages', 'it_ticket_events'] loop
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
-- 5. Índices y trigger
-- ----------------------------------------------------------------------------
create index if not exists it_tickets_client_idx on public.it_tickets (client_id);
create index if not exists it_tickets_status_idx on public.it_tickets (status);
create index if not exists it_tickets_assignee_idx on public.it_tickets (assignee_id);
create index if not exists it_tickets_sla_idx on public.it_tickets (sla_due_at);
create index if not exists it_tickets_alive_idx
  on public.it_tickets (deleted_at) where deleted_at is null;
create index if not exists it_ticket_messages_ticket_idx
  on public.it_ticket_messages (ticket_id, created_at);
create index if not exists it_ticket_events_ticket_idx
  on public.it_ticket_events (ticket_id, created_at);

drop trigger if exists it_tickets_set_updated_at on public.it_tickets;
create trigger it_tickets_set_updated_at
  before update on public.it_tickets
  for each row execute function public.set_updated_at();
