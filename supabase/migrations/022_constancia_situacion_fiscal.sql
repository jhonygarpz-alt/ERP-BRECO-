-- ============================================================================
-- Constancia de Situacion Fiscal de la empresa: guarda el PDF original
-- (Supabase Storage) y la fecha en que se importo por ultima vez, para que
-- el catalogo "Constancia de Situacion Fiscal" pueda mostrar/actualizar los
-- datos fiscales de la empresa (RFC, razon social, domicilio) a partir del
-- PDF real emitido por el SAT.
-- ============================================================================

alter table public.empresas
  add column if not exists csf_storage_path text not null default '',
  add column if not exists csf_importada_en timestamptz;

insert into storage.buckets (id, name, public)
values ('empresa-documentos', 'empresa-documentos', false)
on conflict (id) do nothing;

drop policy if exists empresa_documentos_select on storage.objects;
create policy empresa_documentos_select on storage.objects for select
  using (
    bucket_id = 'empresa-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Configuracion', 'ver')
  );

drop policy if exists empresa_documentos_insert on storage.objects;
create policy empresa_documentos_insert on storage.objects for insert
  with check (
    bucket_id = 'empresa-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Configuracion', 'editar')
  );

drop policy if exists empresa_documentos_delete on storage.objects;
create policy empresa_documentos_delete on storage.objects for delete
  using (
    bucket_id = 'empresa-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Configuracion', 'editar')
  );
