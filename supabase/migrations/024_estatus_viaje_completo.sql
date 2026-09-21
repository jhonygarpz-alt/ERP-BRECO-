-- ============================================================================
-- Catalogo de Estatus de Viaje: agrega Activo y las 3 clasificaciones
-- (Carga / Descarga / Termino Descarga) para poder administrarlo como
-- catalogo completo (Agregar/Modificar/Eliminar), ademas del alta rapida
-- que ya existia dentro del modal de Nuevo/Editar Viaje.
-- ============================================================================

alter table public.estatus_viaje
  add column if not exists activo boolean not null default true,
  add column if not exists es_carga boolean not null default false,
  add column if not exists es_descarga boolean not null default false,
  add column if not exists es_termino_descarga boolean not null default false;
