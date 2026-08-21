-- ============================================================================
-- BRECO Transportes - ERP de Trafico
-- Esquema de Supabase: tablas, permisos (RLS) y datos reales iniciales.
--
-- Como usarlo:
--   1. Crea un proyecto en supabase.com (gratis).
--   2. Abre el SQL Editor del proyecto.
--   3. Pega TODO este archivo y ejecutalo una sola vez.
--   4. Del panel Settings > API, copia la "Project URL" y la "anon public key"
--      y pasaselas a Claude para conectar el frontend.
--
-- Este script es idempotente para los datos de catalogo (usa
-- "on conflict do nothing"/"do update"), pero las tablas se crean con
-- "create table if not exists" -- correrlo dos veces no duplica nada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLAS
-- ----------------------------------------------------------------------------

create table if not exists public.roles (
  id text primary key,
  nombre text not null,
  descripcion text not null default '',
  permisos jsonb not null
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  telefono text not null default '',
  rol_id text references public.roles (id) on delete set null,
  estatus text not null default 'inactivo' check (estatus in ('activo', 'inactivo'))
);

create table if not exists public.empresa (
  id text primary key default 'main' check (id = 'main'),
  nombre text not null default '',
  razon_social text not null default '',
  rfc text not null default '',
  direccion text not null default '',
  telefono text not null default '',
  email text not null default '',
  sitio_web text not null default '',
  logo_data_url text not null default ''
);

create table if not exists public.clientes (
  id text primary key,
  nombre text not null,
  rfc text not null default '',
  contacto text not null default '',
  telefono text not null default '',
  email text not null default '',
  direccion text not null default '',
  estatus text not null default 'activo' check (estatus in ('activo', 'inactivo'))
);

create table if not exists public.unidades (
  id text primary key,
  economico text not null,
  placas text not null default '',
  tipo text not null default 'Tractocamion',
  marca text not null default '',
  modelo text not null default '',
  anio integer not null default 0,
  estatus text not null default 'Disponible'
    check (estatus in ('Disponible', 'En viaje', 'Taller', 'Fuera de servicio')),
  operador_asignado_id text,
  cliente_asignado_id text references public.clientes (id) on delete set null
);

create table if not exists public.cajas (
  id text primary key,
  economico text not null,
  placas text not null default '',
  tipo text not null default 'Seca',
  capacidad text not null default '',
  estatus text not null default 'Disponible'
    check (estatus in ('Disponible', 'En uso', 'Mantenimiento')),
  marca text,
  modelo text,
  anio integer
);

create table if not exists public.operadores (
  id text primary key,
  nombre text not null,
  licencia text not null default '',
  tipo_licencia text not null default '',
  telefono text not null default '',
  vigencia_licencia date,
  estatus text not null default 'Disponible'
    check (estatus in ('Disponible', 'En viaje', 'Descanso', 'Baja'))
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'unidades_operador_asignado_fk'
  ) then
    alter table public.unidades
      add constraint unidades_operador_asignado_fk
      foreign key (operador_asignado_id) references public.operadores (id) on delete set null;
  end if;
end $$;

create table if not exists public.viajes (
  id uuid primary key default gen_random_uuid(),
  folio text not null,
  fecha date not null default current_date,
  cliente_id text references public.clientes (id) on delete set null,
  unidad_id text references public.unidades (id) on delete set null,
  operador_id text references public.operadores (id) on delete set null,
  materiales text not null default '',
  caja_nombre text not null default '',
  caja_economico text not null default '',
  origen text not null default '',
  destino text not null default '',
  hora_salida text not null default '',
  hora_llegada_estimada text not null default '',
  cita text not null default '',
  importacion boolean not null default false,
  exportacion boolean not null default false,
  estatus text not null default 'Programado'
    check (estatus in ('Programado', 'En transito', 'Entregado', 'Cancelado')),
  observaciones text not null default '',
  creado_en timestamptz not null default now()
);

create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  folio text not null,
  fecha date not null default current_date,
  viaje_id uuid references public.viajes (id) on delete set null,
  cliente_id text references public.clientes (id) on delete set null,
  importe numeric(12, 2) not null default 0,
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  estatus text not null default 'Pendiente'
    check (estatus in ('Pendiente', 'Facturado', 'Pagado', 'Cancelado')),
  observaciones text not null default '',
  creado_en timestamptz not null default now()
);

create table if not exists public.reportes (
  id text primary key,
  nombre text not null,
  descripcion text not null default '',
  url text not null default '',
  actualizado text not null default '',
  datos jsonb
);

