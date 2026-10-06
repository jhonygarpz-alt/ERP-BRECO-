-- ============================================================================
-- Facturacion electronica (CFDI 4.0) via Facturama, API Multiemisor: cada
-- empresa (tenant) registra su propio CSD (certificado de sello digital)
-- directamente con el PAC, bajo su propio RFC -- el ERP nunca guarda el
-- certificado/llave privada, solo el estatus que regresa Facturama.
-- ============================================================================

alter table public.empresas add column if not exists facturama_ambiente text not null default 'sandbox'
  check (facturama_ambiente in ('sandbox', 'produccion'));
alter table public.empresas add column if not exists facturama_csd_registrado boolean not null default false;
alter table public.empresas add column if not exists facturama_csd_vigencia_hasta date;
alter table public.empresas add column if not exists facturama_csd_actualizado_en timestamptz;
