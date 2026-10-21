-- ============================================================================
-- Flota Digital 360: gemelo digital de cada unidad -- fotos reales por
-- angulo/categoria, puntos de informacion (hotspots) sobre esas fotos o
-- sobre el diagrama 3D generico, incidencias/danos marcados sobre la
-- unidad, e inspecciones (eventos con su propio juego de fotos) para poder
-- comparar el estado de la unidad a traves del tiempo.
--
-- Vive en su propio modulo de permisos ('Flota'), independiente de
-- Catalogos/Mantenimiento, para poder venderse como caracteristica aparte.
-- No agrega nada a has_permission(): esa funcion ya acepta cualquier
-- nombre de modulo como texto libre, asi que 'Flota' funciona en cuanto un
-- rol tenga esa llave en su columna `permisos` (los roles nuevos la traen
-- via rolesDeFabrica en el frontend; los roles ya existentes simplemente no
-- tienen acceso hasta que un admin se lo de en Roles y Permisos, igual que
-- paso con cualquier modulo agregado despues del alta de la empresa).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tablas
-- ----------------------------------------------------------------------------

create table if not exists public.unidad_inspecciones (
  id text primary key,
  unidad_id text not null references public.unidades (id) on delete cascade,
  tipo_evento text not null default 'Inspeccion' check (tipo_evento in ('Recepcion', 'Inspeccion', 'Operacion', 'Mantenimiento', 'Entrega')),
  fecha date not null default current_date,
  kilometraje numeric(12, 2),
  responsable text not null default '',
  notas text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.unidad_fotos (
  id text primary key,
  unidad_id text not null references public.unidades (id) on delete cascade,
  -- null = foto "actual" de la unidad (la que se ve en Vista 360 por defecto); si tiene valor, es parte de un evento de inspeccion para poder compararla despues.
  inspeccion_id text references public.unidad_inspecciones (id) on delete cascade,
  categoria text not null default 'otro' check (categoria in ('frontal', 'trasera', 'lateral_izquierdo', 'lateral_derecho', 'cabina', 'motor', 'chasis', 'llantas', 'caja_remolque', 'otro')),
  storage_path text not null,
  nombre_archivo text not null default '',
  subido_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.unidad_hotspots (
  id text primary key,
  unidad_id text not null references public.unidades (id) on delete cascade,
  modo text not null default 'foto' check (modo in ('foto', '3d')),
  -- modo 'foto': sobre que foto real va el punto, y en que porcentaje x/y de esa imagen.
  foto_id text references public.unidad_fotos (id) on delete cascade,
  x_pct numeric(5, 2),
  y_pct numeric(5, 2),
  -- modo '3d': llave logica fija del diagrama generico (ej. 'cabina', 'motor', 'eje_1_izq').
  posicion_3d text,
  tipo text not null default 'componente' check (tipo in ('componente', 'llanta', 'motor', 'cabina', 'bateria', 'caja')),
  etiqueta text not null default '',
  -- datos libres segun el tipo (ej. llanta: {marca, medida, profundidad, kilometraje, fechaInstalacion}).
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.unidad_danos (
  id text primary key,
  unidad_id text not null references public.unidades (id) on delete cascade,
  hotspot_id text references public.unidad_hotspots (id) on delete set null,
  foto_id text references public.unidad_fotos (id) on delete set null,
  x_pct numeric(5, 2),
  y_pct numeric(5, 2),
  zona text not null default '',
  tipo text not null default '',
  severidad text not null default 'Media' check (severidad in ('Leve', 'Media', 'Grave')),
  fecha date not null default current_date,
  kilometraje numeric(12, 2),
  observacion text not null default '',
  storage_path text,
  estatus text not null default 'Activo' check (estatus in ('Activo', 'En revision', 'Programado', 'Resuelto')),
  costo numeric(12, 2),
  reparacion text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_unidad_inspecciones on public.unidad_inspecciones;
create trigger trg_empresa_id_unidad_inspecciones before insert on public.unidad_inspecciones
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_unidad_fotos on public.unidad_fotos;
create trigger trg_empresa_id_unidad_fotos before insert on public.unidad_fotos
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_unidad_hotspots on public.unidad_hotspots;
create trigger trg_empresa_id_unidad_hotspots before insert on public.unidad_hotspots
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_unidad_danos on public.unidad_danos;
create trigger trg_empresa_id_unidad_danos before insert on public.unidad_danos
  for each row execute function public.set_empresa_id();

create index if not exists idx_unidad_inspecciones_unidad_id on public.unidad_inspecciones (unidad_id);
create index if not exists idx_unidad_fotos_unidad_id on public.unidad_fotos (unidad_id);
create index if not exists idx_unidad_fotos_inspeccion_id on public.unidad_fotos (inspeccion_id);
create index if not exists idx_unidad_hotspots_unidad_id on public.unidad_hotspots (unidad_id);
create index if not exists idx_unidad_hotspots_foto_id on public.unidad_hotspots (foto_id);
create index if not exists idx_unidad_danos_unidad_id on public.unidad_danos (unidad_id);

-- ----------------------------------------------------------------------------
-- 2. RLS (modulo 'Flota')
-- ----------------------------------------------------------------------------

alter table public.unidad_inspecciones enable row level security;
alter table public.unidad_fotos enable row level security;
alter table public.unidad_hotspots enable row level security;
alter table public.unidad_danos enable row level security;

drop policy if exists unidad_inspecciones_select on public.unidad_inspecciones;
create policy unidad_inspecciones_select on public.unidad_inspecciones for select
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'ver'));
drop policy if exists unidad_inspecciones_insert on public.unidad_inspecciones;
create policy unidad_inspecciones_insert on public.unidad_inspecciones for insert
  with check (empresa_id = current_empresa_id() and has_permission('Flota', 'crear'));
drop policy if exists unidad_inspecciones_update on public.unidad_inspecciones;
create policy unidad_inspecciones_update on public.unidad_inspecciones for update
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'editar'));
drop policy if exists unidad_inspecciones_delete on public.unidad_inspecciones;
create policy unidad_inspecciones_delete on public.unidad_inspecciones for delete
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'eliminar'));

