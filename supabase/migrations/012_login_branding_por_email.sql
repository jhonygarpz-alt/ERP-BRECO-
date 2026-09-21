-- ============================================================================
-- Personaliza la pantalla de login por empresa: antes de iniciar sesion no
-- hay forma de saber a que empresa pertenece el usuario (las politicas RLS
-- de "empresas" exigen estar autenticado), asi que se agrega una funcion
-- publica y minima que, dado un email, regresa SOLO el nombre y el logo de
-- la empresa a la que pertenece -- nada mas (ni datos del usuario, ni de la
-- empresa). El frontend la llama mientras el usuario escribe su email en el
-- login, para mostrar el logo/nombre real de su empresa antes de que meta
-- su contrasena.
-- ============================================================================

create or replace function public.empresa_por_email(p_email text)
returns table(nombre text, logo_data_url text)
language sql
stable
security definer
set search_path = public
as $$
  select e.nombre, e.logo_data_url
  from public.usuarios u
  join public.empresas e on e.id = u.empresa_id
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.empresa_por_email(text) to anon, authenticated;
