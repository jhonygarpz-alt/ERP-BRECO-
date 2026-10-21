-- ============================================================================
-- Catalogos de Unidades y Remolques: seccion de Llantas (numero, refaccion,
-- marca, modelo, medida, rodada, tipo), Tipo de Cabina y Tipo de Suspension
-- en Unidades, Acorazado (Si/No) en Remolques, e Inspeccion Fisicomecanica
-- (ultima, proxima y proveedor que la realizo) en ambos catalogos.
-- ============================================================================

alter table public.unidades
  add column if not exists tipo_cabina text not null default '',
  add column if not exists tipo_suspension text not null default '',
  add column if not exists tipo_diferencial_delantero text not null default '',
  add column if not exists tipo_diferencial_trasero text not null default '',
  add column if not exists numero_llantas integer not null default 0,
  add column if not exists llantas_refaccion integer not null default 0,
  add column if not exists marca_llanta text not null default '',
  add column if not exists modelo_llanta text not null default '',
  add column if not exists medida_llanta text not null default '',
  add column if not exists rodada_llanta text not null default '',
  add column if not exists tipo_llanta text not null default '',
  add column if not exists ultima_inspeccion_fisicomecanica date,
  add column if not exists proxima_inspeccion_fisicomecanica date,
  add column if not exists proveedor_inspeccion_id text references public.proveedores (id) on delete set null;

alter table public.cajas
  add column if not exists acorazado boolean not null default false,
  add column if not exists numero_llantas integer not null default 0,
  add column if not exists llantas_refaccion integer not null default 0,
  add column if not exists marca_llanta text not null default '',
  add column if not exists modelo_llanta text not null default '',
  add column if not exists medida_llanta text not null default '',
  add column if not exists rodada_llanta text not null default '',
  add column if not exists tipo_llanta text not null default '',
  add column if not exists ultima_inspeccion_fisicomecanica date,
  add column if not exists proxima_inspeccion_fisicomecanica date,
  add column if not exists proveedor_inspeccion_id text references public.proveedores (id) on delete set null;
