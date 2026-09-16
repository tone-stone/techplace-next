-- Egresos: estado pendiente / pagado. Un egreso programado (p. ej. la
-- renovación del dominio que se paga el 18/09) no debe afectar las cuentas
-- generales (Neto, Resumen, gráfica) hasta que se confirme el pago.
-- Los egresos existentes se dan por 'pagado' para no cambiar los totales.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_expenses
  add column if not exists status text not null default 'pagado'
    check (status in ('pendiente', 'pagado'));
alter table public.crm_expenses add column if not exists paid_date date;

create index if not exists crm_expenses_status_idx
  on public.crm_expenses (status) where deleted_at is null;
