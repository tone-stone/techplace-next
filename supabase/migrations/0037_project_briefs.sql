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
  -- Solo aplica cuando project_type = 'Sistema o plataforma a medida (CMS, CRM, ERP, etc.)'.
  system_type text,
  project_goal text not null,
  target_audience text,
  problem_to_solve text,

  -- Alcance y funcionalidades
  pages_estimate text,
  features text[] not null default '{}',
  payment_gateway text,
  integrations text[] not null default '{}',

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

-- Solo quien usa el núcleo del CRM (dios/admin/ejecutivo, ver canUseCrmCore en
-- src/lib/auth/roles.ts) puede leer las respuestas para cotizar — blog/redactor
-- no tienen por qué ver datos de contacto de clientes potenciales. Se excluye
-- también al staff dado de baja (soft delete de la migración 0018).
drop policy if exists "project_briefs_select_staff" on public.project_briefs;
create policy "project_briefs_select_staff"
  on public.project_briefs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.deleted_at is null and p.role in ('dios', 'admin', 'ejecutivo')
    )
  );

-- Mismo set que puede leer (canUseCrmCore) puede actualizar el estado de
-- seguimiento — igual que "Cotizaciones" formales, donde cualquier ejecutivo
-- gestiona el ciclo completo, no solo dios/admin.
drop policy if exists "project_briefs_update_admin" on public.project_briefs;
drop policy if exists "project_briefs_update_staff" on public.project_briefs;
create policy "project_briefs_update_staff"
  on public.project_briefs for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.deleted_at is null and p.role in ('dios', 'admin', 'ejecutivo')
    )
  );

create index if not exists project_briefs_created_at_idx on public.project_briefs (created_at desc);
create index if not exists project_briefs_status_idx on public.project_briefs (status);

-- Las políticas RLS no bastan por sí solas: Postgres primero exige el privilegio
-- a nivel de tabla. Sin este GRANT, anon/authenticated reciben "permission denied"
-- antes de que la política de RLS siquiera se evalúe.
grant insert on public.project_briefs to anon, authenticated;
grant select, update on public.project_briefs to authenticated;

-- Refinamiento del cuestionario: distinguir landing/corporativo de un sistema a
-- medida (CMS/CRM/ERP) y pasar "integraciones" de texto libre a checkboxes.
-- Idempotente para poder correr este archivo completo más de una vez.
alter table public.project_briefs add column if not exists system_type text;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'project_briefs'
      and column_name = 'integrations' and data_type = 'ARRAY'
  ) then
    alter table public.project_briefs
      alter column integrations type text[]
      using case
        when integrations is null or integrations = '' then '{}'::text[]
        else string_to_array(integrations, ',')
      end;
    alter table public.project_briefs alter column integrations set default '{}';
    alter table public.project_briefs alter column integrations set not null;
  end if;
end $$;
