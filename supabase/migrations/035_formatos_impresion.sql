-- ============================================================================
-- Catalogo de Formatos de Impresion: agrupa por area/proceso de la
-- herramienta (Viajes, Facturacion, Complementos de Pago, etc.) los
-- distintos formatos disponibles para imprimir, cada uno con un boton para
-- habilitarlo o deshabilitarlo. "clave" es el identificador tecnico que usa
-- cada pantalla de impresion para saber que formato eligio el usuario (ej.
-- "real"/"cero" en la impresion de Viajes); nombre/descripcion/activo son
-- editables desde Configuracion -> Formatos de Impresion.
-- ============================================================================

create table if not exists public.formatos_impresion (
  id text primary key,
  area text not null default '',
  clave text not null default '',
  nombre text not null default '',
  descripcion text not null default '',
  activo boolean not null default true,
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_formatos_impresion on public.formatos_impresion;
create trigger trg_empresa_id_formatos_impresion before insert on public.formatos_impresion
  for each row execute function public.set_empresa_id();

-- El nombre de un formato (dato obligatorio) no se repite dentro de la
-- misma area, para la misma empresa.
create unique index if not exists idx_formatos_impresion_empresa_area_nombre
  on public.formatos_impresion (empresa_id, area, upper(nombre)) where nombre <> '';

alter table public.formatos_impresion enable row level security;

drop policy if exists formatos_impresion_select on public.formatos_impresion;
create policy formatos_impresion_select on public.formatos_impresion for select
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'ver'));
drop policy if exists formatos_impresion_insert on public.formatos_impresion;
create policy formatos_impresion_insert on public.formatos_impresion for insert
  with check (empresa_id = current_empresa_id() and has_permission('Catalogos', 'crear'));
drop policy if exists formatos_impresion_update on public.formatos_impresion;
create policy formatos_impresion_update on public.formatos_impresion for update
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'editar'));
drop policy if exists formatos_impresion_delete on public.formatos_impresion;
create policy formatos_impresion_delete on public.formatos_impresion for delete
  using (empresa_id = current_empresa_id() and has_permission('Catalogos', 'eliminar'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'formatos_impresion'
  ) then
    execute 'alter publication supabase_realtime add table public.formatos_impresion';
  end if;
end $$;

-- Siembra los formatos de Viajes que ya existen en la app (Con Importe
-- Real / Con Valor $0), y dos areas mas vacias listas para cuando se
-- agreguen sus formatos.
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    if not exists (select 1 from public.formatos_impresion where empresa_id = emp.id) then
      insert into public.formatos_impresion (id, area, clave, nombre, descripcion, activo, empresa_id) values
        (emp.id || '-fmt-1', 'Viajes', 'real', 'Con Importe Real', 'Incluye los conceptos de facturacion con sus importes reales. Para uso interno/oficina.', true, emp.id),
        (emp.id || '-fmt-2', 'Viajes', 'cero', 'Con Valor $0', 'Muestra los mismos conceptos pero con importe en $0.00. Para entregar al operador.', true, emp.id);
    end if;
  end loop;
end $$;
