-- ============================================================================
-- Captura de Viaje: se agrega el campo Foraneo, junto a Local. Las opciones
-- Importacion/Exportacion/Nacional se quitan de la captura (los campos
-- siguen existiendo en la base para no romper reportes/impresiones
-- existentes, pero ya no se capturan desde el formulario de Viaje).
-- ============================================================================

alter table public.viajes add column if not exists foraneo boolean not null default false;
