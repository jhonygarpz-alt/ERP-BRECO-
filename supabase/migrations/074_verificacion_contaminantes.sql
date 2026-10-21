-- ============================================================================
-- Unidades: Dictamen de Verificacion de Baja Emision de Contaminantes
-- (misma estructura que la Inspeccion Fisicomecanica: ultima fecha, proxima
-- fecha y proveedor que la realizo). Solo aplica a Unidades (motor propio);
-- los remolques no tienen motor.
-- ============================================================================

alter table public.unidades add column if not exists ultima_verificacion_contaminantes text not null default '';
alter table public.unidades add column if not exists proxima_verificacion_contaminantes text not null default '';
alter table public.unidades add column if not exists proveedor_verificacion_contaminantes_id text references public.proveedores (id) on delete set null;
