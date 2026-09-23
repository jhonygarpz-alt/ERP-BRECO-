-- ============================================================================
-- Soporte Tecnico: convierte el ticket de un mensaje unico en una
-- conversacion (hilo de mensajes) para poder responder desde el Panel de
-- plataforma y que el cliente vea la respuesta y siga escribiendo, sin
-- salir del ERP, hasta resolver su problema.
--
-- - mensajes: arreglo jsonb [{id, autor: 'cliente'|'soporte', texto, fecha}].
-- - usuario_id: el usuario (auth.users) que abrio el ticket -- ahora el
--   select/update ya no es exclusivo del super admin: el propio usuario
--   que escribio puede leer y responder SU ticket (para ver la respuesta y
--   continuar la conversacion), el super admin sigue viendo todos.
-- ============================================================================

alter table public.tickets_soporte add column if not exists usuario_id uuid references auth.users (id) on delete set null;
alter table public.tickets_soporte add column if not exists mensajes jsonb not null default '[]';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tickets_soporte' and column_name = 'problema'
  ) then
    update public.tickets_soporte
    set mensajes = jsonb_build_array(
      jsonb_build_object('id', id || '-m1', 'autor', 'cliente', 'texto', problema, 'fecha', creado_en)
    )
    where mensajes = '[]'::jsonb and coalesce(problema, '') <> '';
  end if;
end $$;

alter table public.tickets_soporte drop column if exists problema;

create or replace function public.set_usuario_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.usuario_id is null then
    new.usuario_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_usuario_id_tickets_soporte on public.tickets_soporte;
create trigger trg_usuario_id_tickets_soporte before insert on public.tickets_soporte
  for each row execute function public.set_usuario_id();

create index if not exists idx_tickets_soporte_usuario_id on public.tickets_soporte (usuario_id);

drop policy if exists tickets_soporte_select on public.tickets_soporte;
create policy tickets_soporte_select on public.tickets_soporte for select
  using (usuario_id = auth.uid() or es_super_admin());

drop policy if exists tickets_soporte_insert on public.tickets_soporte;
create policy tickets_soporte_insert on public.tickets_soporte for insert
  with check (empresa_id = current_empresa_id() and usuario_id = auth.uid());

drop policy if exists tickets_soporte_update on public.tickets_soporte;
create policy tickets_soporte_update on public.tickets_soporte for update
  using (usuario_id = auth.uid() or es_super_admin())
  with check (usuario_id = auth.uid() or es_super_admin());
