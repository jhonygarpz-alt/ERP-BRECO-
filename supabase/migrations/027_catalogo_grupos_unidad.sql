-- ============================================================================
-- Catalogo de Grupos de Unidades (ej. General / Tractos / Remolques / Dolly).
-- ============================================================================

create table if not exists public.grupos_unidad (
  id text primary key,
  codigo text not null default '',
  nombre text not null default '',
  color text not null default 'gray',
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_grupos_unidad on public.grupos_unidad;
create trigger trg_empresa_id_grupos_unidad before insert on public.grupos_unidad
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito.
create or replace function public.set_codigo_grupo_unidad() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.grupos_unidad
    where empresa_id = new.empresa_id and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_grupo_unidad on public.grupos_unidad;
create trigger trg_codigo_grupo_unidad before insert on public.grupos_unidad
  for each row execute function public.set_codigo_grupo_unidad();

-- Codigo y Nombre (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_grupos_unidad_empresa_codigo
  on public.grupos_unidad (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_grupos_unidad_empresa_nombre
  on public.grupos_unidad (empresa_id, upper(nombre)) where nombre <> '';

alter table public.grupos_unidad enable row level security;

drop policy if exists grupos_unidad_select on public.grupos_unidad;
create policy grupos_unidad_select on public.grupos_unidad for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists grupos_unidad_insert on public.grupos_unidad;
create policy grupos_unidad_insert on public.grupos_unidad for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists grupos_unidad_update on public.grupos_unidad;
create policy grupos_unidad_update on public.grupos_unidad for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists grupos_unidad_delete on public.grupos_unidad;
create policy grupos_unidad_delete on public.grupos_unidad for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'grupos_unidad'
  ) then
    execute 'alter publication supabase_realtime add table public.grupos_unidad';
  end if;
end $$;

-- Siembra el catalogo default para cada empresa que todavia no tenga
-- ninguno (calcado de la referencia: General, Tractos, Remolques, Dolly).
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.grupos_unidad where empresa_id = emp.id) then
      insert into public.grupos_unidad (id, codigo, nombre, color, empresa_id) values
        (emp.id || '-gru-1', '1', 'GENERAL', 'gray', emp.id),
        (emp.id || '-gru-2', '2', 'TRACTOS', 'blue', emp.id),
        (emp.id || '-gru-3', '3', 'REMOLQUES', 'amber', emp.id),
        (emp.id || '-gru-4', '4', 'DOLLY', 'purple', emp.id);
    end if;
  end loop;
end $$;

-- Corrige filas que hayan quedado con el valor hex antiguo (version previa
-- de esta migracion, antes de adoptar la paleta de tonos del sistema).
update public.grupos_unidad set color = 'gray' where color = 'FFFFFF' or color = '';
