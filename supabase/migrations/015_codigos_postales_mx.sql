-- ============================================================================
-- Catalogo Nacional de Codigos Postales (Correos de Mexico / SEPOMEX), para
-- que al capturar un C.P. en Clientes (y despues en los demas catalogos con
-- domicilio) aparezcan de forma predictiva las colonias que le pertenecen y
-- se autocompleten Estado/Municipio.
--
-- Es informacion publica nacional (no de una empresa en particular), asi que
-- NO lleva empresa_id: cualquier usuario autenticado de cualquier empresa
-- puede leerla, pero nadie la edita desde la app.
--
-- Esta migracion solo crea la tabla vacia. Los ~145,000 renglones se cargan
-- aparte con el importador de CSV de Supabase (Table Editor -> Insert ->
-- Import data from CSV), porque un archivo de ese tamano no es practico
-- como texto de migracion SQL.
-- ============================================================================

create table if not exists public.codigos_postales_mx (
  id bigserial primary key,
  codigo_postal text not null,
  colonia text not null,
  tipo_asentamiento text not null default '',
  municipio text not null default '',
  estado text not null default '',
  ciudad text not null default ''
);

create index if not exists idx_codigos_postales_mx_cp on public.codigos_postales_mx (codigo_postal);

alter table public.codigos_postales_mx enable row level security;

drop policy if exists codigos_postales_mx_select on public.codigos_postales_mx;
create policy codigos_postales_mx_select on public.codigos_postales_mx for select
  using (auth.uid() is not null);
