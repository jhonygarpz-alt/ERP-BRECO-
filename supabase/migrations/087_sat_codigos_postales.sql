-- ============================================================================
-- Catalogo oficial del SAT que cruza Codigo Postal -> clave de Estado,
-- Municipio y Localidad (catalogos c_Estado/c_Municipio/c_Localidad del
-- Anexo 20), necesario para el Complemento Carta Porte: el SAT exige esas
-- claves internas en el domicilio de cada Ubicacion, no el nombre libre que
-- ya se captura en el catalogo de Destinatarios/Clientes.
--
-- Es informacion publica nacional (no de una empresa en particular), igual
-- que "codigos_postales_mx": NO lleva empresa_id, cualquier usuario
-- autenticado la puede leer, nadie la edita desde la app.
--
-- Esta migracion solo crea la tabla vacia. Los ~95,000 renglones se cargan
-- aparte con el importador de CSV de Supabase (Table Editor -> Insert ->
-- Import data from CSV), igual que se hizo con codigos_postales_mx.
-- ============================================================================

create table if not exists public.sat_codigos_postales (
  codigo_postal text not null,
  clave_estado text not null,
  clave_municipio text not null,
  clave_localidad text not null default ''
);

create index if not exists idx_sat_codigos_postales_cp on public.sat_codigos_postales (codigo_postal);

alter table public.sat_codigos_postales enable row level security;

drop policy if exists sat_codigos_postales_select on public.sat_codigos_postales;
create policy sat_codigos_postales_select on public.sat_codigos_postales for select
  using (auth.uid() is not null);
