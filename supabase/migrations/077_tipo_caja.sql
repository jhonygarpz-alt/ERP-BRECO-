-- ============================================================================
-- Remolques (cajas): nuevo campo "Tipo de Caja" (Portacontenedor / Caja Seca).
-- ============================================================================

alter table public.cajas add column if not exists tipo_caja text not null default '';