-- ----------------------------------------------------------------------------
-- 2. PERMISOS (RLS) -- mismo modelo Modulo/PermisoModulo que ya usa el frontend
-- ----------------------------------------------------------------------------

create or replace function public.has_permission(p_modulo text, p_accion text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select (r.permisos -> p_modulo ->> p_accion)::boolean
      from public.usuarios u
      join public.roles r on r.id = u.rol_id
      where u.id = auth.uid() and u.estatus = 'activo'
    ),
    false
  );
$$;

alter table public.roles enable row level security;
alter table public.usuarios enable row level security;
alter table public.empresa enable row level security;
alter table public.clientes enable row level security;
alter table public.unidades enable row level security;
alter table public.cajas enable row level security;
alter table public.operadores enable row level security;
alter table public.viajes enable row level security;
alter table public.facturas enable row level security;
alter table public.reportes enable row level security;

-- usuarios: cada quien siempre puede leer/editar su propia fila (nombre,
-- telefono); administrar todos los usuarios requiere permiso Configuracion.
drop policy if exists usuarios_select_self on public.usuarios;
create policy usuarios_select_self on public.usuarios for select using (id = auth.uid());
drop policy if exists usuarios_select_admin on public.usuarios;
create policy usuarios_select_admin on public.usuarios for select using (has_permission('Configuracion', 'ver'));
drop policy if exists usuarios_update_self on public.usuarios;
create policy usuarios_update_self on public.usuarios for update using (id = auth.uid());
drop policy if exists usuarios_insert_admin on public.usuarios;
create policy usuarios_insert_admin on public.usuarios for insert with check (has_permission('Configuracion', 'crear'));
drop policy if exists usuarios_update_admin on public.usuarios;
create policy usuarios_update_admin on public.usuarios for update using (has_permission('Configuracion', 'editar'));
drop policy if exists usuarios_delete_admin on public.usuarios;
create policy usuarios_delete_admin on public.usuarios for delete using (has_permission('Configuracion', 'eliminar'));

-- roles: cada quien puede leer su propio rol (para saber sus permisos);
-- administrar todos los roles requiere permiso Configuracion.
drop policy if exists roles_select_self on public.roles;
create policy roles_select_self on public.roles for select
  using (id in (select rol_id from public.usuarios where id = auth.uid()));
drop policy if exists roles_select_admin on public.roles;
create policy roles_select_admin on public.roles for select using (has_permission('Configuracion', 'ver'));
drop policy if exists roles_insert_admin on public.roles;
create policy roles_insert_admin on public.roles for insert with check (has_permission('Configuracion', 'crear'));
drop policy if exists roles_update_admin on public.roles;
create policy roles_update_admin on public.roles for update using (has_permission('Configuracion', 'editar'));
drop policy if exists roles_delete_admin on public.roles;
create policy roles_delete_admin on public.roles for delete using (has_permission('Configuracion', 'eliminar'));

-- Helper para generar las 4 politicas estandar (ver/crear/editar/eliminar)
-- de una tabla contra un modulo. Se repite a mano porque Postgres no tiene
-- macros, pero el patron es identico en cada bloque de abajo.

-- empresa (modulo Configuracion)
drop policy if exists empresa_select on public.empresa;
create policy empresa_select on public.empresa for select using (has_permission('Configuracion', 'ver'));
drop policy if exists empresa_update on public.empresa;
create policy empresa_update on public.empresa for update using (has_permission('Configuracion', 'editar'));

-- clientes / unidades / cajas / operadores (modulo Catalogos)
drop policy if exists clientes_select on public.clientes;
create policy clientes_select on public.clientes for select using (has_permission('Catalogos', 'ver'));
drop policy if exists clientes_insert on public.clientes;
create policy clientes_insert on public.clientes for insert with check (has_permission('Catalogos', 'crear'));
drop policy if exists clientes_update on public.clientes;
create policy clientes_update on public.clientes for update using (has_permission('Catalogos', 'editar'));
drop policy if exists clientes_delete on public.clientes;
create policy clientes_delete on public.clientes for delete using (has_permission('Catalogos', 'eliminar'));

drop policy if exists unidades_select on public.unidades;
create policy unidades_select on public.unidades for select using (has_permission('Catalogos', 'ver'));
drop policy if exists unidades_insert on public.unidades;
create policy unidades_insert on public.unidades for insert with check (has_permission('Catalogos', 'crear'));
drop policy if exists unidades_update on public.unidades;
create policy unidades_update on public.unidades for update using (has_permission('Catalogos', 'editar'));
drop policy if exists unidades_delete on public.unidades;
create policy unidades_delete on public.unidades for delete using (has_permission('Catalogos', 'eliminar'));

