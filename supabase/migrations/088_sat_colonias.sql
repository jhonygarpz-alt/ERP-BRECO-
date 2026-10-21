-- ============================================================================
-- Catalogo oficial del SAT de Colonias (c_Colonia), cruzado por Codigo
-- Postal, necesario para el Complemento Carta Porte: el atributo Colonia
-- del domicilio tambien exige la clave interna del SAT (no el nombre libre
-- capturado en Destinatarios), igual que Estado/Municipio/Localidad
-- (sat_codigos_postales, migracion 087).
--
-- Es informacion publica nacional, igual que sat_codigos_postales: NO lleva
-- empresa_id, cualquier usuario autenticado la puede leer, nadie la edita
-- desde la app.
--
-- Esta migracion solo crea la tabla vacia. Los ~145,000 renglones se cargan
-- aparte con el importador de CSV de Supabase (Table Editor -> Insert ->
-- Import data from CSV).
-- ============================================================================

create table if not exists public.sat_colonias (
  codigo_postal text not null,
  clave_colonia text not null,
  nombre text not null
);

create index if not exists idx_sat_colonias_cp on public.sat_colonias (codigo_postal);

alter table public.sat_colonias enable row level security;

drop policy if exists sat_colonias_select on public.sat_colonias;
create policy sat_colonias_select on public.sat_colonias for select
  using (auth.uid() is not null);
