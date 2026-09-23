-- ============================================================================
-- Monitoreo reemplaza al modulo Entrega de Turno: se elimina esa pantalla y
-- sus tablas (decision confirmada explicitamente por el usuario, incluyendo
-- el borrado de los datos ya capturados), y se crean las 2 tablas nuevas que
-- necesita Monitoreo (Incidencias y Comunicacion; Alertas y la posicion en
-- el mapa se calculan al vuelo a partir de viajes/rutas/viaje_ubicacion, no
-- requieren tabla propia).
-- ============================================================================

drop table if exists public.entrega_turno_unidad;
drop table if exists public.entrega_turno_nota;

create table if not exists public.incidencias_viaje (
  id text primary key,
  viaje_id text not null references public.viajes (id) on delete cascade,
  tipo text not null default '',
  descripcion text not null default '',
  severidad text not null default 'Media' check (severidad in ('Alta', 'Media', 'Baja')),
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'Resuelta')),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.comunicacion_viaje (
  id text primary key,
  viaje_id text not null references public.viajes (id) on delete cascade,
  autor text not null default '',
  mensaje text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_incidencias_viaje on public.incidencias_viaje;
create trigger trg_empresa_id_incidencias_viaje before insert on public.incidencias_viaje
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_comunicacion_viaje on public.comunicacion_viaje;
create trigger trg_empresa_id_comunicacion_viaje before insert on public.comunicacion_viaje
  for each row execute function public.set_empresa_id();

create index if not exists idx_incidencias_viaje_viaje_id on public.incidencias_viaje (viaje_id);
create index if not exists idx_comunicacion_viaje_viaje_id on public.comunicacion_viaje (viaje_id);

alter table public.incidencias_viaje enable row level security;
alter table public.comunicacion_viaje enable row level security;

drop policy if exists incidencias_viaje_select on public.incidencias_viaje;
create policy incidencias_viaje_select on public.incidencias_viaje for select
  using (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'ver'));
drop policy if exists incidencias_viaje_insert on public.incidencias_viaje;
create policy incidencias_viaje_insert on public.incidencias_viaje for insert
  with check (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'crear'));
drop policy if exists incidencias_viaje_update on public.incidencias_viaje;
create policy incidencias_viaje_update on public.incidencias_viaje for update
  using (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'editar'));
drop policy if exists incidencias_viaje_delete on public.incidencias_viaje;
create policy incidencias_viaje_delete on public.incidencias_viaje for delete
  using (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'eliminar'));

drop policy if exists comunicacion_viaje_select on public.comunicacion_viaje;
create policy comunicacion_viaje_select on public.comunicacion_viaje for select
  using (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'ver'));
drop policy if exists comunicacion_viaje_insert on public.comunicacion_viaje;
create policy comunicacion_viaje_insert on public.comunicacion_viaje for insert
  with check (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'crear'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incidencias_viaje'
  ) then
    execute 'alter publication supabase_realtime add table public.incidencias_viaje';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comunicacion_viaje'
  ) then
    execute 'alter publication supabase_realtime add table public.comunicacion_viaje';
  end if;
end $$;
