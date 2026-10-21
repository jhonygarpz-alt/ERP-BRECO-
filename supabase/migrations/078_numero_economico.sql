-- ============================================================================
-- Unidades y Remolques: nuevo campo "Numero Economico" (texto libre, junto a
-- Placas), independiente del "Codigo" interno (economico) que ya existia.
-- ============================================================================

alter table public.unidades add column if not exists numero_economico text not null default '';
alter table public.cajas add column if not exists numero_economico text not null default '';
