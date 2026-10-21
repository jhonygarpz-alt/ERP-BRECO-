-- ============================================================================
-- Multi-empresa (multi-tenant): cada empresa ve, crea y edita solo sus
-- propios datos. Reemplaza la fila unica "empresa" por una tabla "empresas"
-- (una fila por cliente de la plataforma), agrega "empresa_id" a cada
-- tabla operativa (con un trigger que lo autocompleta segun quien esta
-- conectado, para que el frontend no tenga que mandarlo nunca) y reescribe
-- las politicas RLS para exigir "empresa_id = current_empresa_id()" ademas
-- del permiso de siempre. Se agrega tambien un rol "super admin" (el dueno
-- de la plataforma) que puede ver y crear empresas y su primer usuario,
-- sin pertenecer el mismo a ninguna empresa.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla empresas (reemplaza el singleton "empresa")
-- ----------------------------------------------------------------------------

create table if not exists public.empresas (
  id text primary key,
  nombre text not null,
  razon_social text not null default '',
  rfc text not null default '',
  direccion text not null default '',
  telefono text not null default '',
  email text not null default '',
  sitio_web text not null default '',
  logo_data_url text not null default '',
  estatus text not null default 'activa' check (estatus in ('activa', 'inactiva')),
  creado_en timestamptz not null default now()
);

-- Migra la fila unica de "empresa" (si existe) como la primera empresa real
-- (BRECO); si el proyecto es nuevo y esa tabla no tiene filas, siembra un
-- registro base con el mismo id para que todo lo de abajo tenga a donde
-- apuntar. Se guarda contra reejecutar esta migracion despues de que la
-- seccion 7 ya elimino la tabla "empresa".
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'empresa') then
    insert into public.empresas (id, nombre, razon_social, rfc, direccion, telefono, email, sitio_web, logo_data_url)
    select 'emp-breco', nombre, razon_social, rfc, direccion, telefono, email, sitio_web, logo_data_url
    from public.empresa where id = 'main'
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.empresas (id, nombre) values ('emp-breco', 'BRECO Transportes')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. usuarios: empresa_id (nullable solo para super admins) + es_super_admin
--    (va antes que los helpers de abajo porque sus funciones SQL los leen
--    directo, y Postgres valida esas columnas al crear la funcion)
-- ----------------------------------------------------------------------------

alter table public.usuarios add column if not exists empresa_id text references public.empresas (id) on delete set null;
alter table public.usuarios add column if not exists es_super_admin boolean not null default false;

update public.usuarios set empresa_id = 'emp-breco' where empresa_id is null and es_super_admin = false;

-- ----------------------------------------------------------------------------
-- 3. Helpers de tenant
-- ----------------------------------------------------------------------------

create or replace function public.current_empresa_id() returns text
language sql stable security definer set search_path = public as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.es_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select es_super_admin from public.usuarios where id = auth.uid()), false);
$$;

create or replace function public.set_empresa_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.empresa_id is null then
    new.empresa_id := public.current_empresa_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_empresa_id_usuarios on public.usuarios;
create trigger trg_empresa_id_usuarios before insert on public.usuarios
  for each row execute function public.set_empresa_id();

-- ----------------------------------------------------------------------------
-- 4. empresa_id + trigger + NOT NULL en cada tabla operativa (mecanico:
--    misma columna y mismo trigger en todas, cambia solo el nombre)
-- ----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'roles', 'clientes', 'unidades', 'cajas', 'operadores',
    'viajes', 'viaje_ubicacion', 'estatus_viaje',
    'entrega_turno_unidad', 'entrega_turno_nota',
    'facturas', 'reportes',
    'facturas_sistema', 'gastos_mantenimiento', 'tanque_movimientos'
  ])
  loop
    execute format('alter table public.%I add column if not exists empresa_id text references public.empresas (id) on delete cascade', t);
    execute format('update public.%I set empresa_id = ''emp-breco'' where empresa_id is null', t);
    execute format('alter table public.%I alter column empresa_id set not null', t);
    execute format('drop trigger if exists trg_empresa_id_%s on public.%I', t, t);
    execute format('create trigger trg_empresa_id_%s before insert on public.%I for each row execute function public.set_empresa_id()', t, t);
  end loop;
