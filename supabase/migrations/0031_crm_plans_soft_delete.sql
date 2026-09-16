-- crm_plans gana borrado lógico (deleted_at / deleted_by), como el resto de
-- entidades CRM (ver 0018 y 0030). Habilita el botón "Eliminar plan" desde la
-- ficha del cliente y desde Cobranza > Próximos (p. ej. un plan duplicado).
-- Un plan eliminado deja de generar cargos y desaparece de todas las vistas.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_plans add column if not exists deleted_at timestamptz;
alter table public.crm_plans
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists crm_plans_alive_idx
  on public.crm_plans (deleted_at) where deleted_at is null;

-- Las políticas RLS de UPDATE (dios/admin/ejecutivo, ver 0017) ya cubren el
-- marcado de deleted_at; no hace falta tocar RLS.
