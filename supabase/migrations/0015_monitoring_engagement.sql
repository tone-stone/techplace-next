-- Monitoreo interno, fase 4: engagement de visitantes (tiempo por sección,
-- profundidad de scroll) e interacciones (clicks en CTAs, embudo del
-- formulario de contacto). Reutiliza monitoring_events con dos `kind` nuevos;
-- el detalle va en `meta` (visitId anónimo por sesión, sección, CTA, paso).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.monitoring_events drop constraint if exists monitoring_events_kind_check;
alter table public.monitoring_events add constraint monitoring_events_kind_check
  check (kind in ('error', 'web_vital', 'timing', 'security', 'engagement', 'interaction'));

-- El dashboard filtra siempre por (kind, metric_name) sobre una ventana
-- reciente; este índice cubre esas consultas de agregación.
create index if not exists monitoring_events_kind_metric_created_idx
  on public.monitoring_events (kind, metric_name, created_at desc);