end $$;

-- estatus_viaje.nombre era unico globalmente; ahora es unico por empresa
-- (cada empresa puede tener su propio "Programado", "En transito", etc.)
alter table public.estatus_viaje drop constraint if exists estatus_viaje_nombre_key;
alter table public.estatus_viaje drop constraint if exists estatus_viaje_empresa_nombre_key;
alter table public.estatus_viaje add constraint estatus_viaje_empresa_nombre_key unique (empresa_id, nombre);

-- ----------------------------------------------------------------------------
-- 5. RLS: empresas (tabla nueva) y usuarios (agrega el bypass de super admin)
-- ----------------------------------------------------------------------------

alter table public.empresas enable row level security;
drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas for select
  using (id = current_empresa_id() or es_super_admin());
drop policy if exists empresas_insert on public.empresas;
create policy empresas_insert on public.empresas for insert with check (es_super_admin());
drop policy if exists empresas_update on public.empresas;
create policy empresas_update on public.empresas for update
  using ((id = current_empresa_id() and has_permission('Configuracion', 'editar')) or es_super_admin());

drop policy if exists usuarios_select_admin on public.usuarios;
create policy usuarios_select_admin on public.usuarios for select
  using ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'ver')) or es_super_admin());
drop policy if exists usuarios_insert_admin on public.usuarios;
create policy usuarios_insert_admin on public.usuarios for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'crear')) or es_super_admin());
drop policy if exists usuarios_update_admin on public.usuarios;
create policy usuarios_update_admin on public.usuarios for update
  using ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'editar')) or es_super_admin());
drop policy if exists usuarios_delete_admin on public.usuarios;
create policy usuarios_delete_admin on public.usuarios for delete
  using ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'eliminar')) or es_super_admin());

-- roles: se agrega el filtro de empresa a las politicas de administracion
-- (la de "cada quien lee su propio rol" no cambia, ya esta acotada)
drop policy if exists roles_select_admin on public.roles;
create policy roles_select_admin on public.roles for select
  using ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'ver')) or es_super_admin());
drop policy if exists roles_insert_admin on public.roles;
create policy roles_insert_admin on public.roles for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Configuracion', 'crear')) or es_super_admin());
drop policy if exists roles_update_admin on public.roles;
create policy roles_update_admin on public.roles for update
  using (empresa_id = current_empresa_id() and has_permission('Configuracion', 'editar'));
drop policy if exists roles_delete_admin on public.roles;
create policy roles_delete_admin on public.roles for delete
  using (empresa_id = current_empresa_id() and has_permission('Configuracion', 'eliminar'));

-- ----------------------------------------------------------------------------
-- 6. RLS de cada tabla operativa: se agrega "empresa_id = current_empresa_id()"
--    a las 4 politicas existentes (select/insert/update/delete), sin
--    cambiar el permiso de modulo que ya exigian.
-- ----------------------------------------------------------------------------

-- clientes / unidades / cajas / operadores (modulo Catalogos)
drop policy if exists clientes_select on public.clientes;
create policy clientes_select on public.clientes for select using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists clientes_insert on public.clientes;
create policy clientes_insert on public.clientes for insert with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists clientes_update on public.clientes;
create policy clientes_update on public.clientes for update using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists clientes_delete on public.clientes;
create policy clientes_delete on public.clientes for delete using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

drop policy if exists unidades_select on public.unidades;
create policy unidades_select on public.unidades for select using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists unidades_insert on public.unidades;
create policy unidades_insert on public.unidades for insert with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists unidades_update on public.unidades;
create policy unidades_update on public.unidades for update using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists unidades_delete on public.unidades;
create policy unidades_delete on public.unidades for delete using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

