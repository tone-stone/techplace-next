-- Monitoreo interno: errores (cliente + servidor) y Web Vitals.
-- Fase 1 de la herramienta de monitoreo — tabla única con un `kind`
-- discriminador para que fases futuras (latencia, seguridad) la reutilicen.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.monitoring_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('error', 'web_vital')),
  source text not null check (source in ('client', 'server')),
  level text check (level in ('error', 'warning', 'info')),
  path text,
  route_type text,
  status_code int,
  message text,
  stack text,
  digest text,
  metric_name text,
  metric_value double precision,
  metric_rating text check (metric_rating in ('good', 'needs-improvement', 'poor')),
  user_agent text,
  user_id uuid references auth.users(id),
  meta jsonb not null default '{}'::jsonb
);

alter table public.monitoring_events enable row level security;

create index if not exists monitoring_events_created_at_idx on public.monitoring_events (created_at desc);
create index if not exists monitoring_events_kind_idx on public.monitoring_events (kind);

drop policy if exists "monitoring_events_select_admin" on public.monitoring_events;
create policy "monitoring_events_select_admin"
  on public.monitoring_events for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "monitoring_events_delete_admin" on public.monitoring_events;
create policy "monitoring_events_delete_admin"
  on public.monitoring_events for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Insert abierto a propósito: el sitio público (landing, blog) reporta errores
-- y Web Vitals sin sesión, igual que cualquier visitante anónimo.
drop policy if exists "monitoring_events_insert_any" on public.monitoring_events;
create policy "monitoring_events_insert_any"
  on public.monitoring_events for insert
  with check (true);
