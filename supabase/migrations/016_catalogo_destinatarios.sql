-- ============================================================================
-- Catalogo de Destinatarios (Remitentes-Destinatarios): ubicaciones fisicas
-- que sirven de origen/destino en un viaje. Pueden estar ligadas a un
-- Cliente (varias ubicaciones por cliente) o ser independientes (patios,
-- terminales, etc.).
-- ============================================================================

create table if not exists public.destinatarios (
  id uuid primary key default gen_random_uuid(),
  numero text not null default '',
  rfc text not null default '',
  no_equivalencia text not null default '',
  nombre text not null default '',
  estatus text not null default 'activo' check (estatus in ('activo', 'inactivo')),
  es_patio boolean not null default false,
  cliente_id uuid references public.clientes (id) on delete set null,
  pais text not null default 'Mexico',
  estado text not null default '',
  municipio text not null default '',
  cp text not null default '',
  localidad text not null default '',
  colonia text not null default '',
  calle text not null default '',
  numero_exterior text not null default '',
  numero_interior text not null default '',
  telefono text not null default '',
  contacto text not null default '',
  correo text not null default '',
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_destinatarios on public.destinatarios;
create trigger trg_empresa_id_destinatarios before insert on public.destinatarios
  for each row execute function public.set_empresa_id();

-- Autonumera "numero" (formato 000001, consecutivo por empresa), igual que
-- el numero de cliente.
create or replace function public.set_numero_destinatario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.numero is null or new.numero = '' then
    select coalesce(max(numero::integer), 0) + 1 into siguiente
    from public.destinatarios
    where empresa_id = new.empresa_id and numero ~ '^[0-9]+$';
    new.numero := lpad(siguiente::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_numero_destinatario on public.destinatarios;
create trigger trg_numero_destinatario before insert on public.destinatarios
  for each row execute function public.set_numero_destinatario();

alter table public.destinatarios enable row level security;

drop policy if exists destinatarios_select on public.destinatarios;
create policy destinatarios_select on public.destinatarios for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists destinatarios_insert on public.destinatarios;
create policy destinatarios_insert on public.destinatarios for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists destinatarios_update on public.destinatarios;
create policy destinatarios_update on public.destinatarios for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists destinatarios_delete on public.destinatarios;
create policy destinatarios_delete on public.destinatarios for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'destinatarios'
  ) then
    execute 'alter publication supabase_realtime add table public.destinatarios';
  end if;
end $$;
