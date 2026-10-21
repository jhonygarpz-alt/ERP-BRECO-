-- ============================================================================
-- Catalogo de Clasificaciones de Viaje (ej. Sencillo / Full).
-- ============================================================================

create table if not exists public.clasificaciones_viaje (
  id text primary key,
  codigo text not null default '',
  clasificacion text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_clasificaciones_viaje on public.clasificaciones_viaje;
create trigger trg_empresa_id_clasificaciones_viaje before insert on public.clasificaciones_viaje
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito.
create or replace function public.set_codigo_clasificacion_viaje() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.clasificaciones_viaje
    where empresa_id = new.empresa_id and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_clasificacion_viaje on public.clasificaciones_viaje;
create trigger trg_codigo_clasificacion_viaje before insert on public.clasificaciones_viaje
  for each row execute function public.set_codigo_clasificacion_viaje();

-- Codigo y Clasificacion (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_clasificaciones_viaje_empresa_codigo
  on public.clasificaciones_viaje (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_clasificaciones_viaje_empresa_nombre
  on public.clasificaciones_viaje (empresa_id, upper(clasificacion)) where clasificacion <> '';

alter table public.clasificaciones_viaje enable row level security;

drop policy if exists clasificaciones_viaje_select on public.clasificaciones_viaje;
create policy clasificaciones_viaje_select on public.clasificaciones_viaje for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists clasificaciones_viaje_insert on public.clasificaciones_viaje;
create policy clasificaciones_viaje_insert on public.clasificaciones_viaje for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists clasificaciones_viaje_update on public.clasificaciones_viaje;
create policy clasificaciones_viaje_update on public.clasificaciones_viaje for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists clasificaciones_viaje_delete on public.clasificaciones_viaje;
create policy clasificaciones_viaje_delete on public.clasificaciones_viaje for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clasificaciones_viaje'
  ) then
    execute 'alter publication supabase_realtime add table public.clasificaciones_viaje';
  end if;
end $$;

-- Siembra el catalogo default para cada empresa que todavia no tenga
-- ninguno (calcado de la referencia: Sencillo, Full).
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.clasificaciones_viaje where empresa_id = emp.id) then
      insert into public.clasificaciones_viaje (id, codigo, clasificacion, empresa_id) values
        (emp.id || '-clv-1', '1', 'SENCILLO', emp.id),
        (emp.id || '-clv-2', '2', 'FULL', emp.id);
    end if;
  end loop;
end $$;
