-- ============================================================================
-- Catalogo de Folios (Configuracion): rangos de folios autorizados por
-- documento/sucursal/serie, con sus datos de aprobacion (No. Aprobacion,
-- Año, Fecha). Solo aplica a los documentos que se conforman de Serie +
-- Folio -- Factura, Carta Porte y Nota de Credito -- no a "Invoice", que no
-- se usa en este sistema.
--
-- Por ahora es un catalogo de referencia/control administrativo: no
-- sustituye la numeracion automatica que ya usan Factura/Viaje (Carta
-- Porte)/NotaCredito (sus folios se siguen generando igual que hoy). Cada
-- renglon representa un bloque completo (Folio Inicial a Folio Final); para
-- dar de baja una autorizacion se elimina el renglon completo, lo que
-- equivale a "eliminar del folio inicial al final".
-- ============================================================================

create table if not exists public.folios_autorizados (
  id text primary key,
  documento text not null check (documento in ('Factura', 'CartaPorte', 'NotaCredito')),
  sucursal text not null default '',
  serie text not null default '',
  folio_inicial integer not null default 0,
  folio_final integer not null default 0,
  no_aprobacion text not null default '',
  anio_aprobacion integer,
  fecha_aprobacion date,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade,
  check (folio_final >= folio_inicial)
);

drop trigger if exists trg_empresa_id_folios_autorizados on public.folios_autorizados;
create trigger trg_empresa_id_folios_autorizados before insert on public.folios_autorizados
  for each row execute function public.set_empresa_id();

create index if not exists idx_folios_autorizados_empresa_id on public.folios_autorizados (empresa_id);
create index if not exists idx_folios_autorizados_documento on public.folios_autorizados (documento);

alter table public.folios_autorizados enable row level security;

drop policy if exists folios_autorizados_select on public.folios_autorizados;
create policy folios_autorizados_select on public.folios_autorizados for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists folios_autorizados_insert on public.folios_autorizados;
create policy folios_autorizados_insert on public.folios_autorizados for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists folios_autorizados_update on public.folios_autorizados;
create policy folios_autorizados_update on public.folios_autorizados for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists folios_autorizados_delete on public.folios_autorizados;
create policy folios_autorizados_delete on public.folios_autorizados for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'folios_autorizados'
  ) then
    execute 'alter publication supabase_realtime add table public.folios_autorizados';
  end if;
end $$;
