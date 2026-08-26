-- Bitacora de ubicaciones por viaje (ej. "Monterrey", "San Luis Potosi",
-- "Queretaro"), para poder mostrar el avance del viaje como una guia de
-- paqueteria en la pantalla Aeropuerto, en vez de solo un texto de
-- "ubicacion actual" que se sobreescribe sin dejar rastro.

create table if not exists public.viaje_ubicacion (
  id text primary key,
  viaje_id text not null references public.viajes (id) on delete cascade,
  texto text not null default '',
  creado_en timestamptz not null default now()
);

alter table public.viaje_ubicacion enable row level security;

drop policy if exists viaje_ubicacion_select on public.viaje_ubicacion;
create policy viaje_ubicacion_select on public.viaje_ubicacion for select using (has_permission('Viajes', 'ver'));

drop policy if exists viaje_ubicacion_insert on public.viaje_ubicacion;
create policy viaje_ubicacion_insert on public.viaje_ubicacion for insert with check (has_permission('Viajes', 'editar'));

drop policy if exists viaje_ubicacion_delete on public.viaje_ubicacion;
create policy viaje_ubicacion_delete on public.viaje_ubicacion for delete using (has_permission('Viajes', 'editar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'viaje_ubicacion'
  ) then
    execute 'alter publication supabase_realtime add table public.viaje_ubicacion';
  end if;
end $$;
