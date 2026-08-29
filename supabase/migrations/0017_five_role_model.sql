-- Modelo de permisos plano de 5 roles, reemplaza el modelo team+role de 0013.
-- Roles: dios | admin | ejecutivo | blog | redactor.
-- Solo actualiza filas y reescribe políticas/constraints; NO borra ninguna fila.
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- ----------------------------------------------------------------------------
-- 1. profiles: remapear role (team se elimina AL FINAL, tras soltar las
--    políticas que dependen de esa columna)
-- ----------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_team_role_check;
alter table public.profiles drop constraint if exists profiles_team_check;
alter table public.profiles drop constraint if exists profiles_role_check;

-- Orden importante: (crm,admin) se queda como 'admin'.
update public.profiles set role = 'ejecutivo' where team = 'crm'  and role = 'operativo';
update public.profiles set role = 'blog'      where team = 'blog' and role = 'admin';
-- (blog,redactor) ya vale 'redactor'; (crm,admin) ya vale 'admin'.

update public.profiles set role = 'dios'
  where lower(email) in ('ing.antoniovilla@outlook.com', 'anarquiles@gmail.com');

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('dios', 'admin', 'ejecutivo', 'blog', 'redactor'));

-- Nuevos registros de auth: rol mínimo; createUserAction fija el rol real después.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'redactor')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Helpers SECURITY DEFINER (sin RLS -> evitan la recursión que rompió
--    profiles_select_admin en 0002/0014).
-- ----------------------------------------------------------------------------

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Nombres de proyecto para roles sin el módulo Proyectos (blog/redactor los
-- necesitan en el módulo Tareas). No expone presupuesto ni el resto de columnas.
create or replace function public.crm_project_names()
returns table(id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select id, name from public.crm_projects
$$;

-- ----------------------------------------------------------------------------
-- 3. Reescritura de todas las políticas RLS en términos de current_role_name()
-- ----------------------------------------------------------------------------

-- 3a. Tablas CRM: se BORRAN TODAS sus políticas (cualquier nombre heredado de
--     0005-0013) y se recrean las 4 de CRUD.
do $$
declare
  pol record;
  tname text;
  core text[] := array['crm_clients','crm_projects','crm_plans','crm_client_history','crm_quotes','crm_quote_items'];
  bill text[] := array['crm_invoices','crm_payments'];
begin
  -- Borra toda política existente en las 9 tablas CRM (cualquier nombre).
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'crm_clients','crm_projects','crm_plans','crm_client_history',
        'crm_quotes','crm_quote_items','crm_invoices','crm_payments','crm_tasks'
      )
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;

  -- CRM núcleo: dios / admin / ejecutivo (CRUD completo).
  foreach tname in array core loop
    execute format($f$create policy %I on public.%I for select
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, tname || '_select', tname);
    execute format($f$create policy %I on public.%I for insert
      with check (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, tname || '_insert', tname);
    execute format($f$create policy %I on public.%I for update
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))
      with check (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, tname || '_update', tname);
    execute format($f$create policy %I on public.%I for delete
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, tname || '_delete', tname);
  end loop;

  -- Facturación: ejecutivo solo lectura.
  foreach tname in array bill loop
    execute format($f$create policy %I on public.%I for select
      using (public.current_role_name() = any (array['dios','admin','ejecutivo']))$f$, tname || '_select', tname);
    execute format($f$create policy %I on public.%I for insert
      with check (public.current_role_name() = any (array['dios','admin']))$f$, tname || '_insert', tname);
    execute format($f$create policy %I on public.%I for update
      using (public.current_role_name() = any (array['dios','admin']))
      with check (public.current_role_name() = any (array['dios','admin']))$f$, tname || '_update', tname);
    execute format($f$create policy %I on public.%I for delete
      using (public.current_role_name() = any (array['dios','admin']))$f$, tname || '_delete', tname);
  end loop;
end $$;

-- 3c. crm_tasks: lectura/escritura para cualquier rol; delete para
--     dios/admin/blog o el creador.
create policy crm_tasks_select on public.crm_tasks for select
  using (public.current_role_name() is not null);
create policy crm_tasks_insert on public.crm_tasks for insert
  with check (public.current_role_name() is not null);
create policy crm_tasks_update on public.crm_tasks for update
  using (public.current_role_name() is not null)
  with check (public.current_role_name() is not null);
create policy crm_tasks_delete on public.crm_tasks for delete
  using (
    public.current_role_name() = any (array['dios','admin','blog'])
    or created_by = auth.uid()
  );

-- 3d. articles: staff = dios/admin/blog/redactor (redactor ya puede borrar).
--     articles_select_published (anónimo) se deja intacta.
drop policy if exists articles_select_staff on public.articles;
drop policy if exists articles_insert_staff on public.articles;
drop policy if exists articles_update_staff on public.articles;
drop policy if exists articles_delete_admin on public.articles;
drop policy if exists articles_delete_staff on public.articles;

create policy articles_select_staff on public.articles for select
  using (public.current_role_name() = any (array['dios','admin','blog','redactor']));
create policy articles_insert_staff on public.articles for insert
  with check (public.current_role_name() = any (array['dios','admin','blog','redactor']));
create policy articles_update_staff on public.articles for update
  using (public.current_role_name() = any (array['dios','admin','blog','redactor']))
  with check (public.current_role_name() = any (array['dios','admin','blog','redactor']));
create policy articles_delete_staff on public.articles for delete
  using (public.current_role_name() = any (array['dios','admin','blog','redactor']));

-- 3e. activity_log SELECT: dios/admin/blog (activity_insert_self se deja).
drop policy if exists activity_select_admin on public.activity_log;
create policy activity_select_admin on public.activity_log for select
  using (public.current_role_name() = any (array['dios','admin','blog']));

-- 3f. monitoring_events: SELECT/DELETE dios/admin (INSERT abierto se deja).
drop policy if exists monitoring_events_select_admin on public.monitoring_events;
drop policy if exists monitoring_events_delete_admin on public.monitoring_events;
create policy monitoring_events_select_admin on public.monitoring_events for select
  using (public.current_role_name() = any (array['dios','admin']));
create policy monitoring_events_delete_admin on public.monitoring_events for delete
  using (public.current_role_name() = any (array['dios','admin']));

-- 3g. storage.objects (bucket blog-media): insert/delete dios/admin/blog/redactor
--     (blog_media_public_read se deja).
drop policy if exists blog_media_staff_insert on storage.objects;
drop policy if exists blog_media_staff_delete on storage.objects;
create policy blog_media_staff_insert on storage.objects for insert
  with check (
    bucket_id = 'blog-media'
    and public.current_role_name() = any (array['dios','admin','blog','redactor'])
  );
create policy blog_media_staff_delete on storage.objects for delete
  using (
    bucket_id = 'blog-media'
    and public.current_role_name() = any (array['dios','admin','blog','redactor'])
  );

-- ----------------------------------------------------------------------------
-- 4. Ya sin políticas que dependan de profiles.team: eliminar la columna.
-- ----------------------------------------------------------------------------
alter table public.profiles drop column if exists team;
