-- Modelo de equipos y roles: el CRM pasa a ser el admin general de toda la
-- app (CRM + blog + gestión de usuarios de ambos equipos), con dos equipos
-- de dos niveles cada uno: CRM (admin | operativo) y Blog (admin | redactor).
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard > SQL Editor > New query > Run).

-- 1) Columna team + backfill según el role actual (sin excepciones: todo
-- 'admin' actual pasa a CRM/admin, todo 'redactor' pasa a Blog/redactor).
alter table public.profiles add column if not exists team text;

update public.profiles set team = 'crm' where role = 'admin' and team is null;
update public.profiles set team = 'blog' where role = 'redactor' and team is null;

alter table public.profiles alter column team set default 'blog';
alter table public.profiles alter column team set not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'operativo', 'redactor'));

alter table public.profiles drop constraint if exists profiles_team_check;
alter table public.profiles add constraint profiles_team_check
  check (team in ('crm', 'blog'));

alter table public.profiles drop constraint if exists profiles_team_role_check;
alter table public.profiles add constraint profiles_team_role_check
  check (
    (team = 'crm' and role in ('admin', 'operativo'))
    or (team = 'blog' and role in ('admin', 'redactor'))
  );

-- 2) Cuentas nuevas: por defecto Blog/redactor (mismo criterio de menor
-- privilegio que ya existía) — el admin del CRM reasigna desde Usuarios.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, team, role)
  values (new.id, new.email, 'blog', 'redactor')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3) profiles: NO se agrega una política "select admin" aquí — 0002_fix_profiles_recursion.sql
-- ya la había eliminado porque una política de "profiles" que a su vez consulta
-- "profiles" causa "infinite recursion detected in policy for relation profiles"
-- en Postgres. La gestión de usuarios ya lee todos los perfiles con el cliente
-- service-role (createAdminClient(), que ignora RLS), así que no hace falta.

-- 4) articles / activity_log: admin del blog O admin del CRM (admin general).
drop policy if exists "articles_delete_admin" on public.articles;
create policy "articles_delete_admin"
  on public.articles for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and ((p.team = 'blog' and p.role = 'admin') or (p.team = 'crm' and p.role = 'admin'))
  ));

drop policy if exists "activity_select_admin" on public.activity_log;
create policy "activity_select_admin"
  on public.activity_log for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and ((p.team = 'blog' and p.role = 'admin') or (p.team = 'crm' and p.role = 'admin'))
  ));

-- 5) monitoring_events: admin del CRM (admin general).
drop policy if exists "monitoring_events_select_admin" on public.monitoring_events;
create policy "monitoring_events_select_admin"
  on public.monitoring_events for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'
  ));

drop policy if exists "monitoring_events_delete_admin" on public.monitoring_events;
create policy "monitoring_events_delete_admin"
  on public.monitoring_events for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'
  ));

-- 6) Las 9 tablas del CRM: antes una sola política "for all" exigía
-- role='admin'. Ahora select/insert/update permiten admin U operativo del
-- CRM; delete queda exclusivo del admin del CRM (aunque hoy la app no tiene
-- ninguna acción de borrado en el CRM, deja la base ya lista).

drop policy if exists "crm_clients_admin_all" on public.crm_clients;
drop policy if exists "crm_clients_select" on public.crm_clients;
create policy "crm_clients_select" on public.crm_clients for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_clients_insert" on public.crm_clients;
create policy "crm_clients_insert" on public.crm_clients for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_clients_update" on public.crm_clients;
create policy "crm_clients_update" on public.crm_clients for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_clients_delete" on public.crm_clients;
create policy "crm_clients_delete" on public.crm_clients for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_history_admin_all" on public.crm_client_history;
drop policy if exists "crm_history_select" on public.crm_client_history;
create policy "crm_history_select" on public.crm_client_history for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_history_insert" on public.crm_client_history;
create policy "crm_history_insert" on public.crm_client_history for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_history_update" on public.crm_client_history;
create policy "crm_history_update" on public.crm_client_history for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_history_delete" on public.crm_client_history;
create policy "crm_history_delete" on public.crm_client_history for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_plans_admin_all" on public.crm_plans;
drop policy if exists "crm_plans_select" on public.crm_plans;
create policy "crm_plans_select" on public.crm_plans for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_plans_insert" on public.crm_plans;
create policy "crm_plans_insert" on public.crm_plans for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_plans_update" on public.crm_plans;
create policy "crm_plans_update" on public.crm_plans for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_plans_delete" on public.crm_plans;
create policy "crm_plans_delete" on public.crm_plans for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_payments_admin_all" on public.crm_payments;
drop policy if exists "crm_payments_select" on public.crm_payments;
create policy "crm_payments_select" on public.crm_payments for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_payments_insert" on public.crm_payments;
create policy "crm_payments_insert" on public.crm_payments for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_payments_update" on public.crm_payments;
create policy "crm_payments_update" on public.crm_payments for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_payments_delete" on public.crm_payments;
create policy "crm_payments_delete" on public.crm_payments for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_projects_admin_all" on public.crm_projects;
drop policy if exists "crm_projects_select" on public.crm_projects;
create policy "crm_projects_select" on public.crm_projects for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_projects_insert" on public.crm_projects;
create policy "crm_projects_insert" on public.crm_projects for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_projects_update" on public.crm_projects;
create policy "crm_projects_update" on public.crm_projects for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_projects_delete" on public.crm_projects;
create policy "crm_projects_delete" on public.crm_projects for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_invoices_admin_all" on public.crm_invoices;
drop policy if exists "crm_invoices_select" on public.crm_invoices;
create policy "crm_invoices_select" on public.crm_invoices for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_invoices_insert" on public.crm_invoices;
create policy "crm_invoices_insert" on public.crm_invoices for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_invoices_update" on public.crm_invoices;
create policy "crm_invoices_update" on public.crm_invoices for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_invoices_delete" on public.crm_invoices;
create policy "crm_invoices_delete" on public.crm_invoices for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_quotes_admin_all" on public.crm_quotes;
drop policy if exists "crm_quotes_select" on public.crm_quotes;
create policy "crm_quotes_select" on public.crm_quotes for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quotes_insert" on public.crm_quotes;
create policy "crm_quotes_insert" on public.crm_quotes for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quotes_update" on public.crm_quotes;
create policy "crm_quotes_update" on public.crm_quotes for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quotes_delete" on public.crm_quotes;
create policy "crm_quotes_delete" on public.crm_quotes for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_quote_items_admin_all" on public.crm_quote_items;
drop policy if exists "crm_quote_items_select" on public.crm_quote_items;
create policy "crm_quote_items_select" on public.crm_quote_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quote_items_insert" on public.crm_quote_items;
create policy "crm_quote_items_insert" on public.crm_quote_items for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quote_items_update" on public.crm_quote_items;
create policy "crm_quote_items_update" on public.crm_quote_items for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_quote_items_delete" on public.crm_quote_items;
create policy "crm_quote_items_delete" on public.crm_quote_items for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));

drop policy if exists "crm_tasks_admin_all" on public.crm_tasks;
drop policy if exists "crm_tasks_select" on public.crm_tasks;
create policy "crm_tasks_select" on public.crm_tasks for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_tasks_insert" on public.crm_tasks;
create policy "crm_tasks_insert" on public.crm_tasks for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_tasks_update" on public.crm_tasks;
create policy "crm_tasks_update" on public.crm_tasks for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role in ('admin', 'operativo')));
drop policy if exists "crm_tasks_delete" on public.crm_tasks;
create policy "crm_tasks_delete" on public.crm_tasks for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = 'crm' and p.role = 'admin'));
