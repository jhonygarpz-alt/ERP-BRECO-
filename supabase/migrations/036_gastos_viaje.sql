-- ============================================================================
-- Gastos de Viaje: submodulo de Trafico (justo despues de "Asignacion de
-- Viajes") para capturar los gastos que genera un viaje -- peajes,
-- combustible, viaticos/anticipos y "otro" (tipo libre, igual que
-- estatus_viaje, para no forzar un catalogo cerrado). Cada gasto se liga a
-- un viaje y, opcionalmente, al operador y al proveedor que lo cobro.
-- ============================================================================

create table if not exists public.gastos_viaje (
  id text primary key,
  viaje_id text not null references public.viajes (id) on delete cascade,
  operador_id text references public.operadores (id) on delete set null,
  tipo text not null default '',
  concepto text not null default '',
  proveedor_id text references public.proveedores (id) on delete set null,
  fecha date not null default current_date,
  numero_referencia text not null default '',
  moneda text not null default 'PESOS',
  monto numeric(14, 2) not null default 0,
  genera_pasivo boolean not null default false,
  notas text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_gastos_viaje on public.gastos_viaje;
create trigger trg_empresa_id_gastos_viaje before insert on public.gastos_viaje
  for each row execute function public.set_empresa_id();

create index if not exists idx_gastos_viaje_viaje_id on public.gastos_viaje (viaje_id);
create index if not exists idx_gastos_viaje_empresa_id on public.gastos_viaje (empresa_id);

alter table public.gastos_viaje enable row level security;

drop policy if exists gastos_viaje_select on public.gastos_viaje;
create policy gastos_viaje_select on public.gastos_viaje for select
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists gastos_viaje_insert on public.gastos_viaje;
create policy gastos_viaje_insert on public.gastos_viaje for insert
  with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists gastos_viaje_update on public.gastos_viaje;
create policy gastos_viaje_update on public.gastos_viaje for update
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists gastos_viaje_delete on public.gastos_viaje;
create policy gastos_viaje_delete on public.gastos_viaje for delete
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gastos_viaje'
  ) then
    execute 'alter publication supabase_realtime add table public.gastos_viaje';
  end if;
end $$;
