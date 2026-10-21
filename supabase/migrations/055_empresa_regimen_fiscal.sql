-- ============================================================================
-- Regimen Fiscal del emisor (catalogo SAT c_RegimenFiscal), para el
-- encabezado de los CFDI impresos (Factura, Carta Porte, Nota de Credito,
-- Complemento de Pago).
-- ============================================================================

alter table public.empresas add column if not exists regimen_fiscal text not null default '';
