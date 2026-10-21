-- ============================================================================
-- Catalogos oficiales del SAT especificos del Complemento Carta Porte 3.1:
-- Clave de Material Peligroso (c_MaterialPeligroso, ~2,346 filas) y Clave de
-- Producto/Servicio de Carta Porte (c_ClaveProdServCP, ~48,757 filas) --
-- este ultimo es un catalogo DISTINTO al c_ClaveProdServ general que ya usa
-- Facturacion (clave_prod_serv_sat, migracion 030); Carta Porte exige el
-- especifico para el atributo BienesTransp de cada mercancia.
--
-- Mismo patron que clave_prod_serv_sat / clave_unidad_sat (migracion 030):
-- es informacion publica nacional, sin empresa_id, de solo lectura para
-- cualquier usuario autenticado. Igual que entonces, esta migracion solo
-- crea las tablas vacias -- las filas se cargan aparte via Table Editor ->
-- Insert -> Import data from CSV, con los archivos
-- supabase/seed_csv/clave_material_peligroso_sat.csv y
-- supabase/seed_csv/clave_prod_serv_cp_sat.csv (extraidos del catalogo
-- oficial SAT Carta Porte 3.1 via phpcfdi/resources-sat-catalogs).
-- ============================================================================

create extension if not exists pg_trgm;

-- El catalogo oficial del SAT repite la misma clave para variantes con
-- distinta descripcion/clase (ej. "1790" aparece con dos concentraciones
-- distintas de acido fluorhidrico), asi que "clave" NO es unica -- se usa
-- un id autoincremental como llave primaria.
create table if not exists public.clave_material_peligroso_sat (
  id serial primary key,
  clave text not null,
  descripcion text,
  clase_o_division text,
  peligro_secundario text,
  nombre_tecnico text
);

create index if not exists idx_clave_material_peligroso_sat_clave
  on public.clave_material_peligroso_sat (clave);
create index if not exists idx_clave_material_peligroso_sat_descripcion_trgm
  on public.clave_material_peligroso_sat using gin (descripcion gin_trgm_ops);

alter table public.clave_material_peligroso_sat enable row level security;

drop policy if exists clave_material_peligroso_sat_select on public.clave_material_peligroso_sat;
create policy clave_material_peligroso_sat_select on public.clave_material_peligroso_sat for select
  using (auth.uid() is not null);

create table if not exists public.clave_prod_serv_cp_sat (
  clave text primary key,
  descripcion text,
  palabras_similares text
);

create index if not exists idx_clave_prod_serv_cp_sat_descripcion_trgm
  on public.clave_prod_serv_cp_sat using gin (descripcion gin_trgm_ops);

alter table public.clave_prod_serv_cp_sat enable row level security;

drop policy if exists clave_prod_serv_cp_sat_select on public.clave_prod_serv_cp_sat;
create policy clave_prod_serv_cp_sat_select on public.clave_prod_serv_cp_sat for select
  using (auth.uid() is not null);
