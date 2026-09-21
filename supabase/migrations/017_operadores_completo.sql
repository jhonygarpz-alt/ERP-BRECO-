-- ============================================================================
-- Catalogo de Operadores completo: informacion general, direccion,
-- documentos de identidad, informacion medica, expediente (documentos
-- cargados + vencimientos) e informacion bancaria, calcado del formulario
-- real que compartio el usuario.
-- ============================================================================

alter table public.operadores drop column if exists tipo_licencia;

alter table public.operadores
  add column if not exists numero text not null default '',
  add column if not exists nombres text not null default '',
  add column if not exists apellido_paterno text not null default '',
  add column if not exists apellido_materno text not null default '',
  add column if not exists activo boolean not null default true,
  add column if not exists es_permisionario boolean not null default false,
  add column if not exists es_extranjero boolean not null default false,
  add column if not exists rfc text not null default '',
  add column if not exists curp text not null default '',
  add column if not exists fecha_contratacion date,
  add column if not exists sucursal text not null default 'Matriz',
  add column if not exists celular text not null default '',
  add column if not exists hash_gmtgps text not null default '',
  add column if not exists registro_patronal text not null default '',
  add column if not exists foto_data_url text not null default '',
  add column if not exists observaciones text not null default '',
  add column if not exists pais text not null default 'Mexico',
  add column if not exists estado text not null default '',
  add column if not exists municipio text not null default '',
  add column if not exists localidad text not null default '',
  add column if not exists cp text not null default '',
  add column if not exists colonia text not null default '',
  add column if not exists calle text not null default '',
  add column if not exists numero_exterior text not null default '',
  add column if not exists numero_interior text not null default '',
  add column if not exists domicilio_referencia text not null default '',
  add column if not exists pasaporte text not null default '',
  add column if not exists vigencia_pasaporte date,
  add column if not exists licencia_b boolean not null default false,
  add column if not exists licencia_c boolean not null default false,
  add column if not exists licencia_e boolean not null default false,
  add column if not exists no_imss text not null default '',
  add column if not exists grupo_sanguineo text not null default '',
  add column if not exists alergias text not null default '',
  add column if not exists diabetico boolean not null default false,
  add column if not exists hipertenso boolean not null default false,
  add column if not exists documentos jsonb not null default '[]'::jsonb,
  add column if not exists vencimientos jsonb not null default '[]'::jsonb,
  add column if not exists banco text not null default '',
  add column if not exists cuenta_clabe text not null default '',
  add column if not exists no_tarjeta text not null default '';

-- Autonumera "numero" (formato 000001, consecutivo por empresa).
create or replace function public.set_numero_operador() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.numero is null or new.numero = '' then
    select coalesce(max(numero::integer), 0) + 1 into siguiente
    from public.operadores
    where empresa_id = new.empresa_id and numero ~ '^[0-9]+$';
    new.numero := lpad(siguiente::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_numero_operador on public.operadores;
create trigger trg_numero_operador before insert on public.operadores
  for each row execute function public.set_numero_operador();

-- ----------------------------------------------------------------------------
-- Storage: bucket privado para el expediente (fotos/documentos) de cada
-- operador. La ruta de cada archivo se estructura como
-- "{empresa_id}/{operador_id}/{archivo}", y las politicas de storage.objects
-- usan ese primer segmento para aislar por empresa, igual que el resto del
-- sistema.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('operador-documentos', 'operador-documentos', false)
on conflict (id) do nothing;

drop policy if exists operador_documentos_select on storage.objects;
create policy operador_documentos_select on storage.objects for select
  using (
    bucket_id = 'operador-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'ver')
  );

drop policy if exists operador_documentos_insert on storage.objects;
create policy operador_documentos_insert on storage.objects for insert
  with check (
    bucket_id = 'operador-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'crear')
  );

drop policy if exists operador_documentos_delete on storage.objects;
create policy operador_documentos_delete on storage.objects for delete
  using (
    bucket_id = 'operador-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'eliminar')
  );
