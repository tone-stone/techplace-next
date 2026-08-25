-- La política "profiles_select_admin" consulta la propia tabla profiles dentro de
-- su USING, lo que provoca "infinite recursion detected in policy for relation profiles".
-- Los admins ya leen todos los perfiles vía el cliente service-role en el servidor
-- (que ignora RLS), así que esta política no hace falta y solo causaba el error.
drop policy if exists "profiles_select_admin" on public.profiles;
