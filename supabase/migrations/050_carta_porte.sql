-- ============================================================================
-- Complemento Carta Porte:
--  - "viajes" gana tipo_documento ('Viaje' | 'CartaPorte') para distinguir un
--    viaje normal de uno que requiere el complemento CFDI de Carta Porte, y
--    para el nuevo filtro de Asignacion de Viajes.
--  - "unidades" gana los datos de Permiso SCT (numero, vigencia,
--    verificacion y tipo de permiso segun el catalogo SAT c_TipoPermiso).
--
-- Los datos de Mercancias del complemento (clave producto/servicio CP,
-- clave unidad SAT, embalaje, material peligroso, Sector COFEPRIS) NO
-- requieren columnas nuevas: ya viven dentro del jsonb "materiales_carga"
-- de cada viaje (types.ts agrega las llaves nuevas al objeto ViajeMaterial;
-- un renglon viejo simplemente no las trae y la app las trata como vacias).
--
-- Todo con default seguro -- ningun dato ni comportamiento existente se
-- toca.
-- ============================================================================

alter table public.viajes
  add column if not exists tipo_documento text not null default 'Viaje'
    check (tipo_documento in ('Viaje', 'CartaPorte'));

alter table public.unidades
  add column if not exists numero_permiso_sct text not null default '',
  add column if not exists vigencia_permiso_sct date,
  add column if not exists verificacion_sct text not null default '',
  add column if not exists clave_tipo_permiso_sct text not null default '';
