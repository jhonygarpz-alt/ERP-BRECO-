-- Agrega un color editable a cada estatus de viaje (catalogo estatus_viaje)
-- y ajusta los colores de los estatus que ya existen segun lo pedido.

alter table public.estatus_viaje add column if not exists color text not null default 'gray';

update public.estatus_viaje set color = 'amber' where nombre = 'Programado';
update public.estatus_viaje set color = 'green' where nombre = 'En transito';
update public.estatus_viaje set color = 'green' where nombre = 'Entregado';
update public.estatus_viaje set color = 'red' where nombre = 'Cancelado';
update public.estatus_viaje set color = 'red' where nombre = 'SIN OPERADOR';
update public.estatus_viaje set color = 'blue' where nombre = 'EN TRANSITO A CARGA';

drop policy if exists estatus_viaje_update on public.estatus_viaje;
create policy estatus_viaje_update on public.estatus_viaje for update
  using (has_permission('Viajes', 'crear') or has_permission('Viajes', 'editar'));
