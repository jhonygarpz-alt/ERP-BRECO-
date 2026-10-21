-- ============================================================================
-- Catalogo de Rutas: el campo Tipo de Operacion deja de ser
-- Importacion/Exportacion y pasa a ser Local/Foraneo.
-- ============================================================================

alter table public.rutas drop constraint if exists rutas_tipo_operacion_check;

update public.rutas set tipo_operacion = 'Local' where tipo_operacion not in ('Local', 'Foraneo');

alter table public.rutas alter column tipo_operacion set default 'Local';
alter table public.rutas add constraint rutas_tipo_operacion_check check (tipo_operacion in ('Local', 'Foraneo'));
