-- Permite que cada artículo tenga una firma/autor editable, independiente
-- del nombre de la cuenta que lo creó (ej. "Equipo TechPlace").
alter table public.articles add column if not exists author_name text not null default 'Equipo TechPlace';
