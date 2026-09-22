-- ============================================================================
-- Catalogo de Conceptos de Facturacion (Flete, Maniobras, Repartos, etc.),
-- con su configuracion de impuestos (traslado/retencion de IVA), banderas de
-- inclusion en reportes/liquidacion y claves CFDI (SAT).
-- ============================================================================

create table if not exists public.conceptos_facturacion (
  id text primary key,
  codigo text not null default '',
  concepto text not null default '',
  activo boolean not null default true,
  -- Cada fila: {"impuesto": "IVA 16%", "aplica": true, "predeterminado": true}
  traslados jsonb not null default '[]'::jsonb,
  retenciones jsonb not null default '[]'::jsonb,
  incluir_calculo_ingresos_liquidacion boolean not null default false,
  incluir_calculo_liquidacion_pct_flete boolean not null default false,
  incluir_reporte_cm_interterminal boolean not null default false,
  incluir_reporte_cm_transporte_gasolina boolean not null default false,
  clave_prod_serv text not null default '',
  clave_prod_serv_descripcion text not null default '',
  clave_unidad text not null default '',
  clave_unidad_nombre text not null default '',
  unidad_medida text not null default '',
  no_identificacion text not null default '',
  objeto_impuesto text not null default '',
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_conceptos_facturacion on public.conceptos_facturacion;
create trigger trg_empresa_id_conceptos_facturacion before insert on public.conceptos_facturacion
  for each row execute function public.set_empresa_id();

-- Autonumera "codigo" (consecutivo por empresa) si no viene explicito.
create or replace function public.set_codigo_concepto_facturacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(codigo::integer), 0) + 1 into siguiente
    from public.conceptos_facturacion
    where empresa_id = new.empresa_id and codigo ~ '^[0-9]+$';
    new.codigo := siguiente::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_concepto_facturacion on public.conceptos_facturacion;
create trigger trg_codigo_concepto_facturacion before insert on public.conceptos_facturacion
  for each row execute function public.set_codigo_concepto_facturacion();

-- Codigo y Concepto (datos obligatorios) no se repiten dentro de la misma empresa.
create unique index if not exists idx_conceptos_facturacion_empresa_codigo
  on public.conceptos_facturacion (empresa_id, codigo) where codigo <> '';
create unique index if not exists idx_conceptos_facturacion_empresa_nombre
  on public.conceptos_facturacion (empresa_id, upper(concepto)) where concepto <> '';

alter table public.conceptos_facturacion enable row level security;

drop policy if exists conceptos_facturacion_select on public.conceptos_facturacion;
create policy conceptos_facturacion_select on public.conceptos_facturacion for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists conceptos_facturacion_insert on public.conceptos_facturacion;
create policy conceptos_facturacion_insert on public.conceptos_facturacion for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists conceptos_facturacion_update on public.conceptos_facturacion;
create policy conceptos_facturacion_update on public.conceptos_facturacion for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists conceptos_facturacion_delete on public.conceptos_facturacion;
create policy conceptos_facturacion_delete on public.conceptos_facturacion for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conceptos_facturacion'
  ) then
    execute 'alter publication supabase_realtime add table public.conceptos_facturacion';
  end if;
end $$;

-- Siembra el catalogo default para cada empresa que todavia no tenga ninguno,
-- con los conceptos de ejemplo mas comunes de la operacion de trafico.
do $$
declare
  emp record;
  traslada_16 jsonb := '[
    {"impuesto":"IVA 0%","aplica":false,"predeterminado":false},
    {"impuesto":"IVA 8%","aplica":false,"predeterminado":false},
    {"impuesto":"IVA 11%","aplica":false,"predeterminado":false},
    {"impuesto":"IVA 16%","aplica":true,"predeterminado":true}
  ]'::jsonb;
  retiene_4 jsonb := '[
    {"impuesto":"RETENCION IVA 0%","aplica":false,"predeterminado":false},
    {"impuesto":"RETENCION IVA 4%","aplica":true,"predeterminado":true}
  ]'::jsonb;
  retiene_ninguna jsonb := '[
    {"impuesto":"RETENCION IVA 0%","aplica":false,"predeterminado":false},
    {"impuesto":"RETENCION IVA 4%","aplica":false,"predeterminado":false}
  ]'::jsonb;
  conceptos_retiene text[] := array['FLETE','REPARTOS','RECOLECCION','RENTA DE EQUIPO','FLETE EN FALSO','DIF. DE KILOMETRAJE','REEXPEDICION'];
  conceptos_no_retiene text[] := array['MANIOBRAS CARGADO','AUTOPISTAS','DEMORAS','SOBRE PESO','SEGUROS','APLICACIÓN DE ANTICIPO','ANTICIPO DEL BIEN O SERVICIO','ALMACENAJES','MANIOBRAS VACIO','PENSION'];
  nombre text;
  i integer;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.conceptos_facturacion where empresa_id = emp.id) then
      i := 0;
      foreach nombre in array conceptos_retiene loop
        i := i + 1;
        insert into public.conceptos_facturacion (id, codigo, concepto, traslados, retenciones, empresa_id)
        values (emp.id || '-cf-' || i, i::text, nombre, traslada_16, retiene_4, emp.id);
      end loop;
      foreach nombre in array conceptos_no_retiene loop
        i := i + 1;
        insert into public.conceptos_facturacion (id, codigo, concepto, traslados, retenciones, empresa_id)
        values (emp.id || '-cf-' || i, i::text, nombre, traslada_16, retiene_ninguna, emp.id);
      end loop;
    end if;
  end loop;
end $$;
