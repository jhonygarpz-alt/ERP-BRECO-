-- ============================================================================
-- Catalogo de Remitentes-Destinatarios: se elimina el campo No. Equivalencia.
-- ============================================================================

alter table public.destinatarios drop column if exists no_equivalencia;
