-- ============================================================================
-- Estatus de Unidades pasa a ser un catalogo personalizable (igual patron
-- que Estatus de Viaje): se puede agregar cualquier estatus, con su color y
-- si cuenta como "Disponible" u "Ocupada" para la flota.
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'unidades_estatus_check') then
    alter table public.unidades drop constraint unidades_estatus_check;
  end if;
end $$;

create table if not exists public.estatus_unidad (
  id text primary key,
  nombre text not null,
  color text not null default 'gray',
  tipo_estatus text not null default 'Disponible' check (tipo_estatus in ('Disponible', 'Ocupada')),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_estatus_unidad on public.estatus_unidad;
create trigger trg_empresa_id_estatus_unidad before insert on public.estatus_unidad
  for each row execute function public.set_empresa_id();

create unique index if not exists idx_estatus_unidad_empresa_nombre
  on public.estatus_unidad (empresa_id, nombre);

alter table public.estatus_unidad enable row level security;

drop policy if exists estatus_unidad_select on public.estatus_unidad;
create policy estatus_unidad_select on public.estatus_unidad for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists estatus_unidad_insert on public.estatus_unidad;
create policy estatus_unidad_insert on public.estatus_unidad for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists estatus_unidad_update on public.estatus_unidad;
create policy estatus_unidad_update on public.estatus_unidad for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists estatus_unidad_delete on public.estatus_unidad;
create policy estatus_unidad_delete on public.estatus_unidad for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'estatus_unidad'
  ) then
    execute 'alter publication supabase_realtime add table public.estatus_unidad';
  end if;
end $$;

-- Siembra el catalogo default para cada empresa que todavia no tenga
-- ninguno (calcado de la referencia: Disponible, Ocupada, En
-- Mantenimiento, Asignada, En Servicio).
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.estatus_unidad where empresa_id = emp.id) then
      insert into public.estatus_unidad (id, nombre, color, tipo_estatus, empresa_id) values
        (emp.id || '-estu-disponible', 'Disponible', 'green', 'Disponible', emp.id),
        (emp.id || '-estu-ocupada', 'Ocupada', 'red', 'Ocupada', emp.id),
        (emp.id || '-estu-mantenimiento', 'En Mantenimiento', 'yellow', 'Ocupada', emp.id),
        (emp.id || '-estu-asignada', 'Asignada', 'blue', 'Ocupada', emp.id),
        (emp.id || '-estu-servicio', 'En Servicio', 'cyan', 'Ocupada', emp.id);
    end if;
  end loop;
end $$;
