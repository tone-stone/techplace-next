-- CRM: quote extras — an editable issue date (fecha de creación) and a
-- free-text terms / legends block (leyendas ejecutivas) shown on the PDF and
-- the on-screen preview. Both are nullable-safe: reads fall back to
-- `created_at` / the default legends when the columns are missing.
-- Run the whole file in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run).

alter table public.crm_quotes add column if not exists issued_date date not null default current_date;
alter table public.crm_quotes add column if not exists terms text;
