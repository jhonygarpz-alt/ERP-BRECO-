-- ============================================================================
-- Vales de Combustible: submodulo de Trafico (junto a Gastos de Viaje) para
-- generar la autorizacion de carga de combustible -- folio propio, litros
-- autorizados, precio estimado por litro y monto calculado -- antes de que
-- exista el gasto real comprobado. Mismo permiso ('Viajes') y mismo patron
-- RLS que el resto de Trafico.
-- ============================================================================

create table if not exists public.vales_combustible (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  viaje_id text references public.viajes (id) on delete set null,
  operador_id text references public.operadores (id) on delete set null,
  unidad_id text references public.unidades (id) on delete set null,
  combustible_tipo text not null default 'Diesel' check (combustible_tipo in ('Diesel', 'Gasolina')),
  litros_autorizados numeric(12, 3) not null default 0,
  precio_litro_estimado numeric(12, 4),
  proveedor_id text references public.proveedores (id) on delete set null,
  numero_referencia text not null default '',
  moneda text not null default 'PESOS',
  monto numeric(14, 2) not null default 0,
  estatus text not null default 'Vigente' check (estatus in ('Vigente', 'Surtido', 'Cancelado')),
  notas text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_vales_combustible on public.vales_combustible;
create trigger trg_empresa_id_vales_combustible before insert on public.vales_combustible
  for each row execute function public.set_empresa_id();

create index if not exists idx_vales_combustible_viaje_id on public.vales_combustible (viaje_id);
create index if not exists idx_vales_combustible_empresa_id on public.vales_combustible (empresa_id);

alter table public.vales_combustible enable row level security;

drop policy if exists vales_combustible_select on public.vales_combustible;
create policy vales_combustible_select on public.vales_combustible for select
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'ver'));
drop policy if exists vales_combustible_insert on public.vales_combustible;
create policy vales_combustible_insert on public.vales_combustible for insert
  with check (empresa_id = current_empresa_id() and has_permission('Viajes', 'crear'));
drop policy if exists vales_combustible_update on public.vales_combustible;
create policy vales_combustible_update on public.vales_combustible for update
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'editar'));
drop policy if exists vales_combustible_delete on public.vales_combustible;
create policy vales_combustible_delete on public.vales_combustible for delete
  using (empresa_id = current_empresa_id() and has_permission('Viajes', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vales_combustible'
  ) then
    execute 'alter publication supabase_realtime add table public.vales_combustible';
  end if;
end $$;
