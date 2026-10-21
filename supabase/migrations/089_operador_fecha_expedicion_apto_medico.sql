-- ============================================================================
-- Catalogo de Operadores: fecha de expedicion del Apto Medico, junto a su
-- vigencia (vencimiento) que ya existia.
-- ============================================================================

alter table public.operadores add column if not exists fecha_expedicion_apto_medico date;
