-- ============================================================================
-- Gastos de Viaje: detalle de combustible (tipo Diesel/Gasolina, litros
-- autorizados y precio por litro, para calcular el monto automaticamente
-- como litros x precio) y estatus (Activo/Cancelado) para poder "Cancelar"
-- un gasto sin borrarlo, igual que ya se hace con los viajes.
-- ============================================================================

alter table public.gastos_viaje
  add column if not exists combustible_tipo text,
  add column if not exists litros numeric(12, 3),
  add column if not exists precio_litro numeric(12, 4),
  add column if not exists estatus text not null default 'Activo';
