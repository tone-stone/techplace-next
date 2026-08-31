-- Time tracking: horas trabajadas registradas contra un ticket. El rollup
-- mensual por cliente (suma de minutos de los tickets de ese cliente en el
-- mes en curso) se compara contra las horas incluidas del contrato para
-- distinguir trabajo incluido vs facturable. Todavía no factura nada.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.it_ticket_time_entries (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.it_tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  minutes int not null check (minutes > 0),
  description text,
  worked_on date not null default current_date,
  billable boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

alter table public.it_ticket_time_entries enable row level security;

drop policy if exists it_time_entries_select on public.it_ticket_time_entries;
drop policy if exists it_time_entries_insert on public.it_ticket_time_entries;
drop policy if exists it_time_entries_update on public.it_ticket_time_entries;
drop policy if exists it_time_entries_delete on public.it_ticket_time_entries;

create policy it_time_entries_select on public.it_ticket_time_entries for select
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_time_entries_insert on public.it_ticket_time_entries for insert
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_time_entries_update on public.it_ticket_time_entries for update
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']))
  with check (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));
create policy it_time_entries_delete on public.it_ticket_time_entries for delete
  using (public.current_role_name() = any (array['dios', 'admin', 'ejecutivo']));

create index if not exists it_time_entries_ticket_idx on public.it_ticket_time_entries (ticket_id);
create index if not exists it_time_entries_worked_idx on public.it_ticket_time_entries (worked_on);
create index if not exists it_time_entries_alive_idx
  on public.it_ticket_time_entries (deleted_at) where deleted_at is null;
