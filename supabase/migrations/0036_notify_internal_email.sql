-- Notificaciones: lista explícita de correos que reciben los avisos internos
-- (resumen de cobranza, agenda diaria, cotización aceptada), además de los
-- perfiles dios/admin. Separados por coma o salto de línea.
-- Ejecutar completo en el SQL Editor de Supabase.

alter table public.app_settings
  add column if not exists notify_internal_email text;
