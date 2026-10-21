-- ============================================================================
-- Unidades y Remolques: nuevo campo "Eje de la llanta" (Direccion/Diferencial),
-- independiente del "Tipo de llanta" (patron de banda) que ya existia.
-- ============================================================================

alter table public.unidades add column if not exists eje_llanta text not null default '';
alter table public.cajas add column if not exists eje_llanta text not null default '';
