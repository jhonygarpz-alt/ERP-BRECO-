-- ============================================================================
-- Banco: Movimientos Bancarios, Cuentas por Pagar y Conciliaciones.
-- - Movimientos Bancarios: ingresos/egresos de cada cuenta bancaria (tabla
--   movimientos_bancarios). Su saldo nunca se guarda -- se calcula sumando.
-- - Cuentas por Pagar: pagos a proveedor que liquidan gastos de viaje
--   marcados "Genera pasivo" (tabla pagos_proveedor), igual patron que
--   Complementos de Pago en Cobranza.
-- - Conciliaciones: guarda el resultado de conciliar un archivo de
--   movimientos del banco contra los Movimientos Bancarios del sistema
--   (tabla conciliaciones_bancarias).
-- ============================================================================

create table if not exists public.movimientos_bancarios (
  id text primary key,
  cuenta_bancaria_id text not null references public.cuentas_bancarias (id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null check (tipo in ('Ingreso', 'Egreso')),
  concepto text not null default '',
  beneficiario text not null default '',
  importe numeric(14, 2) not null default 0,
  referencia text not null default '',
  observaciones text not null default '',
  origen text not null default 'Manual' check (origen in ('Manual', 'ComplementoPago', 'PagoProveedor')),
  origen_id text,
  conciliado boolean not null default false,
  estatus text not null default 'Activo' check (estatus in ('Activo', 'Cancelado')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.pagos_proveedor (
  id text primary key,
  folio text not null default '',
  proveedor_id text not null references public.proveedores (id) on delete cascade,
  fecha date not null default current_date,
  cuenta_bancaria_id text references public.cuentas_bancarias (id) on delete set null,
  forma_pago text not null default '',
  referencia text not null default '',
  concepto text not null default 'PAGO A PROVEEDOR',
  aplicaciones jsonb not null default '[]',
  importe numeric(14, 2) not null default 0,
  estatus text not null default 'Aplicado' check (estatus in ('Aplicado', 'Cancelado')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.conciliaciones_bancarias (
  id text primary key,
  cuenta_bancaria_id text not null references public.cuentas_bancarias (id) on delete cascade,
  desde date not null default current_date,
  hasta date not null default current_date,
  archivo_nombre text not null default '',
  saldo_final_banco numeric(14, 2) not null default 0,
  lineas jsonb not null default '[]',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_movimientos_bancarios on public.movimientos_bancarios;
create trigger trg_empresa_id_movimientos_bancarios before insert on public.movimientos_bancarios
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_pagos_proveedor on public.pagos_proveedor;
create trigger trg_empresa_id_pagos_proveedor before insert on public.pagos_proveedor
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_conciliaciones_bancarias on public.conciliaciones_bancarias;
create trigger trg_empresa_id_conciliaciones_bancarias before insert on public.conciliaciones_bancarias
  for each row execute function public.set_empresa_id();

create index if not exists idx_movimientos_bancarios_cuenta_id on public.movimientos_bancarios (cuenta_bancaria_id);
create index if not exists idx_pagos_proveedor_proveedor_id on public.pagos_proveedor (proveedor_id);
create index if not exists idx_conciliaciones_bancarias_cuenta_id on public.conciliaciones_bancarias (cuenta_bancaria_id);

alter table public.movimientos_bancarios enable row level security;
alter table public.pagos_proveedor enable row level security;
alter table public.conciliaciones_bancarias enable row level security;

drop policy if exists movimientos_bancarios_select on public.movimientos_bancarios;
create policy movimientos_bancarios_select on public.movimientos_bancarios for select
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'ver'));
drop policy if exists movimientos_bancarios_insert on public.movimientos_bancarios;
create policy movimientos_bancarios_insert on public.movimientos_bancarios for insert
  with check (empresa_id = current_empresa_id() and has_permission('Banco', 'crear'));
drop policy if exists movimientos_bancarios_update on public.movimientos_bancarios;
create policy movimientos_bancarios_update on public.movimientos_bancarios for update
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'editar'));
drop policy if exists movimientos_bancarios_delete on public.movimientos_bancarios;
create policy movimientos_bancarios_delete on public.movimientos_bancarios for delete
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'eliminar'));

drop policy if exists pagos_proveedor_select on public.pagos_proveedor;
create policy pagos_proveedor_select on public.pagos_proveedor for select
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'ver'));
drop policy if exists pagos_proveedor_insert on public.pagos_proveedor;
create policy pagos_proveedor_insert on public.pagos_proveedor for insert
  with check (empresa_id = current_empresa_id() and has_permission('Banco', 'crear'));
drop policy if exists pagos_proveedor_update on public.pagos_proveedor;
create policy pagos_proveedor_update on public.pagos_proveedor for update
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'editar'));
drop policy if exists pagos_proveedor_delete on public.pagos_proveedor;
create policy pagos_proveedor_delete on public.pagos_proveedor for delete
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'eliminar'));

drop policy if exists conciliaciones_bancarias_select on public.conciliaciones_bancarias;
create policy conciliaciones_bancarias_select on public.conciliaciones_bancarias for select
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'ver'));
drop policy if exists conciliaciones_bancarias_insert on public.conciliaciones_bancarias;
create policy conciliaciones_bancarias_insert on public.conciliaciones_bancarias for insert
  with check (empresa_id = current_empresa_id() and has_permission('Banco', 'crear'));
drop policy if exists conciliaciones_bancarias_update on public.conciliaciones_bancarias;
create policy conciliaciones_bancarias_update on public.conciliaciones_bancarias for update
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'editar'));
drop policy if exists conciliaciones_bancarias_delete on public.conciliaciones_bancarias;
create policy conciliaciones_bancarias_delete on public.conciliaciones_bancarias for delete
  using (empresa_id = current_empresa_id() and has_permission('Banco', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'movimientos_bancarios'
  ) then
    execute 'alter publication supabase_realtime add table public.movimientos_bancarios';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pagos_proveedor'
  ) then
    execute 'alter publication supabase_realtime add table public.pagos_proveedor';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conciliaciones_bancarias'
  ) then
    execute 'alter publication supabase_realtime add table public.conciliaciones_bancarias';
  end if;
end $$;
