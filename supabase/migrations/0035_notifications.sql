-- Notificaciones: canal de WhatsApp (Twilio) además del correo, y una agenda
-- diaria de recordatorios internos (tareas / proyectos / SLAs de soporte).
-- Todo cuelga de la fila única app_settings. El CRM funciona sin esto; sin las
-- columnas, el código cae a los valores por defecto de abajo.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.app_settings
  add column if not exists notify_whatsapp_enabled boolean not null default false;

-- Números (E.164 o 10 dígitos MX) que reciben las alertas internas por WhatsApp:
-- resumen de cobranza, cotización aceptada y la agenda diaria. Separados por
-- coma, espacio o salto de línea. Los correos internos siguen yendo a dios/admin.
alter table public.app_settings
  add column if not exists notify_internal_whatsapp text;

-- Ventana (en días) hacia adelante que mira la agenda diaria para avisar de
-- tareas, proyectos y SLAs de soporte próximos a vencer.
alter table public.app_settings
  add column if not exists agenda_reminder_lead_days int not null default 2
    check (agenda_reminder_lead_days between 0 and 30);
