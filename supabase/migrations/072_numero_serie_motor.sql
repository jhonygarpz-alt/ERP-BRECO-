-- ============================================================================
-- Unidades: renombrado conceptual "Numero de Serie" -> "Numero de Serie NIV"
-- (sin cambio de columna), mas nuevo campo "Numero de Serie Motor".
-- ============================================================================

alter table public.unidades add column if not exists numero_serie_motor text not null default '';
