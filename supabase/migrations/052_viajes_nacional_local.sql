-- ============================================================================
-- Agrega "Nacional" y "Local" a Asignacion de Viajes, junto a los ya
-- existentes "Importacion" / "Exportacion", para clasificar el tipo de
-- viaje/carta porte.
-- ============================================================================

alter table public.viajes
  add column if not exists nacional boolean not null default false,
  add column if not exists local boolean not null default false;
