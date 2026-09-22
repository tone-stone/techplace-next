-- Fuente del lead: de dónde llegó el prospecto que llenó /cotizacion,
-- para saber qué canal realmente trae clientes.
alter table public.project_briefs add column if not exists lead_source text;
