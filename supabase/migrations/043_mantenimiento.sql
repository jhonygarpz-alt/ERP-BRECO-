-- ============================================================================
-- Mantenimiento: Catalogos, Reportes de Fallas, Ordenes de Servicio,
-- Servicios Programados y Checklist Fisicomecanico Rapido.
-- ============================================================================

alter table public.unidades add column if not exists kilometraje_actual numeric(12, 2) not null default 0;

create table if not exists public.clasificaciones_servicio (
  id text primary key,
  codigo text not null default '',
  clasificacion text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.catalogo_servicios (
  id text primary key,
  codigo text not null default '',
  descripcion text not null default '',
  tiempo_estandar_horas numeric(8, 2) not null default 0,
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.mecanicos (
  id text primary key,
  numero text not null default '',
  nombre text not null default '',
  tipo text not null default 'Mecanico' check (tipo in ('Mecanico', 'Ayudante')),
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.planes_servicio (
  id text primary key,
  codigo text not null default '',
  nombre text not null default '',
  aplica_a text not null default 'Todas',
  intervalo_km numeric(10, 2),
  intervalo_meses numeric(6, 2),
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.reportes_falla (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  codigo_falla text not null default '',
  sucursal text not null default '',
  unidad_id text not null references public.unidades (id) on delete cascade,
  operador_id text references public.operadores (id) on delete set null,
  clasificacion_servicio_id text references public.clasificaciones_servicio (id) on delete set null,
  descripcion text not null default '',
  documentos jsonb not null default '[]',
  estatus text not null default 'Abierto' check (estatus in ('Abierto', 'Atendido', 'Cancelado')),
  orden_servicio_id text,
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.ordenes_servicio (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  tipo text not null default 'Interno' check (tipo in ('Interno', 'Externo')),
  moneda text not null default 'PESOS',
  tipo_cambio numeric(12, 6) not null default 1,
  tipo_servicio text not null default 'Correctivo' check (tipo_servicio in ('Preventivo', 'Correctivo')),
  unidad_id text not null references public.unidades (id) on delete cascade,
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'En Proceso', 'Concluida', 'Cancelada')),
  proveedor_id text references public.proveedores (id) on delete set null,
  proveedor_nota text not null default '',
  lugar_reparacion text not null default '',
  notas text not null default '',
  no_checklist text not null default '',
  vida_probable_anios numeric(6, 2),
  vida_probable_km numeric(10, 2),
  quien_realiza_id text references public.mecanicos (id) on delete set null,
  mecanicos_ids jsonb not null default '[]',
  observaciones text not null default '',
  reporte_falla_ids jsonb not null default '[]',
  planes_servicio_ids jsonb not null default '[]',
  kilometraje_al_momento numeric(12, 2) not null default 0,
  lineas jsonb not null default '[]',
  fotos jsonb not null default '[]',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

create table if not exists public.checklists_fisicomecanicos (
  id text primary key,
  folio text not null default '',
  fecha date not null default current_date,
  unidad_id text not null references public.unidades (id) on delete cascade,
  operador_id text references public.operadores (id) on delete set null,
  items jsonb not null default '[]',
  observaciones_generales text not null default '',
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_clasificaciones_servicio on public.clasificaciones_servicio;
create trigger trg_empresa_id_clasificaciones_servicio before insert on public.clasificaciones_servicio
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_catalogo_servicios on public.catalogo_servicios;
create trigger trg_empresa_id_catalogo_servicios before insert on public.catalogo_servicios
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_mecanicos on public.mecanicos;
create trigger trg_empresa_id_mecanicos before insert on public.mecanicos
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_planes_servicio on public.planes_servicio;
create trigger trg_empresa_id_planes_servicio before insert on public.planes_servicio
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_reportes_falla on public.reportes_falla;
create trigger trg_empresa_id_reportes_falla before insert on public.reportes_falla
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_ordenes_servicio on public.ordenes_servicio;
create trigger trg_empresa_id_ordenes_servicio before insert on public.ordenes_servicio
  for each row execute function public.set_empresa_id();
drop trigger if exists trg_empresa_id_checklists_fisicomecanicos on public.checklists_fisicomecanicos;
create trigger trg_empresa_id_checklists_fisicomecanicos before insert on public.checklists_fisicomecanicos
  for each row execute function public.set_empresa_id();

create index if not exists idx_reportes_falla_unidad_id on public.reportes_falla (unidad_id);
create index if not exists idx_ordenes_servicio_unidad_id on public.ordenes_servicio (unidad_id);
create index if not exists idx_checklists_fisicomecanicos_unidad_id on public.checklists_fisicomecanicos (unidad_id);

alter table public.clasificaciones_servicio enable row level security;
alter table public.catalogo_servicios enable row level security;
alter table public.mecanicos enable row level security;
alter table public.planes_servicio enable row level security;
alter table public.reportes_falla enable row level security;
alter table public.ordenes_servicio enable row level security;
alter table public.checklists_fisicomecanicos enable row level security;

drop policy if exists clasificaciones_servicio_select on public.clasificaciones_servicio;
create policy clasificaciones_servicio_select on public.clasificaciones_servicio for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists clasificaciones_servicio_insert on public.clasificaciones_servicio;
create policy clasificaciones_servicio_insert on public.clasificaciones_servicio for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists clasificaciones_servicio_update on public.clasificaciones_servicio;
create policy clasificaciones_servicio_update on public.clasificaciones_servicio for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists clasificaciones_servicio_delete on public.clasificaciones_servicio;
create policy clasificaciones_servicio_delete on public.clasificaciones_servicio for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists catalogo_servicios_select on public.catalogo_servicios;
create policy catalogo_servicios_select on public.catalogo_servicios for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists catalogo_servicios_insert on public.catalogo_servicios;
create policy catalogo_servicios_insert on public.catalogo_servicios for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists catalogo_servicios_update on public.catalogo_servicios;
create policy catalogo_servicios_update on public.catalogo_servicios for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists catalogo_servicios_delete on public.catalogo_servicios;
create policy catalogo_servicios_delete on public.catalogo_servicios for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists mecanicos_select on public.mecanicos;
create policy mecanicos_select on public.mecanicos for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists mecanicos_insert on public.mecanicos;
create policy mecanicos_insert on public.mecanicos for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists mecanicos_update on public.mecanicos;
create policy mecanicos_update on public.mecanicos for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists mecanicos_delete on public.mecanicos;
create policy mecanicos_delete on public.mecanicos for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists planes_servicio_select on public.planes_servicio;
create policy planes_servicio_select on public.planes_servicio for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists planes_servicio_insert on public.planes_servicio;
create policy planes_servicio_insert on public.planes_servicio for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists planes_servicio_update on public.planes_servicio;
create policy planes_servicio_update on public.planes_servicio for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists planes_servicio_delete on public.planes_servicio;
create policy planes_servicio_delete on public.planes_servicio for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists reportes_falla_select on public.reportes_falla;
create policy reportes_falla_select on public.reportes_falla for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists reportes_falla_insert on public.reportes_falla;
create policy reportes_falla_insert on public.reportes_falla for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists reportes_falla_update on public.reportes_falla;
create policy reportes_falla_update on public.reportes_falla for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists reportes_falla_delete on public.reportes_falla;
create policy reportes_falla_delete on public.reportes_falla for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists ordenes_servicio_select on public.ordenes_servicio;
create policy ordenes_servicio_select on public.ordenes_servicio for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists ordenes_servicio_insert on public.ordenes_servicio;
create policy ordenes_servicio_insert on public.ordenes_servicio for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists ordenes_servicio_update on public.ordenes_servicio;
create policy ordenes_servicio_update on public.ordenes_servicio for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists ordenes_servicio_delete on public.ordenes_servicio;
create policy ordenes_servicio_delete on public.ordenes_servicio for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

drop policy if exists checklists_fisicomecanicos_select on public.checklists_fisicomecanicos;
create policy checklists_fisicomecanicos_select on public.checklists_fisicomecanicos for select
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'ver'));
drop policy if exists checklists_fisicomecanicos_insert on public.checklists_fisicomecanicos;
create policy checklists_fisicomecanicos_insert on public.checklists_fisicomecanicos for insert
  with check (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'crear'));
drop policy if exists checklists_fisicomecanicos_update on public.checklists_fisicomecanicos;
create policy checklists_fisicomecanicos_update on public.checklists_fisicomecanicos for update
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'editar'));
drop policy if exists checklists_fisicomecanicos_delete on public.checklists_fisicomecanicos;
create policy checklists_fisicomecanicos_delete on public.checklists_fisicomecanicos for delete
  using (empresa_id = current_empresa_id() and has_permission('Mantenimiento', 'eliminar'));

insert into storage.buckets (id, name, public)
values ('mantenimiento-documentos', 'mantenimiento-documentos', false)
on conflict (id) do nothing;

drop policy if exists mantenimiento_documentos_select on storage.objects;
create policy mantenimiento_documentos_select on storage.objects for select
  using (
    bucket_id = 'mantenimiento-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Mantenimiento', 'ver')
  );

drop policy if exists mantenimiento_documentos_insert on storage.objects;
create policy mantenimiento_documentos_insert on storage.objects for insert
  with check (
    bucket_id = 'mantenimiento-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Mantenimiento', 'crear')
  );

drop policy if exists mantenimiento_documentos_delete on storage.objects;
create policy mantenimiento_documentos_delete on storage.objects for delete
  using (
    bucket_id = 'mantenimiento-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Mantenimiento', 'eliminar')
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reportes_falla'
  ) then
    execute 'alter publication supabase_realtime add table public.reportes_falla';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ordenes_servicio'
  ) then
    execute 'alter publication supabase_realtime add table public.ordenes_servicio';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklists_fisicomecanicos'
  ) then
    execute 'alter publication supabase_realtime add table public.checklists_fisicomecanicos';
  end if;
end $$;
