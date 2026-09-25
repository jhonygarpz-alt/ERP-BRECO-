-- ============================================================================
-- Licenciamiento de empresas (torre de control del Super Admin):
--   - licencias_contratadas: cuantos usuarios pueden tener sesion abierta al
--     mismo tiempo en esa empresa.
--   - modulos_contratados: que modulos del sistema puede usar esa empresa
--     (ej. solo Trafico + Facturacion + Cobranza). Un arreglo vacio significa
--     "sin restriccion" (todos los modulos) -- asi las empresas ya existentes
--     (BRECO) siguen viendo todo exactamente igual sin necesitar ningun dato
--     nuevo. "Configuracion" siempre esta disponible aunque no se liste, para
--     que el administrador de la empresa pueda gestionar su cuenta.
--   - costo_por_licencia: lo que el Super Admin cobra por licencia al mes,
--     solo informativo para el panel de Super Admin.
--   - estatus gana el valor 'suspendida': para cuando un cliente no paga a
--     tiempo. Se aplica adentro de has_permission() (igual que el resto de
--     los permisos) para que una empresa suspendida quede bloqueada de
--     verdad en la base de datos, no solo oculta en la interfaz.
--
-- Ademas se agrega el control de "licencias simultaneas": una tabla
-- sesiones_activas (quien tiene sesion abierta ahora mismo) y dos funciones
-- (registrar_sesion/liberar_sesion) que el frontend llama al iniciar sesion
-- y cada minuto mientras sigue conectado -- si ya se alcanzo el limite de
-- licencias contratadas, registrar_sesion regresa ok:false y el frontend
-- cierra esa sesion nueva.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columnas nuevas en empresas
-- ----------------------------------------------------------------------------

alter table public.empresas add column if not exists licencias_contratadas integer not null default 1;
alter table public.empresas add column if not exists costo_por_licencia numeric(12, 2) not null default 0;
alter table public.empresas add column if not exists modulos_contratados jsonb not null default '[]'::jsonb;

alter table public.empresas drop constraint if exists empresas_estatus_check;
alter table public.empresas add constraint empresas_estatus_check check (estatus in ('activa', 'inactiva', 'suspendida'));

-- ----------------------------------------------------------------------------
-- 2. has_permission(): bloquea de raiz (para TODAS las tablas que ya
--    dependen de esta funcion) a una empresa suspendida, y respeta los
--    modulos contratados.
-- ----------------------------------------------------------------------------

create or replace function public.has_permission(p_modulo text, p_accion text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select (r.permisos -> p_modulo ->> p_accion)::boolean
      from public.usuarios u
      join public.roles r on r.id = u.rol_id
      join public.empresas e on e.id = u.empresa_id
      where u.id = auth.uid()
        and u.estatus = 'activo'
        and e.estatus <> 'suspendida'
        and (
          jsonb_array_length(e.modulos_contratados) = 0
          or p_modulo = 'Configuracion'
          or e.modulos_contratados ? p_modulo
        )
    ),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. Licencias simultaneas: sesiones_activas + registrar_sesion/liberar_sesion
-- ----------------------------------------------------------------------------

create table if not exists public.sesiones_activas (
  usuario_id uuid primary key references public.usuarios (id) on delete cascade,
  empresa_id text not null references public.empresas (id) on delete cascade,
  ultimo_ping timestamptz not null default now()
);

alter table public.sesiones_activas enable row level security;
-- Sin politicas para el cliente: solo las funciones de abajo (security
-- definer, dueno postgres) la leen/escriben. Nadie mas tiene acceso directo.

create or replace function public.registrar_sesion()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id text;
  v_licencias int;
  v_activos int;
begin
  v_empresa_id := public.current_empresa_id();
  -- Un super admin no pertenece a ninguna empresa: sin limite de licencias.
  if v_empresa_id is null then
    return jsonb_build_object('ok', true);
  end if;

  -- Limpia sesiones que dejaron de mandar "ping" (pestana cerrada sin
  -- cerrar sesion, telefono que se quedo sin señal, etc.).
  delete from public.sesiones_activas
  where empresa_id = v_empresa_id
    and ultimo_ping < now() - interval '3 minutes'
    and usuario_id <> auth.uid();

  -- Si ya tenia una sesion registrada, solo renueva el ping.
  if exists (select 1 from public.sesiones_activas where usuario_id = auth.uid()) then
    update public.sesiones_activas set ultimo_ping = now() where usuario_id = auth.uid();
    return jsonb_build_object('ok', true);
  end if;

  select licencias_contratadas into v_licencias from public.empresas where id = v_empresa_id;
  select count(*) into v_activos from public.sesiones_activas where empresa_id = v_empresa_id;

  if v_activos >= coalesce(v_licencias, 1) then
    return jsonb_build_object('ok', false, 'licencias', coalesce(v_licencias, 1));
  end if;

  insert into public.sesiones_activas (usuario_id, empresa_id, ultimo_ping)
  values (auth.uid(), v_empresa_id, now());

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.liberar_sesion()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sesiones_activas where usuario_id = auth.uid();
$$;
