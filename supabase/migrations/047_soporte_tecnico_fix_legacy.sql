-- ============================================================================
-- Corrige un bug de la migracion 046: los tickets creados ANTES de esa
-- migracion (mientras todavia no existia la columna usuario_id) quedaron
-- con usuario_id nulo. La politica de select/update de 046 exigia
-- "usuario_id = auth.uid()", asi que el propio cliente que abrio esos
-- tickets viejos ya no podia leerlos ni ver la respuesta del super admin.
--
-- Se agrega un respaldo: si el ticket no tiene usuario_id (caso legado),
-- cualquier usuario de esa misma empresa puede verlo/responderlo. Los
-- tickets nuevos (con usuario_id ya asignado por el trigger) siguen
-- restringidos a su propio dueño, sin cambio de comportamiento.
-- ============================================================================

drop policy if exists tickets_soporte_select on public.tickets_soporte;
create policy tickets_soporte_select on public.tickets_soporte for select
  using (usuario_id = auth.uid() or es_super_admin() or (usuario_id is null and empresa_id = current_empresa_id()));

drop policy if exists tickets_soporte_update on public.tickets_soporte;
create policy tickets_soporte_update on public.tickets_soporte for update
  using (usuario_id = auth.uid() or es_super_admin() or (usuario_id is null and empresa_id = current_empresa_id()))
  with check (usuario_id = auth.uid() or es_super_admin() or (usuario_id is null and empresa_id = current_empresa_id()));
