-- ============================================================================
-- Soporte Tecnico: mensajes que cualquier usuario de cualquier empresa envia
-- desde el widget de soporte del ERP (boton flotante). Llegan directo a un
-- submodulo del panel de super admin ("Soporte Tecnico"), sin pasar por
-- WhatsApp ni por ningun servicio externo -- el cliente nunca sale del ERP.
--
-- Cualquier usuario autenticado puede insertar su propio ticket (no se
-- exige ningun permiso de modulo, es soporte, no una funcion operativa).
-- Solo el super admin de la plataforma puede leerlos/editarlos.
-- ============================================================================

create table if not exists public.tickets_soporte (
  id text primary key,
  nombre text not null default '',
  empresa_texto text not null default '',
  telefono text not null default '',
  problema text not null default '',
  estatus text not null default 'Nuevo' check (estatus in ('Nuevo', 'Atendido')),
  creado_en timestamptz not null default now(),
  empresa_id text not null references public.empresas (id) on delete cascade
);

drop trigger if exists trg_empresa_id_tickets_soporte on public.tickets_soporte;
create trigger trg_empresa_id_tickets_soporte before insert on public.tickets_soporte
  for each row execute function public.set_empresa_id();

create index if not exists idx_tickets_soporte_empresa_id on public.tickets_soporte (empresa_id);
create index if not exists idx_tickets_soporte_estatus on public.tickets_soporte (estatus);

alter table public.tickets_soporte enable row level security;

drop policy if exists tickets_soporte_select on public.tickets_soporte;
create policy tickets_soporte_select on public.tickets_soporte for select
  using (es_super_admin());
drop policy if exists tickets_soporte_insert on public.tickets_soporte;
create policy tickets_soporte_insert on public.tickets_soporte for insert
  with check (empresa_id = current_empresa_id());
drop policy if exists tickets_soporte_update on public.tickets_soporte;
create policy tickets_soporte_update on public.tickets_soporte for update
  using (es_super_admin());
drop policy if exists tickets_soporte_delete on public.tickets_soporte;
create policy tickets_soporte_delete on public.tickets_soporte for delete
  using (es_super_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets_soporte'
  ) then
    execute 'alter publication supabase_realtime add table public.tickets_soporte';
  end if;
end $$;
