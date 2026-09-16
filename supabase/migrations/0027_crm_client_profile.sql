-- Datos generales (no fiscales) del cliente: puesto del contacto, giro,
-- origen del lead, tamaño de la empresa, WhatsApp, ciudad y una dirección de
-- referencia. Todo opcional y nullable — la captura rápida de lead no cambia;
-- estos campos se llenan en el mismo formulario de cliente cuando se tengan.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_clients
  add column if not exists job_title text,
  add column if not exists industry text,
  add column if not exists source text,
  add column if not exists company_size text,
  add column if not exists whatsapp text,
  add column if not exists city text,
  add column if not exists address text;