drop policy if exists cajas_select on public.cajas;
create policy cajas_select on public.cajas for select using (has_permission('Catalogos', 'ver'));
drop policy if exists cajas_insert on public.cajas;
create policy cajas_insert on public.cajas for insert with check (has_permission('Catalogos', 'crear'));
drop policy if exists cajas_update on public.cajas;
create policy cajas_update on public.cajas for update using (has_permission('Catalogos', 'editar'));
drop policy if exists cajas_delete on public.cajas;
create policy cajas_delete on public.cajas for delete using (has_permission('Catalogos', 'eliminar'));

drop policy if exists operadores_select on public.operadores;
create policy operadores_select on public.operadores for select using (has_permission('Catalogos', 'ver'));
drop policy if exists operadores_insert on public.operadores;
create policy operadores_insert on public.operadores for insert with check (has_permission('Catalogos', 'crear'));
drop policy if exists operadores_update on public.operadores;
create policy operadores_update on public.operadores for update using (has_permission('Catalogos', 'editar'));
drop policy if exists operadores_delete on public.operadores;
create policy operadores_delete on public.operadores for delete using (has_permission('Catalogos', 'eliminar'));

-- viajes (modulo Viajes)
drop policy if exists viajes_select on public.viajes;
create policy viajes_select on public.viajes for select using (has_permission('Viajes', 'ver'));
drop policy if exists viajes_insert on public.viajes;
create policy viajes_insert on public.viajes for insert with check (has_permission('Viajes', 'crear'));
drop policy if exists viajes_update on public.viajes;
create policy viajes_update on public.viajes for update using (has_permission('Viajes', 'editar'));
drop policy if exists viajes_delete on public.viajes;
create policy viajes_delete on public.viajes for delete using (has_permission('Viajes', 'eliminar'));

-- facturas (modulo Facturacion)
drop policy if exists facturas_select on public.facturas;
create policy facturas_select on public.facturas for select using (has_permission('Facturacion', 'ver'));
drop policy if exists facturas_insert on public.facturas;
create policy facturas_insert on public.facturas for insert with check (has_permission('Facturacion', 'crear'));
drop policy if exists facturas_update on public.facturas;
create policy facturas_update on public.facturas for update using (has_permission('Facturacion', 'editar'));
drop policy if exists facturas_delete on public.facturas;
create policy facturas_delete on public.facturas for delete using (has_permission('Facturacion', 'eliminar'));

-- reportes (modulo Reportes)
drop policy if exists reportes_select on public.reportes;
create policy reportes_select on public.reportes for select using (has_permission('Reportes', 'ver'));
drop policy if exists reportes_insert on public.reportes;
create policy reportes_insert on public.reportes for insert with check (has_permission('Reportes', 'crear'));
drop policy if exists reportes_update on public.reportes;
create policy reportes_update on public.reportes for update using (has_permission('Reportes', 'editar'));
drop policy if exists reportes_delete on public.reportes;
create policy reportes_delete on public.reportes for delete using (has_permission('Reportes', 'eliminar'));

-- ----------------------------------------------------------------------------
-- 3. DATOS REALES (roles, empresa, clientes, unidades, cajas, operadores,
--    reportes). Viajes y facturas se dejan vacios: son datos del dia a dia
--    que a partir de aqui se capturan desde la app.
-- ----------------------------------------------------------------------------

-- Roles
insert into public.roles (id, nombre, descripcion, permisos) values ('rol-admin', 'Administrador', 'Acceso total al sistema, incluyendo configuracion.', '{"Catalogos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Viajes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Facturacion":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Programa":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Reportes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Configuracion":{"ver":true,"crear":true,"editar":true,"eliminar":true}}'::jsonb) on conflict (id) do update set nombre = excluded.nombre, descripcion = excluded.descripcion, permisos = excluded.permisos;
insert into public.roles (id, nombre, descripcion, permisos) values ('rol-trafico', 'Jefe de Trafico', 'Gestiona catalogos, viajes y programa diario.', '{"Catalogos":{"ver":true,"crear":true,"editar":true,"eliminar":false},"Viajes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Facturacion":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Programa":{"ver":true,"crear":true,"editar":true,"eliminar":false},"Reportes":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false}}'::jsonb) on conflict (id) do update set nombre = excluded.nombre, descripcion = excluded.descripcion, permisos = excluded.permisos;
insert into public.roles (id, nombre, descripcion, permisos) values ('rol-facturacion', 'Facturacion', 'Gestiona la facturacion diaria; consulta el resto.', '{"Catalogos":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Viajes":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Facturacion":{"ver":true,"crear":true,"editar":true,"eliminar":true},"Programa":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Reportes":{"ver":true,"crear":false,"editar":false,"eliminar":false},"Configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false}}'::jsonb) on conflict (id) do update set nombre = excluded.nombre, descripcion = excluded.descripcion, permisos = excluded.permisos;

