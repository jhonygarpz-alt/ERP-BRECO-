-- ============================================================================
-- Catalogo de Proveedores: Datos Generales, Domicilio Fiscal (con colonias
-- predictivas por C.P., igual que Clientes/Destinatarios/Operadores),
-- Creditos, Cuenta Bancaria y Documentos (con carga real a Supabase
-- Storage).
-- ============================================================================

create table if not exists public.proveedores (
  id text primary key,
  numero text not null default '',
  fecha date not null default current_date,
  estatus text not null default 'activo' check (estatus in ('activo', 'inactivo')),
  tipo text not null default 'Nacional' check (tipo in ('Nacional', 'Extranjero')),
  rfc text not null default '',
  nombre text not null default '',
  nombre_corto text not null default '',
  es_proveedor_combustible boolean not null default false,
  proveedor_bienes boolean not null default false,
  proveedor_servicios boolean not null default false,
  grupo text not null default '',
  tipo_operacion text not null default '',
  tipo_tercero text not null default '',
  short_name_sap text not null default '',
  pais text not null default 'Mexico',
  estado text not null default '',
  cp text not null default '',
  municipio text not null default '',
  colonia text not null default '',
  localidad text not null default '',
  calle text not null default '',
  numero_exterior text not null default '',
  numero_interior text not null default '',
  correo text not null default '',
  telefonos text not null default '',
  celular text not null default '',
  nextel text not null default '',
  forma_pago text not null default 'Efectivo',
  dias_credito integer not null default 0,
  limite_credito_mxn numeric(12, 2) not null default 0,
  limite_credito_usd numeric(12, 2) not null default 0,
  banco text not null default '',
  cuenta_clabe text not null default '',
  no_cuenta text not null default '',
  documentos jsonb not null default '[]'::jsonb,
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_proveedores on public.proveedores;
create trigger trg_empresa_id_proveedores before insert on public.proveedores
  for each row execute function public.set_empresa_id();

-- Autonumera "numero" (formato 000001, consecutivo por empresa), mismo
-- patron que Clientes/Destinatarios/Operadores/Unidades.
create or replace function public.set_numero_proveedor() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.numero is null or new.numero = '' then
    select coalesce(max(numero::integer), 0) + 1 into siguiente
    from public.proveedores
    where empresa_id = new.empresa_id and numero ~ '^[0-9]+$';
    new.numero := lpad(siguiente::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_numero_proveedor on public.proveedores;
create trigger trg_numero_proveedor before insert on public.proveedores
  for each row execute function public.set_numero_proveedor();

-- El numero y el RFC (cuando tiene valor) son datos obligatorios que
-- identifican al proveedor: no se repiten dentro de la misma empresa.
create unique index if not exists idx_proveedores_empresa_numero
  on public.proveedores (empresa_id, numero) where numero <> '';
create unique index if not exists idx_proveedores_empresa_rfc
  on public.proveedores (empresa_id, upper(rfc)) where rfc <> '';

alter table public.proveedores enable row level security;

drop policy if exists proveedores_select on public.proveedores;
create policy proveedores_select on public.proveedores for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists proveedores_insert on public.proveedores;
create policy proveedores_insert on public.proveedores for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists proveedores_update on public.proveedores;
create policy proveedores_update on public.proveedores for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists proveedores_delete on public.proveedores;
create policy proveedores_delete on public.proveedores for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'proveedores'
  ) then
    execute 'alter publication supabase_realtime add table public.proveedores';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Storage: bucket privado para la pestana "Documentos" de cada proveedor,
-- mismo patron que Operadores/Unidades/Remolques.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('proveedor-documentos', 'proveedor-documentos', false)
on conflict (id) do nothing;

drop policy if exists proveedor_documentos_select on storage.objects;
create policy proveedor_documentos_select on storage.objects for select
  using (
    bucket_id = 'proveedor-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'ver')
  );

drop policy if exists proveedor_documentos_insert on storage.objects;
create policy proveedor_documentos_insert on storage.objects for insert
  with check (
    bucket_id = 'proveedor-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'crear')
  );

drop policy if exists proveedor_documentos_delete on storage.objects;
create policy proveedor_documentos_delete on storage.objects for delete
  using (
    bucket_id = 'proveedor-documentos'
    and (storage.foldername(name))[1] = current_empresa_id()
    and has_permission('Catalogos', 'eliminar')
  );
