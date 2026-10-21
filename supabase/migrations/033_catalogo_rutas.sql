-- ============================================================================
-- Catalogo de Rutas, usado en la pestana General de Asignacion de Viajes.
-- ============================================================================

create table if not exists public.rutas (
  id text primary key,
  codigo text not null default '',
  descripcion text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_rutas on public.rutas;
create trigger trg_empresa_id_rutas before insert on public.rutas
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito.
create or replace function public.set_codigo_ruta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.rutas
    where empresa_id = new.empresa_id and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_ruta on public.rutas;
create trigger trg_codigo_ruta before insert on public.rutas
  for each row execute function public.set_codigo_ruta();

-- Codigo y Descripcion (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_rutas_empresa_codigo
  on public.rutas (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_rutas_empresa_descripcion
  on public.rutas (empresa_id, upper(descripcion)) where descripcion <> '';

alter table public.rutas enable row level security;

drop policy if exists rutas_select on public.rutas;
create policy rutas_select on public.rutas for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists rutas_insert on public.rutas;
create policy rutas_insert on public.rutas for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists rutas_update on public.rutas;
create policy rutas_update on public.rutas for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists rutas_delete on public.rutas;
create policy rutas_delete on public.rutas for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rutas'
  ) then
    execute 'alter publication supabase_realtime add table public.rutas';
  end if;
end $$;