drop policy if exists unidad_fotos_select on public.unidad_fotos;
create policy unidad_fotos_select on public.unidad_fotos for select
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'ver'));
drop policy if exists unidad_fotos_insert on public.unidad_fotos;
create policy unidad_fotos_insert on public.unidad_fotos for insert
  with check (empresa_id = current_empresa_id() and has_permission('Flota', 'crear'));
drop policy if exists unidad_fotos_update on public.unidad_fotos;
create policy unidad_fotos_update on public.unidad_fotos for update
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'editar'));
drop policy if exists unidad_fotos_delete on public.unidad_fotos;
create policy unidad_fotos_delete on public.unidad_fotos for delete
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'eliminar'));

drop policy if exists unidad_hotspots_select on public.unidad_hotspots;
create policy unidad_hotspots_select on public.unidad_hotspots for select
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'ver'));
drop policy if exists unidad_hotspots_insert on public.unidad_hotspots;
create policy unidad_hotspots_insert on public.unidad_hotspots for insert
  with check (empresa_id = current_empresa_id() and has_permission('Flota', 'crear'));
drop policy if exists unidad_hotspots_update on public.unidad_hotspots;
create policy unidad_hotspots_update on public.unidad_hotspots for update
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'editar'));
drop policy if exists unidad_hotspots_delete on public.unidad_hotspots;
create policy unidad_hotspots_delete on public.unidad_hotspots for delete
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'eliminar'));

drop policy if exists unidad_danos_select on public.unidad_danos;
create policy unidad_danos_select on public.unidad_danos for select
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'ver'));
drop policy if exists unidad_danos_insert on public.unidad_danos;
create policy unidad_danos_insert on public.unidad_danos for insert
  with check (empresa_id = current_empresa_id() and has_permission('Flota', 'crear'));
drop policy if exists unidad_danos_update on public.unidad_danos;
create policy unidad_danos_update on public.unidad_danos for update
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'editar'));
drop policy if exists unidad_danos_delete on public.unidad_danos;
create policy unidad_danos_delete on public.unidad_danos for delete
  using (empresa_id = current_empresa_id() and has_permission('Flota', 'eliminar'));

-- ----------------------------------------------------------------------------
-- 3. Storage: bucket privado para las fotos de Flota Digital 360
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('unidad-360-fotos', 'unidad-360-fotos', false)
on conflict (id) do nothing;

drop policy if exists unidad_360_fotos_select on storage.objects;
create policy unidad_360_fotos_select on storage.objects for select
  using (
    bucket_id = 'unidad-360-fotos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Flota', 'ver')
  );

drop policy if exists unidad_360_fotos_insert on storage.objects;
create policy unidad_360_fotos_insert on storage.objects for insert
  with check (
    bucket_id = 'unidad-360-fotos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Flota', 'crear')
  );

drop policy if exists unidad_360_fotos_delete on storage.objects;
create policy unidad_360_fotos_delete on storage.objects for delete
  using (
    bucket_id = 'unidad-360-fotos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Flota', 'eliminar')
  );

-- ----------------------------------------------------------------------------
-- 4. Realtime
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidad_inspecciones'
  ) then
    execute 'alter publication supabase_realtime add table public.unidad_inspecciones';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidad_fotos'
  ) then
    execute 'alter publication supabase_realtime add table public.unidad_fotos';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidad_hotspots'
  ) then
    execute 'alter publication supabase_realtime add table public.unidad_hotspots';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidad_danos'
  ) then
    execute 'alter publication supabase_realtime add table public.unidad_danos';
  end if;
end $$;