drop policy if exists cajas_select on public.cajas;
create policy cajas_select on public.cajas for select using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists cajas_insert on public.cajas;
create policy cajas_insert on public.cajas for insert with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists cajas_update on public.cajas;
create policy cajas_update on public.cajas for update using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists cajas_delete on public.cajas;
create policy cajas_delete on public.cajas for delete using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

drop policy if exists operadores_select on public.operadores;
create policy operadores_select on public.operadores for select using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists operadores_insert on public.operadores;
create policy operadores_insert on public.operadores for insert with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists operadores_update on public.operadores;
create policy operadores_update on public.operadores for update using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists operadores_delete on public.operadores;
create policy operadores_delete on public.operadores for delete using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

-- viajes (modulo Viajes)
drop policy if exists viajes_select on public.viajes;
create policy viajes_select on public.viajes for select using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists viajes_insert on public.viajes;
create policy viajes_insert on public.viajes for insert with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists viajes_update on public.viajes;
create policy viajes_update on public.viajes for update using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists viajes_delete on public.viajes;
create policy viajes_delete on public.viajes for delete using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

-- viaje_ubicacion (bitacora de avance, modulo Viajes)
drop policy if exists viaje_ubicacion_select on public.viaje_ubicacion;
create policy viaje_ubicacion_select on public.viaje_ubicacion for select using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists viaje_ubicacion_insert on public.viaje_ubicacion;
create policy viaje_ubicacion_insert on public.viaje_ubicacion for insert with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists viaje_ubicacion_delete on public.viaje_ubicacion;
create policy viaje_ubicacion_delete on public.viaje_ubicacion for delete using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));

-- estatus_viaje (catalogo de estatus personalizados, modulo Viajes)
drop policy if exists estatus_viaje_select on public.estatus_viaje;
create policy estatus_viaje_select on public.estatus_viaje for select using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists estatus_viaje_insert on public.estatus_viaje;
create policy estatus_viaje_insert on public.estatus_viaje for insert
  with check (empresa_id = current_empresa_id() and (has_permission('Viajes', 'crear') or has_permission('Viajes', 'editar')));
drop policy if exists estatus_viaje_update on public.estatus_viaje;
create policy estatus_viaje_update on public.estatus_viaje for update
  using (empresa_id = current_empresa_id() and (has_permission('Viajes', 'crear') or has_permission('Viajes', 'editar')));

-- entrega_turno_unidad / entrega_turno_nota (modulo EntregaTurno)
drop policy if exists entrega_turno_unidad_select on public.entrega_turno_unidad;
create policy entrega_turno_unidad_select on public.entrega_turno_unidad for select using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'ver'));
drop policy if exists entrega_turno_unidad_insert on public.entrega_turno_unidad;
create policy entrega_turno_unidad_insert on public.entrega_turno_unidad for insert with check (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'crear'));
drop policy if exists entrega_turno_unidad_update on public.entrega_turno_unidad;
create policy entrega_turno_unidad_update on public.entrega_turno_unidad for update using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'editar'));
drop policy if exists entrega_turno_unidad_delete on public.entrega_turno_unidad;
create policy entrega_turno_unidad_delete on public.entrega_turno_unidad for delete using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'eliminar'));

drop policy if exists entrega_turno_nota_select on public.entrega_turno_nota;
create policy entrega_turno_nota_select on public.entrega_turno_nota for select using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'ver'));
drop policy if exists entrega_turno_nota_insert on public.entrega_turno_nota;
create policy entrega_turno_nota_insert on public.entrega_turno_nota for insert with check (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'crear'));
drop policy if exists entrega_turno_nota_update on public.entrega_turno_nota;
create policy entrega_turno_nota_update on public.entrega_turno_nota for update using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'editar'));
drop policy if exists entrega_turno_nota_delete on public.entrega_turno_nota;
create policy entrega_turno_nota_delete on public.entrega_turno_nota for delete using (empresa_id = current_empresa_id() and has_permission('EntregaTurno', 'eliminar'));

