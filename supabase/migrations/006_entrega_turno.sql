-- Nuevo modulo "Entrega de Turno": reporte narrativo por unidad que el
-- jefe de trafico saliente le deja al que entra, mas notas de citas y
-- prioridades del turno.

create table if not exists public.entrega_turno_unidad (
  id text primary key,
  fecha date not null,
  unidad_texto text not null default '',
  operador_texto text not null default '',
  servicio_anterior text not null default '',
  semaforo text not null default 'verde' check (semaforo in ('verde', 'amarillo', 'rojo')),
  estatus_actual text not null default '',
  nota_adicional text not null default '',
  cita text not null default '',
  instruccion text not null default '',
  proximo_servicio text not null default '',
  resumen_estatus text not null default '',
  resumen_siguiente text not null default '',
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.entrega_turno_nota (
  id text primary key,
  fecha date not null,
  tipo text not null check (tipo in ('cita', 'prioridad')),
  texto text not null default '',
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

alter table public.entrega_turno_unidad enable row level security;
drop policy if exists entrega_turno_unidad_select on public.entrega_turno_unidad;
create policy entrega_turno_unidad_select on public.entrega_turno_unidad for select using (has_permission('EntregaTurno', 'ver'));
drop policy if exists entrega_turno_unidad_insert on public.entrega_turno_unidad;
create policy entrega_turno_unidad_insert on public.entrega_turno_unidad for insert with check (has_permission('EntregaTurno', 'crear'));
drop policy if exists entrega_turno_unidad_update on public.entrega_turno_unidad;
create policy entrega_turno_unidad_update on public.entrega_turno_unidad for update using (has_permission('EntregaTurno', 'editar'));
drop policy if exists entrega_turno_unidad_delete on public.entrega_turno_unidad;
create policy entrega_turno_unidad_delete on public.entrega_turno_unidad for delete using (has_permission('EntregaTurno', 'eliminar'));

alter table public.entrega_turno_nota enable row level security;
drop policy if exists entrega_turno_nota_select on public.entrega_turno_nota;
create policy entrega_turno_nota_select on public.entrega_turno_nota for select using (has_permission('EntregaTurno', 'ver'));
drop policy if exists entrega_turno_nota_insert on public.entrega_turno_nota;
create policy entrega_turno_nota_insert on public.entrega_turno_nota for insert with check (has_permission('EntregaTurno', 'crear'));
drop policy if exists entrega_turno_nota_update on public.entrega_turno_nota;
create policy entrega_turno_nota_update on public.entrega_turno_nota for update using (has_permission('EntregaTurno', 'editar'));
drop policy if exists entrega_turno_nota_delete on public.entrega_turno_nota;
create policy entrega_turno_nota_delete on public.entrega_turno_nota for delete using (has_permission('EntregaTurno', 'eliminar'));

-- Cada rol que ya existe recibe el mismo nivel de permiso que ya tiene en
-- "Programa" para el nuevo modulo "EntregaTurno" (mismo perfil de usuario:
-- quien arma el programa diario es quien arma la entrega de turno).
update public.roles
set permisos = permisos || jsonb_build_object(
  'EntregaTurno',
  coalesce(permisos -> 'Programa', jsonb_build_object('ver', true, 'crear', false, 'editar', false, 'eliminar', false))
)
where not (permisos ? 'EntregaTurno');
