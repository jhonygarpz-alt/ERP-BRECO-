-- ============================================================================
-- Reserva el lugar para los datos de timbrado ante el SAT (folio fiscal,
-- numeros de serie de certificado, fecha de timbrado/certificacion, sellos
-- digitales) en los 4 documentos que son CFDI: Viajes con Carta Porte,
-- Facturas, Notas de Credito y Complementos de Pago.
--
-- El ERP hoy no se conecta a ningun PAC para timbrar, asi que esta columna
-- queda vacia ({}) hasta que se conecte uno; los formatos de impresion ya
-- muestran las cajas correspondientes (vacias por ahora) para cuando ese
-- timbrado real empiece a llenarlas.
-- ============================================================================

alter table public.viajes add column if not exists timbrado jsonb not null default '{}'::jsonb;
alter table public.facturas add column if not exists timbrado jsonb not null default '{}'::jsonb;
alter table public.notas_credito add column if not exists timbrado jsonb not null default '{}'::jsonb;
alter table public.pagos_cliente add column if not exists timbrado jsonb not null default '{}'::jsonb;
