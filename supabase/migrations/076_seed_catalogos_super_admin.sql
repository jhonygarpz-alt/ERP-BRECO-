-- ============================================================================
-- Corrige un hueco del alta de empresas: cuando el super admin crea una
-- empresa nueva desde el panel, hoy solo se siembran sus roles de fabrica
-- (rolesDeFabrica en EmpresasSection.tsx) -- los catalogos por defecto
-- (Estatus de Unidad, Clasificaciones de Viaje, Grupos de Unidad, Tipos de
-- Viaje, Clasificaciones de Operador, Conceptos de Facturacion, Formatos de
-- Impresion, Grupos de Cliente) nunca se sembraban para empresas creadas
-- DESPUES de que corrieron las migraciones 025-031/070, porque esos DO
-- blocks solo alcanzaban a las empresas que ya existian en ese momento.
--
-- Esta migracion: 1) vuelve a sembrar el default en cualquier empresa que
-- hoy no tenga filas en alguno de esos 8 catalogos (corrige el problema ya
-- ocurrido), y 2) agrega "or es_super_admin()" al INSERT de cada uno, para
-- que el codigo de EmpresasSection.tsx (que corre como el usuario super
-- admin autenticado, sujeto a RLS) pueda sembrarlos el mismo momento en que
-- crea la empresa, y esto no se repita con empresas futuras.
-- ============================================================================

drop policy if exists estatus_unidad_insert on public.estatus_unidad;
create policy estatus_unidad_insert on public.estatus_unidad for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists clasificaciones_viaje_insert on public.clasificaciones_viaje;
create policy clasificaciones_viaje_insert on public.clasificaciones_viaje for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists grupos_unidad_insert on public.grupos_unidad;
create policy grupos_unidad_insert on public.grupos_unidad for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists tipos_viaje_insert on public.tipos_viaje;
create policy tipos_viaje_insert on public.tipos_viaje for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists clasificaciones_operador_insert on public.clasificaciones_operador;
create policy clasificaciones_operador_insert on public.clasificaciones_operador for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists conceptos_facturacion_insert on public.conceptos_facturacion;
create policy conceptos_facturacion_insert on public.conceptos_facturacion for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists formatos_impresion_insert on public.formatos_impresion;
create policy formatos_impresion_insert on public.formatos_impresion for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

drop policy if exists grupos_cliente_insert on public.grupos_cliente;
create policy grupos_cliente_insert on public.grupos_cliente for insert
  with check ((empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear')) or es_super_admin());

-- Backfill: siembra el default en cualquier empresa que hoy no tenga nada
-- en cada uno de estos 8 catalogos (mismos valores que las migraciones
-- originales 025, 026, 027, 028, 029, 031, 035 y 070).
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.estatus_unidad where empresa_id = emp.id) then
      insert into public.estatus_unidad (id, nombre, color, tipo_estatus, empresa_id) values
        (emp.id || '-estu-disponible', 'Disponible', 'green', 'Disponible', emp.id),
        (emp.id || '-estu-ocupada', 'Ocupada', 'red', 'Ocupada', emp.id),
        (emp.id || '-estu-mantenimiento', 'En Mantenimiento', 'yellow', 'Ocupada', emp.id),
        (emp.id || '-estu-asignada', 'Asignada', 'blue', 'Ocupada', emp.id),
        (emp.id || '-estu-servicio', 'En Servicio', 'cyan', 'Ocupada', emp.id);
    end if;

    if not exists (select 1 from public.clasificaciones_viaje where empresa_id = emp.id) then
      insert into public.clasificaciones_viaje (id, codigo, clasificacion, empresa_id) values
        (emp.id || '-clv-1', '1', 'SENCILLO', emp.id),
        (emp.id || '-clv-2', '2', 'FULL', emp.id);
    end if;

    if not exists (select 1 from public.grupos_unidad where empresa_id = emp.id) then
      insert into public.grupos_unidad (id, codigo, nombre, color, empresa_id) values
        (emp.id || '-gru-1', '1', 'GENERAL', 'gray', emp.id),
        (emp.id || '-gru-2', '2', 'TRACTOS', 'blue', emp.id),
        (emp.id || '-gru-3', '3', 'REMOLQUES', 'amber', emp.id),
        (emp.id || '-gru-4', '4', 'DOLLY', 'purple', emp.id);
    end if;

    if not exists (select 1 from public.tipos_viaje where empresa_id = emp.id) then
      insert into public.tipos_viaje (id, codigo, tipo_viaje, empresa_id) values
        (emp.id || '-tpv-1', '1', 'LOCAL', emp.id),
        (emp.id || '-tpv-2', '2', 'NACIONAL', emp.id);
    end if;

    if not exists (select 1 from public.clasificaciones_operador where empresa_id = emp.id) then
      insert into public.clasificaciones_operador (id, codigo, clasificacion, empresa_id) values
        (emp.id || '-clo-1', '1', 'PROPIO', emp.id),
        (emp.id || '-clo-2', '2', 'PERMISIONARIO', emp.id),
        (emp.id || '-clo-3', '3', 'TORTON', emp.id),
        (emp.id || '-clo-4', '4', 'FULL', emp.id),
        (emp.id || '-clo-5', '5', 'TRACTOCAMION', emp.id),
        (emp.id || '-clo-6', '6', 'CAMIONETAS', emp.id);
    end if;

    if not exists (select 1 from public.formatos_impresion where empresa_id = emp.id) then
      insert into public.formatos_impresion (id, area, clave, nombre, descripcion, activo, empresa_id) values
        (emp.id || '-fmt-1', 'Viajes', 'real', 'Con Importe Real', 'Incluye los conceptos de facturacion con sus importes reales. Para uso interno/oficina.', true, emp.id),
        (emp.id || '-fmt-2', 'Viajes', 'cero', 'Con Valor $0', 'Muestra los mismos conceptos pero con importe en $0.00. Para entregar al operador.', true, emp.id);
    end if;

    if not exists (select 1 from public.grupos_cliente where empresa_id = emp.id) then
      insert into public.grupos_cliente (id, codigo, nombre, color, empresa_id) values
        (emp.id || '-grc-1', '1', 'GENERAL', 'gray', emp.id);
    end if;
  end loop;
end $$;

-- Conceptos de Facturacion: se siembra aparte por su estructura distinta
-- (jsonb de traslados/retenciones).
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