-- facturas (modulo Facturacion)
drop policy if exists facturas_select on public.facturas;
create policy facturas_select on public.facturas for select using (empresa_id = current_empresa_id() and has_permission('Facturacion', 'ver'));
drop policy if exists facturas_insert on public.facturas;
create policy facturas_insert on public.facturas for insert with check (empresa_id = current_empresa_id() and has_permission('Facturacion', 'crear'));
drop policy if exists facturas_update on public.facturas;
create policy facturas_update on public.facturas for update using (empresa_id = current_empresa_id() and has_permission('Facturacion', 'editar'));
drop policy if exists facturas_delete on public.facturas;
create policy facturas_delete on public.facturas for delete using (empresa_id = current_empresa_id() and has_permission('Facturacion', 'eliminar'));

-- reportes (modulo Reportes)
drop policy if exists reportes_select on public.reportes;
create policy reportes_select on public.reportes for select using (empresa_id = current_empresa_id() and has_permission('Reportes', 'ver'));
drop policy if exists reportes_insert on public.reportes;
create policy reportes_insert on public.reportes for insert with check (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));
drop policy if exists reportes_update on public.reportes;
create policy reportes_update on public.reportes for update using (empresa_id = current_empresa_id() and has_permission('Reportes', 'editar'));
drop policy if exists reportes_delete on public.reportes;
create policy reportes_delete on public.reportes for delete using (empresa_id = current_empresa_id() and has_permission('Reportes', 'eliminar'));

-- facturas_sistema / gastos_mantenimiento / tanque_movimientos (modulo Reportes)
drop policy if exists facturas_sistema_select on public.facturas_sistema;
create policy facturas_sistema_select on public.facturas_sistema for select using (empresa_id = current_empresa_id() and has_permission('Reportes', 'ver'));
drop policy if exists facturas_sistema_insert on public.facturas_sistema;
create policy facturas_sistema_insert on public.facturas_sistema for insert with check (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));
drop policy if exists facturas_sistema_update on public.facturas_sistema;
create policy facturas_sistema_update on public.facturas_sistema for update using (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));

drop policy if exists gastos_mantenimiento_select on public.gastos_mantenimiento;
create policy gastos_mantenimiento_select on public.gastos_mantenimiento for select using (empresa_id = current_empresa_id() and has_permission('Reportes', 'ver'));
drop policy if exists gastos_mantenimiento_insert on public.gastos_mantenimiento;
create policy gastos_mantenimiento_insert on public.gastos_mantenimiento for insert with check (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));
drop policy if exists gastos_mantenimiento_update on public.gastos_mantenimiento;
create policy gastos_mantenimiento_update on public.gastos_mantenimiento for update using (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));

drop policy if exists tanque_movimientos_select on public.tanque_movimientos;
create policy tanque_movimientos_select on public.tanque_movimientos for select using (empresa_id = current_empresa_id() and has_permission('Reportes', 'ver'));
drop policy if exists tanque_movimientos_insert on public.tanque_movimientos;
create policy tanque_movimientos_insert on public.tanque_movimientos for insert with check (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));
drop policy if exists tanque_movimientos_update on public.tanque_movimientos;
create policy tanque_movimientos_update on public.tanque_movimientos for update using (empresa_id = current_empresa_id() and has_permission('Reportes', 'crear'));

-- ----------------------------------------------------------------------------
-- 7. Se retira la tabla "empresa" (singleton), ya migrada a "empresas"
-- ----------------------------------------------------------------------------

drop policy if exists empresa_select on public.empresa;
drop policy if exists empresa_update on public.empresa;
drop table if exists public.empresa;

-- ----------------------------------------------------------------------------
-- 8. Realtime: agrega "empresas" a la misma publicacion que ya usan las
--    demas tablas compartidas (ver migracion 008).
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'empresas'
  ) then
    execute 'alter publication supabase_realtime add table public.empresas';
  end if;
end $$;
