-- ============================================================================
-- Descuentos a Operador: submodulo de Trafico (debajo de Gastos de Viaje)
-- para registrar prestamos y otras deducciones que se le van a descontar a
-- un operador, y los abonos que se le van aplicando a cada descuento hasta
-- saldarlo.
-- - deducciones_operador: catalogo de conceptos de deduccion (Prestamo,
--   Uniforme, Herramienta, etc.), igual patron que otros catalogos chicos.
-- - descuentos_operador: el descuento/prestamo dado de alta (a partir de
--   que fecha se empieza a descontar, monto o porcentaje por liquidacion,
--   monto total a descontar).
-- - abonos_descuento_operador: cada abono que se le va aplicando a un
--   descuento -- el saldo pendiente se calcula sumando estos abonos, nunca
--   se guarda.
-- ============================================================================

create table if not exists public.deducciones_operador (
  id text primary key,
  numero text not null default '',
  nombre text not null default '',
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.descuentos_operador (
  id text primary key,
  folio text not null default '',
  descontar_a_partir date not null default current_date,
  operador_id text not null references public.operadores (id) on delete cascade,
  deduccion_id text not null references public.deducciones_operador (id) on delete restrict,
  tipo_descuento text not null default 'Permanente' check (tipo_descuento in ('Permanente', 'Otros Descuentos')),
  forma_descontar text not null default 'Dinero' check (forma_descontar in ('Dinero', 'Porcentaje')),
  importe_por_liquidacion numeric(14, 2) not null default 0,
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  importe_total_a_descontar numeric(14, 2) not null default 0,
  observaciones text not null default '',
  estatus text not null default 'Activo' check (estatus in ('Activo', 'Cancelado')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.abonos_descuento_operador (
  id text primary key,
  descuento_operador_id text not null references public.descuentos_operador (id) on delete cascade,
  fecha date not null default current_date,
  monto numeric(14, 2) not null default 0,
  observaciones text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_deducciones_operador on public.deducciones_operador;
create trigger trg_empresa_id_deducciones_operador before insert on public.deducciones_operador
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_descuentos_operador on public.descuentos_operador;
create trigger trg_empresa_id_descuentos_operador before insert on public.descuentos_operador
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_abonos_descuento_operador on public.abonos_descuento_operador;
create trigger trg_empresa_id_abonos_descuento_operador before insert on public.abonos_descuento_operador
  for each row execute function public.set_empresa_id();

create index if not exists idx_descuentos_operador_operador_id on public.descuentos_operador (operador_id);
create index if not exists idx_descuentos_operador_empresa_id on public.descuentos_operador (empresa_id);
create index if not exists idx_abonos_descuento_operador_descuento_id on public.abonos_descuento_operador (descuento_operador_id);

alter table public.deducciones_operador enable row level security;
alter table public.descuentos_operador enable row level security;
alter table public.abonos_descuento_operador enable row level security;

drop policy if exists deducciones_operador_select on public.deducciones_operador;
create policy deducciones_operador_select on public.deducciones_operador for select
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists deducciones_operador_insert on public.deducciones_operador;
create policy deducciones_operador_insert on public.deducciones_operador for insert
  with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists deducciones_operador_update on public.deducciones_operador;
create policy deducciones_operador_update on public.deducciones_operador for update
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists deducciones_operador_delete on public.deducciones_operador;
create policy deducciones_operador_delete on public.deducciones_operador for delete
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

drop policy if exists descuentos_operador_select on public.descuentos_operador;
create policy descuentos_operador_select on public.descuentos_operador for select
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists descuentos_operador_insert on public.descuentos_operador;
create policy descuentos_operador_insert on public.descuentos_operador for insert
  with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists descuentos_operador_update on public.descuentos_operador;
create policy descuentos_operador_update on public.descuentos_operador for update
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists descuentos_operador_delete on public.descuentos_operador;
create policy descuentos_operador_delete on public.descuentos_operador for delete
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

drop policy if exists abonos_descuento_operador_select on public.abonos_descuento_operador;
create policy abonos_descuento_operador_select on public.abonos_descuento_operador for select
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists abonos_descuento_operador_insert on public.abonos_descuento_operador;
create policy abonos_descuento_operador_insert on public.abonos_descuento_operador for insert
  with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists abonos_descuento_operador_update on public.abonos_descuento_operador;
create policy abonos_descuento_operador_update on public.abonos_descuento_operador for update
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists abonos_descuento_operador_delete on public.abonos_descuento_operador;
create policy abonos_descuento_operador_delete on public.abonos_descuento_operador for delete
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deducciones_operador'
  ) then
    execute 'alter publication supabase_realtime add table public.deducciones_operador';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'descuentos_operador'
  ) then
    execute 'alter publication supabase_realtime add table public.descuentos_operador';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'abonos_descuento_operador'
  ) then
    execute 'alter publication supabase_realtime add table public.abonos_descuento_operador';
  end if;
end $$;
