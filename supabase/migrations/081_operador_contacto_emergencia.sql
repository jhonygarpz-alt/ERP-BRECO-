-- ============================================================================
-- Catalogo de Operadores: Contacto de Emergencia (Nombre, Parentesco,
-- Numero de telefono), justo despues de Fecha de Nacimiento.
-- ============================================================================

alter table public.operadores add column if not exists contacto_emergencia_nombre text not null default '';
alter table public.operadores add column if not exists contacto_emergencia_parentesco text not null default '';
alter table public.operadores add column if not exists contacto_emergencia_telefono text not null default '';
