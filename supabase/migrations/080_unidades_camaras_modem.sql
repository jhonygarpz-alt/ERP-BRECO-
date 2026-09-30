-- ============================================================================
-- Unidades: campos de Camaras y Modem, detras del feature flag
-- "unidades_camaras_modem" (solo aparecen para la empresa que lo tenga
-- activado en Super Admin > Empresas > Editar > Features personalizadas).
-- ============================================================================

alter table public.unidades add column if not exists numero_camaras integer not null default 0;
alter table public.unidades add column if not exists modem_internet boolean not null default false;
alter table public.unidades add column if not exists compania_modem text not null default '';
alter table public.unidades add column if not exists numero_recarga_modem text not null default '';
