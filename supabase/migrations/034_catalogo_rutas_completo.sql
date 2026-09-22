-- ============================================================================
-- Reemplaza el catalogo de Rutas (creado en la migracion 033, solo
-- Codigo/Descripcion/Activo) por el diseno completo "Agregando Ruta/Tarifa":
-- informacion general (cliente, origen/destino contra el catalogo de
-- Destinatarios, tipo de unidad, tipo de viaje, clasificacion), datos del
-- trayecto principal (con trazo de mapa) y trayectos/conceptos de
-- facturacion/mercancias precargados que sirven de plantilla al asignar un
-- viaje.
--
-- Es seguro reemplazar la tabla por completo: el catalogo se creo apenas en
-- la migracion anterior y no deberia tener capturas reales todavia. Si ya
-- habias corrido la 033 y alcanzaste a dar de alta alguna ruta de prueba,
-- se pierde -- vuelve a capturarla con el formulario nuevo.
-- ============================================================================

drop table if exists public.rutas cascade;

create table public.rutas (
  id text primary key,
  codigo text not null default '',
  activo boolean not null default true,
  facturable boolean not null default true,
  internacional boolean not null default false,
  tipo_operacion text not null default 'Importacion' check (tipo_operacion in ('Importacion', 'Exportacion')),
  cliente_id text references public.clientes (id) on delete set null,
  descripcion text not null default '',
  origen_id text references public.destinatarios (id) on delete set null,
  destino_id text references public.destinatarios (id) on delete set null,
  tipo_unidad text not null default '',
  tipo_viaje_id text references public.tipos_viaje (id) on delete set null,
  clasificacion_id text references public.clasificaciones_viaje (id) on delete set null,
  origen_direccion text not null default '',
  destino_direccion text not null default '',
  horas numeric not null default 0,
  eta text not null default '',
  kilometros numeric not null default 0,
  tipo_trayecto text not null default 'Permanente' check (tipo_trayecto in ('Permanente', 'Eventual')),
  trayecto_liquidable boolean not null default true,
  trazo_ruta text not null default '',
  trayectos jsonb not null default '[]'::jsonb,
  conceptos_facturacion jsonb not null default '[]'::jsonb,
  materiales_carga jsonb not null default '[]'::jsonb,
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

-- El Codigo (dato obligatorio) no se repite dentro de la misma empresa.
create unique index if not exists idx_rutas_empresa_codigo
  on public.rutas (empresa_id, codigo) where codigo <> '';

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
