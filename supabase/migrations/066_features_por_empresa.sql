-- ============================================================================
-- Features personalizadas por empresa: a diferencia de modulos_contratados
-- (que prende/apaga un modulo COMPLETO), features_habilitadas permite
-- activar cambios puntuales (un campo, una seccion, un comportamiento) SOLO
-- para una empresa en particular, sin afectar a las demas. Un arreglo vacio
-- significa "ninguna feature personalizada" (comportamiento por defecto para
-- todas las empresas existentes). Ver src/lib/featureFlags.ts.
-- ============================================================================

alter table public.empresas add column if not exists features_habilitadas jsonb not null default '[]'::jsonb;
