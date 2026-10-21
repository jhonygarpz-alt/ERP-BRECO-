-- ============================================================================
-- Catalogo de Operadores: nuevo campo Edad.
-- ============================================================================

alter table public.operadores add column if not exists edad integer not null default 0;
