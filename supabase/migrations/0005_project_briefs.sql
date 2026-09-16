-- Brief de proyecto: respuestas del formulario de cotización (/cotizacion).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.project_briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'nuevo' check (status in ('nuevo', 'en revisión', 'cotizado', 'descartado')),

  -- Contacto y negocio
  full_name text not null,
  business_name text,
  email text not null,
  phone text not null,
  industry text,
  has_website boolean not null default false,
  current_website_url text,

  -- Tipo de proyecto y objetivos
  project_type text not null,
  project_goal text not null,
  target_audience text,
  problem_to_solve text,

  -- Alcance y funcionalidades
  pages_estimate text,
  features text[] not null default '{}',
  payment_gateway text,
  integrations text,

  -- Diseño y contenido
  has_branding text,
  reference_sites text,
  content_ready text,
  visual_style text,

  -- Aspectos técnicos
  has_domain_hosting text,
  tech_preference text,
  needs_maintenance text,

  -- Presupuesto y tiempos
  budget_range text not null,
  timeline text not null,
  additional_notes text
);

alter table public.project_briefs enable row level security;

-- Cualquier visitante (incluso sin sesión) puede enviar el formulario público.
drop policy if exists "project_briefs_insert_public" on public.project_briefs;
create policy "project_briefs_insert_public"
  on public.project_briefs for insert
  to anon, authenticated
  with check (true);

-- Solo el staff (perfiles registrados) puede leer las respuestas para cotizar.
drop policy if exists "project_briefs_select_staff" on public.project_briefs;
create policy "project_briefs_select_staff"
  on public.project_briefs for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Solo un admin puede actualizar el estado de seguimiento (nuevo/en revisión/cotizado/descartado).
drop policy if exists "project_briefs_update_admin" on public.project_briefs;
create policy "project_briefs_update_admin"
  on public.project_briefs for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists project_briefs_created_at_idx on public.project_briefs (created_at desc);
create index if not exists project_briefs_status_idx on public.project_briefs (status);

-- Las políticas RLS no bastan por sí solas: Postgres primero exige el privilegio
-- a nivel de tabla. Sin este GRANT, anon/authenticated reciben "permission denied"
-- antes de que la política de RLS siquiera se evalúe.
grant insert on public.project_briefs to anon, authenticated;
grant select, update on public.project_briefs to authenticated;
