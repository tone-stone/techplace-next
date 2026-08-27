-- Monitoreo interno, fase 3: eventos de seguridad (intentos de login fallidos).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.monitoring_events drop constraint if exists monitoring_events_kind_check;
alter table public.monitoring_events add constraint monitoring_events_kind_check
  check (kind in ('error', 'web_vital', 'timing', 'security'));
