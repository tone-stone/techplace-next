-- Datos fiscales y de facturación del cliente (receptor CFDI 4.0) + domicilio.
-- Todo es aditivo y nullable: las altas rápidas de lead siguen igual. Estos
-- campos se llenan desde el panel "Datos fiscales y facturación" en la ficha
-- del cliente cuando el lead ya es un cliente que paga, y de ahí se prellenan
-- las facturas.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_clients
  add column if not exists tax_name text,
  add column if not exists rfc text,
  add column if not exists tax_regime text,
  add column if not exists tax_zip text,
  add column if not exists cfdi_use text,
  add column if not exists billing_email text,
  add column if not exists payment_form text,
  add column if not exists payment_method text,
  add column if not exists payment_terms_days int,
  add column if not exists currency text not null default 'MXN',
  add column if not exists address_street text,
  add column if not exists address_ext text,
  add column if not exists address_int text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_country text not null default 'México',
  add column if not exists website text;

-- Método de pago CFDI: PUE (una exhibición) o PPD (parcialidades / diferido).
alter table public.crm_clients
  drop constraint if exists crm_clients_payment_method_check;
alter table public.crm_clients
  add constraint crm_clients_payment_method_check
  check (payment_method is null or payment_method in ('PUE', 'PPD'));

alter table public.crm_clients
  drop constraint if exists crm_clients_payment_terms_days_check;
alter table public.crm_clients
  add constraint crm_clients_payment_terms_days_check
  check (payment_terms_days is null or payment_terms_days >= 0);
