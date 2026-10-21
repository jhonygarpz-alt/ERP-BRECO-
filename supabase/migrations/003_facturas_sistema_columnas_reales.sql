-- ============================================================================
-- Ajusta facturas_sistema a las columnas reales de la hoja BASE_DATOS del
-- Excel "Facturacion Diaria por Sistema", y agrega permisos de
-- insert/update a facturas_sistema, gastos_mantenimiento y
-- tanque_movimientos -- ahora se llenan importando el Excel real desde el
-- frontend (Reportes Operativos > Importar Excel), no con una Edge
-- Function.
--
-- Correr una sola vez en el SQL Editor de Supabase. Es seguro de correr
-- aunque ya hayas corrido schema.sql antes: usa "add column if not exists"
-- y "drop policy if exists" + "create policy".
-- ============================================================================

alter table public.facturas_sistema
  alter column total_factura type numeric(14, 2),
  add column if not exists saldo_pendiente numeric(14, 2) not null default 0,
  add column if not exists estado_pedido text not null default '',
  add column if not exists moneda text not null default '',
  add column if not exists tipo_cambio numeric(10, 4) not null default 0,
  add column if not exists tarifa numeric(14, 2) not null default 0,
  add column if not exists adicional numeric(14, 2) not null default 0,
  add column if not exists total_tarifa numeric(14, 2) not null default 0,
  add column if not exists utilidad numeric(14, 2) not null default 0;

drop policy if exists facturas_sistema_insert on public.facturas_sistema;
create policy facturas_sistema_insert on public.facturas_sistema for insert with check (has_permission('Reportes', 'crear'));
drop policy if exists facturas_sistema_update on public.facturas_sistema;
create policy facturas_sistema_update on public.facturas_sistema for update using (has_permission('Reportes', 'crear'));

drop policy if exists gastos_mantenimiento_insert on public.gastos_mantenimiento;
create policy gastos_mantenimiento_insert on public.gastos_mantenimiento for insert with check (has_permission('Reportes', 'crear'));
drop policy if exists gastos_mantenimiento_update on public.gastos_mantenimiento;
create policy gastos_mantenimiento_update on public.gastos_mantenimiento for update using (has_permission('Reportes', 'crear'));

drop policy if exists tanque_movimientos_insert on public.tanque_movimientos;
create policy tanque_movimientos_insert on public.tanque_movimientos for insert with check (has_permission('Reportes', 'crear'));
drop policy if exists tanque_movimientos_update on public.tanque_movimientos;
create policy tanque_movimientos_update on public.tanque_movimientos for update using (has_permission('Reportes', 'crear'));
