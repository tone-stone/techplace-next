-- 0013_team_roles.sql volvió a crear "profiles_select_admin", una política de
-- profiles que consulta profiles dentro de su propio USING — exactamente el
-- bug que 0002_fix_profiles_recursion.sql ya había resuelto ("infinite
-- recursion detected in policy for relation profiles"). Rompía cualquier
-- tabla cuya política RLS mirara profiles (articles, crm_*, monitoring_events,
-- activity_log). La gestión de usuarios ya lee todos los perfiles con el
-- cliente service-role (createAdminClient(), que ignora RLS), así que esta
-- política nunca hizo falta.
drop policy if exists "profiles_select_admin" on public.profiles;
