-- ============================================================================
-- Catalogo de Operadores: informacion medica adicional (Usa lentes,
-- Sobrepeso), junto a Diabetico/Hipertenso.
-- ============================================================================

alter table public.operadores add column if not exists usa_lentes boolean not null default false;
alter table public.operadores add column if not exists sobrepeso boolean not null default false;