-- Empresa (fila unica)
insert into public.empresa (id, nombre, razon_social, rfc, direccion, telefono, email, sitio_web, logo_data_url) values ('main', 'BRECO Transportes', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', '', '') on conflict (id) do nothing;

-- Clientes
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-werner', 'Werner Enterprises', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-totalone', 'Total One Logistics', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-silverto', 'Silveroute', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-redwood', 'Redwood Multimodal', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-mj', 'M&J Carriers', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-preferred-popcorn', 'Preferred Popcorn de Mexico', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-breco-logistics', 'Breco Logistics LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-europartners', 'Europartners Mexico', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-deacero', 'Deacero', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-carolina-logistics', 'Carolina Logistics LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-hr-motor', 'HR Motor Express LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-kimberly-clark', 'Kimberly-Clark de Mexico', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-govama', 'Govama', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-fdi-mexico', 'FDI Mexico', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-expedited', 'Expedited LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-mexicom', 'Servicios de Transportacion Mexicom', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-bison', 'Bison Transport Inc', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-pam-transport', 'PAM Transport Inc', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-tigr', 'Transporte Internacional General Regional', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-chinova', 'Chinova Trade', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-set-freight', 'Set Freight International LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-midland', 'Midland International Logistics LLC', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-nuvocargo', 'Nuvocargo', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-nowports', 'Nowports Mexico', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;
insert into public.clientes (id, nombre, rfc, contacto, telefono, email, direccion, estatus) values ('cli-delmar', 'Delmar Logistica', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'activo') on conflict (id) do nothing;

-- Operadores (deben existir antes de las unidades por la FK operador_asignado_id)
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-orlando-dorbecker', 'Orlando Dorbecker', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-rodrigo-espana', 'Rodrigo España', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-gari-lineker', 'Gari Lineker Davila', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-edgar-gomez', 'Edgar Gomez', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-marcos-tinoco', 'Marcos O Tinoco', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-krytian-robles', 'Krytian Robles', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-edgar-cruz', 'Edgar Cruz', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-ruben-velazquez', 'Ruben Velazquez', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-geovany-romero', 'Geovany Romero', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-francisco-gonzalez', 'Francisco Gonzalez', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-francisco-maya', 'Francisco Maya', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-juan-carlos-garcia', 'Juan Carlos Garcia', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-humberto-colin', 'Humberto Colin', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;
insert into public.operadores (id, nombre, licencia, tipo_licencia, telefono, vigencia_licencia, estatus) values ('op-fernando-garcia', 'Fernando Garcia', 'Pendiente', 'Pendiente', 'Pendiente', null, 'En viaje') on conflict (id) do nothing;

-- Unidades (13 tractos propios T01-T13 + 2 unidades de refuerzo FLEDD)
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t01', 'T01', '70BF4M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-orlando-dorbecker', 'cli-werner') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t02', 'T02', '71BF4M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-rodrigo-espana', 'cli-totalone') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t03', 'T03', '69BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-gari-lineker', 'cli-werner') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t04', 'T04', '65BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-edgar-gomez', 'cli-werner') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t05', 'T05', '72BF4M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-marcos-tinoco', 'cli-silverto') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t06', 'T06', '21BM1W', 'Tractocamion', 'Freightliner', 'Cascadia', 2026, 'En viaje', 'op-krytian-robles', 'cli-redwood') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t07', 'T07', '66BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2026, 'En viaje', 'op-edgar-cruz', 'cli-redwood') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t08', 'T08', '68BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-ruben-velazquez', 'cli-totalone') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t09', 'T09', '62BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2026, 'Fuera de servicio', null, null) on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t10', 'T10', '61BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-geovany-romero', 'cli-redwood') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t11', 'T11', '64BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2025, 'En viaje', 'op-francisco-gonzalez', 'cli-mj') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t12', 'T12', '63BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2026, 'En viaje', 'op-francisco-maya', 'cli-totalone') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-t13', 'T13', '67BK5M', 'Tractocamion', 'Freightliner', 'Cascadia', 2026, 'En viaje', 'op-juan-carlos-garcia', 'cli-werner') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-fledd-1', 'FLEDD-1', '', 'Tractocamion', '', '', 0, 'En viaje', 'op-humberto-colin', 'cli-totalone') on conflict (id) do nothing;
insert into public.unidades (id, economico, placas, tipo, marca, modelo, anio, estatus, operador_asignado_id, cliente_asignado_id) values ('uni-fledd-2', 'FLEDD-2', '', 'Tractocamion', '', '', 0, 'Disponible', 'op-fernando-garcia', null) on conflict (id) do nothing;

