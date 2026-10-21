-- ============================================================================
-- Permisos finos por pantalla (Rol.permisosPantalla): agrega la columna
-- donde se guardan los overrides de Ver/Crear/Editar/Eliminar por pantalla
-- individual dentro de un modulo (ej. ocultar "Proveedores" a un rol que si
-- tiene acceso al modulo "Catalogos" completo).
--
-- Es puramente aditivo y de compatibilidad total: si un rol no tiene nada en
-- esta columna (el default '{}'), su comportamiento no cambia en absoluto --
-- sigue regido solo por el permiso de modulo de siempre (columna `permisos`).
-- Esta columna NO participa en ninguna politica de RLS: la seguridad real en
-- la base de datos sigue siendo por modulo completo; esto solo controla que
-- el usuario ve/usa en la interfaz.
-- ============================================================================

alter table public.roles
  add column if not exists permisos_pantalla jsonb not null default '{}'::jsonb;
