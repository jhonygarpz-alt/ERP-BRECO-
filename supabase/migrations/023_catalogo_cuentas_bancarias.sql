-- ============================================================================
-- Catalogo de Cuentas Bancarias de la empresa.
-- ============================================================================

create table if not exists public.cuentas_bancarias (
  id text primary key,
  numero text not null default '',
  activa boolean not null default true,
  descripcion text not null default '',
  contabilizar boolean not null default true,
  banco text not null default '',
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_cuentas_bancarias on public.cuentas_bancarias;
create trigger trg_empresa_id_cuentas_bancarias before insert on public.cuentas_bancarias
  for each row execute function public.set_empresa_id();

-- El numero de cuenta (dato obligatorio) no se repite dentro de la misma empresa.
create unique index if not exists idx_cuentas_bancarias_empresa_numero
  on public.cuentas_bancarias (empresa_id, numero) where numero <> '';

alter table public.cuentas_bancarias enable row level security;

drop policy if exists cuentas_bancarias_select on public.cuentas_bancarias;
create policy cuentas_bancarias_select on public.cuentas_bancarias for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists cuentas_bancarias_insert on public.cuentas_bancarias;
create policy cuentas_bancarias_insert on public.cuentas_bancarias for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists cuentas_bancarias_update on public.cuentas_bancarias;
create policy cuentas_bancarias_update on public.cuentas_bancarias for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists cuentas_bancarias_delete on public.cuentas_bancarias;
create policy cuentas_bancarias_delete on public.cuentas_bancarias for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cuentas_bancarias'
  ) then
    execute 'alter publication supabase_realtime add table public.cuentas_bancarias';
  end if;
end $$;
