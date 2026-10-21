-- ============================================================================
-- Catalogo de Grupos de Proveedores (para poder agruparlos, ej. por giro o
-- tipo de servicio). Mismo patron que grupos_cliente / grupos_unidad.
-- ============================================================================

create table if not exists public.grupos_proveedor (
  id text primary key,
  codigo text not null default '',
  nombre text not null default '',
  color text not null default 'gray',
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_grupos_proveedor on public.grupos_proveedor;
create trigger trg_empresa_id_grupos_proveedor before insert on public.grupos_proveedor
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito. Usa
-- coalesce(new.empresa_id, current_empresa_id()) porque el orden de
-- ejecucion de triggers BEFORE INSERT del mismo tipo es alfabetico por
-- nombre, y no se quiere depender de que este trigger corra despues del
-- que rellena empresa_id.
create or replace function public.set_codigo_grupo_proveedor() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
  emp text;
begin
  if new.codigo is null or new.codigo = '' then
    emp := coalesce(new.empresa_id, public.current_empresa_id());
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.grupos_proveedor
    where empresa_id = emp and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_grupo_proveedor on public.grupos_proveedor;
create trigger trg_codigo_grupo_proveedor before insert on public.grupos_proveedor
  for each row execute function public.set_codigo_grupo_proveedor();

-- Codigo y Nombre (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_grupos_proveedor_empresa_codigo
  on public.grupos_proveedor (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_grupos_proveedor_empresa_nombre
  on public.grupos_proveedor (empresa_id, upper(nombre)) where nombre <> '';

alter table public.grupos_proveedor enable row level security;

drop policy if exists grupos_proveedor_select on public.grupos_proveedor;
create policy grupos_proveedor_select on public.grupos_proveedor for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists grupos_proveedor_insert on public.grupos_proveedor;
create policy grupos_proveedor_insert on public.grupos_proveedor for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists grupos_proveedor_update on public.grupos_proveedor;
create policy grupos_proveedor_update on public.grupos_proveedor for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists grupos_proveedor_delete on public.grupos_proveedor;
create policy grupos_proveedor_delete on public.grupos_proveedor for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'grupos_proveedor'
  ) then
    execute 'alter publication supabase_realtime add table public.grupos_proveedor';
  end if;
end $$;

-- Siembra un grupo default ("GENERAL") para cada empresa que todavia no
-- tenga ninguno, para que el catalogo no arranque vacio.
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.grupos_proveedor where empresa_id = emp.id) then
      insert into public.grupos_proveedor (id, codigo, nombre, color, empresa_id) values
        (emp.id || '-grp-1', '1', 'GENERAL', 'gray', emp.id);
    end if;
  end loop;
end $$;
