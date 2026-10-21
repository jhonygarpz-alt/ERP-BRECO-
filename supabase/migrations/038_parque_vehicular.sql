-- ============================================================================
-- Parque Vehicular: pantalla que unifica Unidades y Remolques (Cajas) en una
-- sola vista con filtros, cambio de estatus, ubicacion, notas e historial.
-- Agrega a ambos catalogos los campos que le faltaban (propietario, ubicacion
-- en texto libre y estado de carga) y dos tablas nuevas de bitacora
-- (notas e historial de cambios), ambas polimorficas via
-- entidad_tipo/entidad_id para no duplicar estructura entre unidad/remolque.
-- ============================================================================

alter table public.unidades
  add column if not exists propietario text not null default '',
  add column if not exists ubicacion text not null default '',
  add column if not exists estado_carga text not null default 'Vacio';

alter table public.cajas
  add column if not exists propietario text not null default '',
  add column if not exists ubicacion text not null default '',
  add column if not exists estado_carga text not null default 'Vacio';

create table if not exists public.parque_notas (
  id text primary key,
  entidad_tipo text not null check (entidad_tipo in ('unidad', 'remolque')),
  entidad_id text not null,
  texto text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.parque_historial (
  id text primary key,
  entidad_tipo text not null check (entidad_tipo in ('unidad', 'remolque')),
  entidad_id text not null,
  campo text not null default '',
  valor_anterior text not null default '',
  valor_nuevo text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_parque_notas on public.parque_notas;
create trigger trg_empresa_id_parque_notas before insert on public.parque_notas
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_parque_historial on public.parque_historial;
create trigger trg_empresa_id_parque_historial before insert on public.parque_historial
  for each row execute function public.set_empresa_id();

create index if not exists idx_parque_notas_entidad on public.parque_notas (entidad_tipo, entidad_id);
create index if not exists idx_parque_historial_entidad on public.parque_historial (entidad_tipo, entidad_id);

alter table public.parque_notas enable row level security;
alter table public.parque_historial enable row level security;

drop policy if exists parque_notas_select on public.parque_notas;
create policy parque_notas_select on public.parque_notas for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists parque_notas_insert on public.parque_notas;
create policy parque_notas_insert on public.parque_notas for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists parque_notas_delete on public.parque_notas;
create policy parque_notas_delete on public.parque_notas for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

drop policy if exists parque_historial_select on public.parque_historial;
create policy parque_historial_select on public.parque_historial for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists parque_historial_insert on public.parque_historial;
create policy parque_historial_insert on public.parque_historial for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'parque_notas'
  ) then
    execute 'alter publication supabase_realtime add table public.parque_notas';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'parque_historial'
  ) then
    execute 'alter publication supabase_realtime add table public.parque_historial';
  end if;
end $$;
