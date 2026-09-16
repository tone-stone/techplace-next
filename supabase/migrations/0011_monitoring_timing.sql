-- Monitoreo interno, fase 2: latencia de consultas/operaciones lentas.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.monitoring_events drop constraint if exists monitoring_events_kind_check;
alter table public.monitoring_events add constraint monitoring_events_kind_check
  check (kind in ('error', 'web_vital', 'timing'));

alter table public.monitoring_events add column if not exists duration_ms double precision;
