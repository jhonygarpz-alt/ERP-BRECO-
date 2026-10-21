-- ============================================================================
-- Almacen: catalogos (Almacenes, Articulos, Tipos de Movimiento) y el ciclo
-- completo de compras (Cotizaciones, Requisiciones, Ordenes de Compra,
-- Compras) + Movimientos/Inventario de Almacen.
--
-- - El flujo Requisicion -> Cotizacion -> Orden de Compra -> Compra es
--   LIBRE: cada documento puede crearse directo, ligarse a uno anterior es
--   opcional (confirmado con el usuario).
-- - Una Compra con generar_pasivo=true se vuelve, ella misma, un pasivo
--   pendiente de pago en Banco > Cuentas por Pagar -- exactamente igual a
--   como un GastoViaje con "Genera pasivo" ya funciona hoy. No se crea
--   ningun registro adicional al guardarla.
-- - El inventario (existencias) nunca se guarda: se calcula sumando los
--   Movimientos de Almacen aplicados, igual que los saldos de Banco.
-- ============================================================================

create table if not exists public.almacenes (
  id text primary key,
  codigo text not null default '',
  nombre text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.articulos (
  id text primary key,
  codigo text not null default '',
  descripcion text not null default '',
  unidad_medida text not null default '',
  precio_unitario numeric(14, 2) not null default 0,
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.tipos_movimiento_almacen (
  id text primary key,
  codigo text not null default '',
  nombre text not null default '',
  naturaleza text not null default 'Entrada' check (naturaleza in ('Entrada', 'Salida')),
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.cotizaciones (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  proveedor_id text references public.proveedores (id) on delete set null,
  moneda text not null default 'PESOS',
  tipo_cambio numeric(10, 4) not null default 1,
  lineas jsonb not null default '[]',
  observaciones text not null default '',
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'Cerrada', 'Cancelada')),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.requisiciones (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  proveedor_id text references public.proveedores (id) on delete set null,
  almacen_id text references public.almacenes (id) on delete set null,
  referencia text not null default '',
  moneda text not null default 'PESOS',
  tipo_cambio numeric(10, 4) not null default 1,
  lineas jsonb not null default '[]',
  observaciones text not null default '',
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'Aplicada', 'Cancelada')),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.ordenes_compra (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  proveedor_id text not null references public.proveedores (id) on delete cascade,
  requisicion_id text references public.requisiciones (id) on delete set null,
  referencia text not null default '',
  moneda text not null default 'PESOS',
  tipo_cambio numeric(10, 4) not null default 1,
  lineas jsonb not null default '[]',
  observaciones text not null default '',
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'Parcialmente Recibida', 'Recibida', 'Cancelada')),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.compras (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  proveedor_id text not null references public.proveedores (id) on delete cascade,
  folio_fiscal_uuid text not null default '',
  serie_documento text not null default '',
  numero_documento text not null default '',
  fecha_recibido date not null default current_date,
  fecha_vencimiento date not null default current_date,
  moneda text not null default 'PESOS',
  tipo_cambio numeric(10, 4) not null default 1,
  ordenes_compra_ids jsonb not null default '[]',
  lineas jsonb not null default '[]',
  generar_pasivo boolean not null default true,
  observaciones text not null default '',
  estatus text not null default 'Aplicada' check (estatus in ('Aplicada', 'Cancelada')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.movimientos_almacen (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  tipo_movimiento_id text not null references public.tipos_movimiento_almacen (id) on delete restrict,
  almacen_id text not null references public.almacenes (id) on delete restrict,
  almacen_destino_id text references public.almacenes (id) on delete set null,
  proveedor_id text references public.proveedores (id) on delete set null,
  referencia text not null default '',
  moneda text not null default 'PESOS',
  tipo_cambio numeric(10, 4) not null default 1,
  lineas jsonb not null default '[]',
  observaciones text not null default '',
  origen text not null default 'Manual' check (origen in ('Manual', 'Compra')),
  origen_id text,
  estatus text not null default 'Aplicado' check (estatus in ('Aplicado', 'Cancelado')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

do $$
declare
  t text;
begin
  foreach t in array array['almacenes','articulos','tipos_movimiento_almacen','cotizaciones','requisiciones','ordenes_compra','compras','movimientos_almacen']
  loop
    execute format('drop trigger if exists trg_empresa_id_%s on public.%I', t, t);
    execute format('create trigger trg_empresa_id_%s before insert on public.%I for each row execute function public.set_empresa_id()', t, t);
  end loop;
end $$;

create index if not exists idx_articulos_codigo on public.articulos (codigo);
create index if not exists idx_cotizaciones_proveedor_id on public.cotizaciones (proveedor_id);
create index if not exists idx_requisiciones_proveedor_id on public.requisiciones (proveedor_id);
create index if not exists idx_ordenes_compra_proveedor_id on public.ordenes_compra (proveedor_id);
create index if not exists idx_ordenes_compra_requisicion_id on public.ordenes_compra (requisicion_id);
create index if not exists idx_compras_proveedor_id on public.compras (proveedor_id);
create index if not exists idx_movimientos_almacen_almacen_id on public.movimientos_almacen (almacen_id);
create index if not exists idx_movimientos_almacen_tipo_movimiento_id on public.movimientos_almacen (tipo_movimiento_id);

do $$
declare
  t text;
begin
  foreach t in array array['almacenes','articulos','tipos_movimiento_almacen','cotizaciones','requisiciones','ordenes_compra','compras','movimientos_almacen']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %s_select on public.%I', t, t);
    execute format(
      'create policy %s_select on public.%I for select using (empresa_id = current_empresa_id() and has_permission(''Almacen'', ''ver''))',
      t, t
    );

    execute format('drop policy if exists %s_insert on public.%I', t, t);
    execute format(
      'create policy %s_insert on public.%I for insert with check (empresa_id = current_empresa_id() and has_permission(''Almacen'', ''crear''))',
      t, t
    );

    execute format('drop policy if exists %s_update on public.%I', t, t);
    execute format(
      'create policy %s_update on public.%I for update using (empresa_id = current_empresa_id() and has_permission(''Almacen'', ''editar''))',
      t, t
    );

    execute format('drop policy if exists %s_delete on public.%I', t, t);
    execute format(
      'create policy %s_delete on public.%I for delete using (empresa_id = current_empresa_id() and has_permission(''Almacen'', ''eliminar''))',
      t, t
    );
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['almacenes','articulos','tipos_movimiento_almacen','cotizaciones','requisiciones','ordenes_compra','compras','movimientos_almacen']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