-- Cajas (remolques propios)
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-45461', '45461', 'AZ4522', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-45480', '45480', 'AZ4523', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-45530', '45530', 'AZ4524', 'Seca', '', 'En uso', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-45538', '45538', 'AZ4525', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-45548', '45548', 'AZ4526', 'Seca', '', 'En uso', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-46141', '46141', 'AZ4527', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50061', '50061', 'AZ4528', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50063', '50063', 'AZ4529', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50064', '50064', 'AZ4530', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50065', '50065', 'AZ4531', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50066', '50066', 'AZ4532', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50067', '50067', 'AZ4533', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50068', '50068', 'AZ4534', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50069', '50069', 'AZ4536', 'Seca', '', 'En uso', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50070', '50070', 'AZ4538', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50071', '50071', 'AZ4540', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50072', '50072', 'AZ4539', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50073', '50073', 'AZ4537', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50094', '50094', 'AZ4535', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50095', '50095', '251183D', 'Seca', '', 'Disponible', 'Wabash', 'Caja seca', 2013) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-50096', '50096', '76UR5A', 'Seca', '', 'Disponible', 'Utility', 'Caja seca', 2015) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-53701', '53701', 'BQ5663', 'Seca', '', 'Disponible', 'Wabash', 'Caja seca', 2005) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-54932', '54932', 'K5351K', 'Seca', '', 'Disponible', 'Wabash', 'Charger', 2012) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-3903', '3903', '2254246', 'Seca', '', 'Disponible', 'Wabash', 'MVT', 2006) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-p5150180', 'P5150180', '8342LG', 'Seca', '', 'Disponible', 'Grandane', 'Caja seca', 2014) on conflict (id) do nothing;
insert into public.cajas (id, economico, placas, tipo, capacidad, estatus, marca, modelo, anio) values ('caj-kzf53918', 'KZF53918', 'A11261A', 'Seca', '', 'Disponible', 'Wabash', 'Caja seca', 1999) on conflict (id) do nothing;

-- Reportes (enlaces externos a OneDrive; se reemplaza por datos reales en la Tanda 2)
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-diesel', 'Control Diesel Tanque San Juan', 'Consumo y existencia de diesel del tanque San Juan.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-facturacion-sistema', 'Facturacion Diaria por Sistema', 'Facturacion diaria capturada en el sistema.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-facturacion-costeo', 'Facturacion vs Costeo Diario', 'Comparativo de facturacion contra costeo del dia.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-gastos-mtto', 'Gastos Mtto y por Unidad', 'Gastos de mantenimiento desglosados por unidad.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-nomina', 'Nomina Actual', 'Nomina vigente de operadores y personal.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;
insert into public.reportes (id, nombre, descripcion, url, actualizado) values ('rep-urea', 'Urea SJR', 'Consumo y existencia de urea en San Juan del Rio.', 'https://onedrive.live.com/shared?id=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments%2FREPORTES&listurl=%2Fpersonal%2Fe9c6f6613f9bd3e1%2FDocuments', 'Se llena a mano en OneDrive; aun no esta conectado en vivo.') on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. PRIMER USUARIO ADMINISTRADOR
--
-- Este script NO puede crear tu primer usuario porque las contrasenas se
-- manejan por separado en Supabase Auth. Pasos (una sola vez):
--
--   1. Ve a Authentication > Users en el panel de Supabase y da clic en
--      "Add user" (o registra el primer usuario desde la pantalla de
--      registro del ERP cuando este lista).
--   2. Copia el UUID de ese usuario.
--   3. Corre esto, cambiando el UUID y el resto de los datos:
--
--   insert into public.usuarios (id, nombre, email, telefono, rol_id, estatus)
--   values ('PEGA-AQUI-EL-UUID', 'Administrador General',
--           'admin@brecotransportes.com', 'Pendiente', 'rol-admin', 'activo');
-- ----------------------------------------------------------------------------
