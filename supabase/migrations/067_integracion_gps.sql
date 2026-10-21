-- ============================================================================
-- Prepara el sistema para integrarse con la plataforma de rastreo GPS que ya
-- tiene contratada el cliente (la integracion puntual con esa plataforma se
-- construye cuando se solicite; esto deja lista la infraestructura):
--
--   - Elimina el campo "Hash GMTGPS" del catalogo de Operadores (estaba mal
--     ubicado -- el rastreo va por unidad, no por operador -- y nunca estuvo
--     conectado a nada).
--   - Renombra "identidad_satelital" a "identificador_gps" en Unidades: es la
--     clave con la que la plataforma de GPS identifica a esa unidad.
--   - Crea unidad_posicion_gps: una fila por unidad con su ULTIMA posicion
--     real reportada (no historico). La escribe unicamente la Edge Function
--     que reciba la integracion (via service_role, sin pasar por RLS); el
--     resto de los roles solo puede leerla. Mientras no haya ninguna
--     plataforma conectada, esta tabla se queda vacia y el mapa de Monitoreo
--     sigue mostrando la posicion calculada sobre la Ruta, como hasta ahora.
-- ============================================================================

alter table public.operadores drop column if exists hash_gmtgps;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'unidades' and column_name = 'identidad_satelital'
  ) then
    alter table public.unidades rename column identidad_satelital to identificador_gps;
  end if;
end $$;

create table if not exists public.unidad_posicion_gps (
  unidad_id text primary key references public.unidades (id) on delete cascade,
  empresa_id text not null references public.empresas (id) on delete cascade,
  latitud numeric(10, 7) not null,
  longitud numeric(10, 7) not null,
  velocidad_kmh numeric(6, 2),
  rumbo_grados numeric(5, 2),
  fecha_hora_gps timestamptz not null,
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_unidad_posicion_gps_empresa_id on public.unidad_posicion_gps (empresa_id);

drop trigger if exists trg_empresa_id_unidad_posicion_gps on public.unidad_posicion_gps;
create trigger trg_empresa_id_unidad_posicion_gps before insert on public.unidad_posicion_gps
  for each row execute function public.set_empresa_id();

alter table public.unidad_posicion_gps enable row level security;

drop policy if exists unidad_posicion_gps_select on public.unidad_posicion_gps;
create policy unidad_posicion_gps_select on public.unidad_posicion_gps for select
  using (empresa_id = current_empresa_id() and has_permission('Monitoreo', 'ver'));

-- Sin politicas de insert/update/delete para roles normales: solo la Edge
-- Function de integracion (con la service_role key, que salta RLS) escribe
-- aqui, igual que sesiones_activas.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidad_posicion_gps'
  ) then
    execute 'alter publication supabase_realtime add table public.unidad_posicion_gps';
  end if;
end $$;
