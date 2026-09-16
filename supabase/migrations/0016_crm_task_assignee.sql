-- CRM tareas: asignación a un usuario real (no solo texto libre) para poder
-- filtrar "mis tareas" entre proyectos. Se conserva la columna `assignee`
-- de texto para filas antiguas y notas libres.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

alter table public.crm_tasks
  add column if not exists assignee_id uuid references auth.users(id) on delete set null;

create index if not exists crm_tasks_assignee_idx on public.crm_tasks (assignee_id);
