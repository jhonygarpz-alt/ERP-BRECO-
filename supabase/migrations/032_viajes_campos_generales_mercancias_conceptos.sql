-- ============================================================================
-- Extiende "viajes" con los campos del rediseño de "Agregando Viaje": mas
-- datos generales (Sucursal, Load Number, Moneda, Tipo de Cambio, Ruta,
-- Facturable, Kilometros, Item, Planta, Convenio, Candado Oficial, Carga /
-- Entrega con fecha+hora, Cargar En / Descargar En, Identificador), el
-- Convoy (Remolque / Dolly / Remolque 2) y los trayectos (Asignar
-- Operador/Camion, Mas Trayectos); mas la pestana Mercancias (materiales de
-- carga + peso total) y la pestana Conceptos Facturacion (renglones de
-- cobro del viaje).
--
-- Todo se agrega como columnas nuevas con default seguro -- ningun campo ni
-- comportamiento existente de "viajes" se toca, asi que Facturacion,
-- Entrega de Turno, Programa, Viajes del Dia y Aeropuerto siguen
-- funcionando exactamente igual que antes.
-- ============================================================================

alter table public.viajes
  add column if not exists sucursal text not null default '',
  add column if not exists load_number text not null default '',
  add column if not exists moneda text not null default 'PESOS',
  add column if not exists tipo_cambio numeric not null default 1,
  add column if not exists ruta_codigo text not null default '',
  add column if not exists ruta_descripcion text not null default '',
  add column if not exists facturable boolean not null default true,
  add column if not exists kilometros numeric not null default 0,
  add column if not exists item text not null default '',
  add column if not exists planta text not null default '',
  add column if not exists convenio text not null default '',
  add column if not exists candado_oficial text not null default '',
  add column if not exists estatus_fecha date,
  add column if not exists estatus_hora text not null default '',
  add column if not exists fecha_carga date,
  add column if not exists hora_carga text not null default '',
  add column if not exists cargar_en text not null default '',
  add column if not exists identificador text not null default '',
  add column if not exists fecha_entrega date,
  add column if not exists hora_entrega_real text not null default '',
  add column if not exists descargar_en text not null default '',
  add column if not exists remolque1_id text references public.cajas (id) on delete set null,
  add column if not exists dolly_id text references public.cajas (id) on delete set null,
  add column if not exists remolque2_id text references public.cajas (id) on delete set null,
  add column if not exists trayectos jsonb not null default '[]'::jsonb,
  add column if not exists materiales_carga jsonb not null default '[]'::jsonb,
  add column if not exists peso_carga_total numeric not null default 0,
  add column if not exists peso_carga_unidad text not null default 'KILOGRAMOS',
  add column if not exists conceptos_facturacion_viaje jsonb not null default '[]'::jsonb;
