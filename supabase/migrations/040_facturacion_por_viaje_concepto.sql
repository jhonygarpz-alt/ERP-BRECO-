-- ============================================================================
-- Facturacion se divide en dos submodulos (Por Viaje / Por Concepto), cada
-- uno con su propia pantalla de captura. Se agregan a "facturas" los campos
-- que le faltaban para eso: tipo (cual submodulo la genero), la lista
-- completa de viajes incluidos (antes solo guardaba uno), los datos de
-- encabezado tipo CFDI (sucursal, condiciones/forma/metodo de pago, uso
-- CFDI, tipo de cambio) y las lineas de factura editables (cantidad, precio
-- unitario, descuento, IVA, retencion).
-- ============================================================================

alter table public.facturas
  add column if not exists tipo text not null default 'Concepto' check (tipo in ('Viaje', 'Concepto')),
  add column if not exists viaje_ids jsonb not null default '[]',
  add column if not exists sucursal text not null default '',
  add column if not exists condiciones_pago text not null default 'CREDITO',
  add column if not exists forma_pago text not null default '',
  add column if not exists metodo_pago text not null default 'PPD',
  add column if not exists uso_cfdi text not null default 'G03',
  add column if not exists tipo_cambio numeric(12, 6) not null default 1,
  add column if not exists referencia text not null default '',
  add column if not exists solicitante text not null default '',
  add column if not exists lineas jsonb not null default '[]',
  add column if not exists subtotal numeric(14, 2) not null default 0,
  add column if not exists descuento_total numeric(14, 2) not null default 0;

-- Facturas ya existentes (todas se crearon desde el flujo viejo, ligadas a
-- un solo viaje): se marcan como "Por Viaje" y se les llena viaje_ids con su
-- propio viaje_id, para que sigan contando como facturadas en
-- viajesPendientesDeFacturar sin necesitar tocarlas a mano.
update public.facturas
set tipo = 'Viaje',
    viaje_ids = jsonb_build_array(viaje_id)
where viaje_id is not null and viaje_id <> '' and viaje_ids = '[]'::jsonb;
