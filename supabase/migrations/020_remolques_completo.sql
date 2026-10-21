-- ============================================================================
-- Catalogo "Remolques" (antes "Cajas"): mismo llenado que Unidades pero con
-- especificaciones enfocadas a remolques/semirremolques, y "Tipo de
-- remolque" usando el catalogo oficial del SAT (c_SubTipoRem, Carta Porte)
-- -- la tabla sigue llamandose "cajas" para no romper lo que ya la usa
-- (viajes.caja_nombre/caja_economico, importadores, etc.), solo cambia
-- como se le llama en la interfaz.
-- ============================================================================

alter table public.cajas
  add column if not exists activa boolean not null default true,
  add column if not exists rentada boolean not null default false,
  add column if not exists es_permisionario boolean not null default false,
  add column if not exists descripcion text not null default '',
  add column if not exists sucursal text not null default 'Matriz',
  add column if not exists identidad_satelital text not null default '',
  add column if not exists identificador_convoy text not null default '',
  add column if not exists numero_serie text not null default '',
  add column if not exists color text not null default '',
  add column if not exists grupo_unidades text not null default '',
  add column if not exists foto_data_url text not null default '',
  add column if not exists largo_metros numeric(8, 2) not null default 0,
  add column if not exists ancho_metros numeric(8, 2) not null default 0,
  add column if not exists alto_metros numeric(8, 2) not null default 0,
  add column if not exists capacidad_kg numeric(10, 2) not null default 0,
  add column if not exists numero_ejes integer not null default 0,
  add column if not exists peso_tara_ton numeric(8, 2) not null default 0,
  add column if not exists documentos_vencimiento jsonb not null default '[]'::jsonb,
  add column if not exists archivos_adicionales jsonb not null default '[]'::jsonb,
  add column if not exists aseguradora text not null default '',
  add column if not exists no_poliza text not null default '',
  add column if not exists vigencia_desde date,
  add column if not exists vigencia_hasta date;

-- El "Codigo" (economico) es obligatorio y no se debe repetir dentro de la
-- misma empresa (dato mandatorio que identifica al remolque).
create unique index if not exists idx_cajas_empresa_economico
  on public.cajas (empresa_id, economico) where economico <> '';

-- ----------------------------------------------------------------------------
-- Storage: bucket privado para "Archivos adicionales" de cada remolque,
-- mismo patron que Operadores/Unidades.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('remolque-documentos', 'remolque-documentos', false)
on conflict (id) do nothing;

drop policy if exists remolque_documentos_select on storage.objects;
create policy remolque_documentos_select on storage.objects for select
  using (
    bucket_id = 'remolque-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'ver')
  );

drop policy if exists remolque_documentos_insert on storage.objects;
create policy remolque_documentos_insert on storage.objects for insert
  with check (
    bucket_id = 'remolque-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'crear')
  );

drop policy if exists remolque_documentos_delete on storage.objects;
create policy remolque_documentos_delete on storage.objects for delete
  using (
    bucket_id = 'remolque-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'eliminar')
  );
