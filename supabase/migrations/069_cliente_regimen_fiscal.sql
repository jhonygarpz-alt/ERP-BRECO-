-- ============================================================================
-- Catalogo de Clientes: agrega Regimen Fiscal (SAT), igual que ya existe en
-- los datos de la empresa, para poder timbrar correctamente el CFDI de cada
-- cliente.
-- ============================================================================

alter table public.clientes add column if not exists regimen_fiscal text not null default '';
