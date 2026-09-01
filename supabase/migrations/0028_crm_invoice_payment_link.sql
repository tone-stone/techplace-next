-- Liga una factura al cobro (crm_payments) del que se generó. Permite marcar un
-- cobro como "ya facturado" y evita duplicados desde el botón "Generar factura"
-- en el panel de Pagos de la ficha del cliente.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_invoices
  add column if not exists payment_id uuid references public.crm_payments(id) on delete set null;

create index if not exists crm_invoices_payment_idx on public.crm_invoices (payment_id);
