-- ============================================================================
-- Catalogos oficiales del SAT para CFDI: Clave de Productos y Servicios
-- (c_ClaveProdServ, ~52,500 filas) y Clave de Unidad (c_ClaveUnidad, ~2,400
-- filas). Se usan en el catalogo "Conceptos de Facturacion" para las Claves
-- CFDI de cada concepto.
--
-- Es informacion publica nacional (no de una empresa en particular), asi que
-- NO llevan empresa_id: cualquier usuario autenticado de cualquier empresa
-- puede leerla, pero nadie la edita desde la app -- mismo patron que
-- codigos_postales_mx (migracion 015).
--
-- Esta migracion solo crea las tablas vacias. Las filas se cargan aparte con
-- el importador de CSV de Supabase (Table Editor -> Insert -> Import data
-- from CSV), porque un archivo de ese tamano no es practico como texto de
-- migracion SQL. Los CSV (extraidos del archivo oficial del SAT
-- catCFDI_V_4_29062023.xls, hojas c_ClaveProdServ y c_ClaveUnidad) se
-- entregan aparte.
-- ============================================================================

create extension if not exists pg_trgm;

create table if not exists public.clave_prod_serv_sat (
  clave text primary key,
  descripcion text,
  palabras_similares text
);

create index if not exists idx_clave_prod_serv_sat_descripcion_trgm
  on public.clave_prod_serv_sat using gin (descripcion gin_trgm_ops);

alter table public.clave_prod_serv_sat enable row level security;

drop policy if exists clave_prod_serv_sat_select on public.clave_prod_serv_sat;
create policy clave_prod_serv_sat_select on public.clave_prod_serv_sat for select
  using (auth.uid() is not null);

create table if not exists public.clave_unidad_sat (
  clave text primary key,
  nombre text,
  descripcion text,
  simbolo text
);

create index if not exists idx_clave_unidad_sat_nombre_trgm
  on public.clave_unidad_sat using gin (nombre gin_trgm_ops);

alter table public.clave_unidad_sat enable row level security;

drop policy if exists clave_unidad_sat_select on public.clave_unidad_sat;
create policy clave_unidad_sat_select on public.clave_unidad_sat for select
  using (auth.uid() is not null);
