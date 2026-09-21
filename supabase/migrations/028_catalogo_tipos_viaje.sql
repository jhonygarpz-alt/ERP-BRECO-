-- ============================================================================
-- Catalogo de Tipos de Viaje (ej. Local / Nacional).
-- ============================================================================

create table if not exists public.tipos_viaje (
  id text primary key,
  codigo text not null default '',
  tipo_viaje text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_tipos_viaje on public.tipos_viaje;
create trigger trg_empresa_id_tipos_viaje before insert on public.tipos_viaje
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito.
create or replace function public.set_codigo_tipo_viaje() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.tipos_viaje
    where empresa_id = new.empresa_id and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_tipo_viaje on public.tipos_viaje;
create trigger trg_codigo_tipo_viaje before insert on public.tipos_viaje
  for each row execute function public.set_codigo_tipo_viaje();

-- Codigo y Tipo de Viaje (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_tipos_viaje_empresa_codigo
  on public.tipos_viaje (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_tipos_viaje_empresa_nombre
  on public.tipos_viaje (empresa_id, upper(tipo_viaje)) where tipo_viaje <> '';

alter table public.tipos_viaje enable row level security;

drop policy if exists tipos_viaje_select on public.tipos_viaje;
create policy tipos_viaje_select on public.tipos_viaje for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists tipos_viaje_insert on public.tipos_viaje;
create policy tipos_viaje_insert on public.tipos_viaje for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists tipos_viaje_update on public.tipos_viaje;
create policy tipos_viaje_update on public.tipos_viaje for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists tipos_viaje_delete on public.tipos_viaje;
create policy tipos_viaje_delete on public.tipos_viaje for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tipos_viaje'
  ) then
    execute 'alter publication supabase_realtime add table public.tipos_viaje';
  end if;
end $$;

-- Siembra el catalogo default para cada empresa que todavia no tenga
-- ninguno (calcado de la referencia: Local, Nacional).
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.tipos_viaje where empresa_id = emp.id) then
      insert into public.tipos_viaje (id, codigo, tipo_viaje, empresa_id) values
        (emp.id || '-tpv-1', '1', 'LOCAL', emp.id),
        (emp.id || '-tpv-2', '2', 'NACIONAL', emp.id);
    end if;
  end loop;
end $$;
