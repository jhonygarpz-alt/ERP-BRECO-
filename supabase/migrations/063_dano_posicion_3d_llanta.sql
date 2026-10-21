-- ============================================================================
-- Permite marcar un dano directamente sobre una posicion fija del diagrama
-- 3D (ej. 'llanta_delantera_izq') sin necesitar crear un UnidadHotspot --
-- asi, al registrar un dano de llanta y elegir su posicion, el diagrama
-- pinta de inmediato el punto de esa llanta en rojo.
-- ============================================================================

alter table public.unidad_danos
  add column if not exists posicion_3d text;
