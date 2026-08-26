-- Permite agregar estatus de viaje personalizados desde la app, en vez de
-- estar limitado a los 4 valores fijos originales.

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'viajes_estatus_check') then
    alter table public.viajes drop constraint viajes_estatus_check;
  end if;
end $$;

create table if not exists public.estatus_viaje (
  id text primary key,
  nombre text not null unique,
  creado_en timestamptz not null default now()
);

insert into public.estatus_viaje (id, nombre) values
  ('viaje-est-programado', 'Programado'),
  ('viaje-est-transito', 'En transito'),
  ('viaje-est-entregado', 'Entregado'),
  ('viaje-est-cancelado', 'Cancelado')
on conflict (id) do nothing;

alter table public.estatus_viaje enable row level security;

drop policy if exists estatus_viaje_select on public.estatus_viaje;
create policy estatus_viaje_select on public.estatus_viaje for select using (has_permission('Viajes', 'ver'));

drop policy if exists estatus_viaje_insert on public.estatus_viaje;
create policy estatus_viaje_insert on public.estatus_viaje for insert
  with check (has_permission('Viajes', 'crear') or has_permission('Viajes', 'editar'));
