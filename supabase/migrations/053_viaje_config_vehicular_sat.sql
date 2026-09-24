-- ============================================================================
-- La configuracion vehicular del Complemento Carta Porte (catalogo SAT
-- c_ConfigAutotransporte) por defecto se toma de la unidad asignada, pero
-- cambia cuando el viaje lleva remolque(s) enganchados (p.ej. una unidad
-- "C2" pasa a ser "T3S2" al enganchar un semirremolque). Se agrega para
-- poder sobreescribirla por viaje sin alterar el catalogo de Unidades.
-- ============================================================================

alter table public.viajes
  add column if not exists config_vehicular_clave_sat text not null default '';
