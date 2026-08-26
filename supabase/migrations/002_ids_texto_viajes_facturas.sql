-- ============================================================================
-- Corrige el tipo de "id" en viajes y facturas: uuid -> text.
--
-- La app genera sus propios ids de texto (via-xxxx, fac-xxxx), igual que en
-- clientes/unidades/cajas/operadores/roles/reportes/usuarios. Las columnas
-- "uuid" originales rechazaban esos valores con el error:
--   invalid input syntax for type uuid: "via-xxxx"
--
-- Correr una sola vez en el SQL Editor de Supabase si tu proyecto se creo
-- con la version anterior de supabase/schema.sql (columnas uuid). No hace
-- falta correrlo en un proyecto nuevo: schema.sql ya trae el tipo correcto.
-- ============================================================================

alter table public.facturas drop constraint if exists facturas_viaje_id_fkey;

alter table public.viajes alter column id drop default;
alter table public.viajes alter column id type text using id::text;

alter table public.facturas alter column id drop default;
alter table public.facturas alter column id type text using id::text;
alter table public.facturas alter column viaje_id type text using viaje_id::text;

alter table public.facturas
  add constraint facturas_viaje_id_fkey
  foreign key (viaje_id) references public.viajes (id) on delete set null;
