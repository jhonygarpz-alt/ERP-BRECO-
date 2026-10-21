-- ============================================================================
-- Cobranza: 3 submodulos nuevos.
-- - Complementos de Pago: registra pagos/abonos de un cliente y los reparte
--   entre una o mas de sus facturas pendientes (tabla pagos_cliente).
-- - Notas de Credito: reduce el saldo de una o mas facturas de un cliente
--   (tabla notas_credito).
-- - Estados de Cuenta: no necesita tabla propia -- se calcula al vuelo a
--   partir de facturas + pagos_cliente + notas_credito.
-- ============================================================================

create table if not exists public.pagos_cliente (
  id text primary key,
  folio text not null default '',
  cliente_id text not null references public.clientes (id) on delete cascade,
  fecha_movimiento date not null default current_date,
  fecha_cobro date not null default current_date,
  forma_pago text not null default '',
  cuenta_bancaria_id text references public.cuentas_bancarias (id) on delete set null,
  importe_depositado numeric(14, 2) not null default 0,
  moneda text not null default 'PESOS',
  tipo_cambio numeric(12, 6) not null default 1,
  referencia_bancaria text not null default '',
  concepto text not null default 'PAGO/ABONO',
  aplicaciones jsonb not null default '[]',
  saldo_a_favor numeric(14, 2) not null default 0,
  estatus text not null default 'Aplicado' check (estatus in ('Aplicado', 'Cancelado')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.notas_credito (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  sucursal text not null default '',
  cliente_id text not null references public.clientes (id) on delete cascade,
  factura_ids jsonb not null default '[]',
  forma_pago text not null default '',
  metodo_pago text not null default 'PUE',
  uso_cfdi text not null default 'G02',
  moneda text not null default 'PESOS',
  tipo_cambio numeric(12, 6) not null default 1,
  lineas jsonb not null default '[]',
  observaciones text not null default '',
  subtotal numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  estatus text not null default 'Activa' check (estatus in ('Activa', 'Cancelada')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_pagos_cliente on public.pagos_cliente;
create trigger trg_empresa_id_pagos_cliente before insert on public.pagos_cliente
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_notas_credito on public.notas_credito;
create trigger trg_empresa_id_notas_credito before insert on public.notas_credito
  for each row execute function public.set_empresa_id();

create index if not exists idx_pagos_cliente_cliente_id on public.pagos_cliente (cliente_id);
create index if not exists idx_notas_credito_cliente_id on public.notas_credito (cliente_id);

alter table public.pagos_cliente enable row level security;
alter table public.notas_credito enable row level security;

drop policy if exists pagos_cliente_select on public.pagos_cliente;
create policy pagos_cliente_select on public.pagos_cliente for select
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'ver'));
drop policy if exists pagos_cliente_insert on public.pagos_cliente;
create policy pagos_cliente_insert on public.pagos_cliente for insert
  with check (empresa_id = current_empresa_id() and has_permission('Cobranza', 'crear'));
drop policy if exists pagos_cliente_update on public.pagos_cliente;
create policy pagos_cliente_update on public.pagos_cliente for update
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'editar'));
drop policy if exists pagos_cliente_delete on public.pagos_cliente;
create policy pagos_cliente_delete on public.pagos_cliente for delete
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'eliminar'));

drop policy if exists notas_credito_select on public.notas_credito;
create policy notas_credito_select on public.notas_credito for select
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'ver'));
drop policy if exists notas_credito_insert on public.notas_credito;
create policy notas_credito_insert on public.notas_credito for insert
  with check (empresa_id = current_empresa_id() and has_permission('Cobranza', 'crear'));
drop policy if exists notas_credito_update on public.notas_credito;
create policy notas_credito_update on public.notas_credito for update
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'editar'));
drop policy if exists notas_credito_delete on public.notas_credito;
create policy notas_credito_delete on public.notas_credito for delete
  using (empresa_id = current_empresa_id() and has_permission('Cobranza', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pagos_cliente'
  ) then
    execute 'alter publication supabase_realtime add table public.pagos_cliente';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notas_credito'
  ) then
    execute 'alter publication supabase_realtime add table public.notas_credito';
  end if;
end $$;
