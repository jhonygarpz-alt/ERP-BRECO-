-- ============================================================================
-- Catalogo de Operadores: nuevo campo Fecha de Nacimiento.
-- ============================================================================

alter table public.operadores add column if not exists fecha_nacimiento date;
