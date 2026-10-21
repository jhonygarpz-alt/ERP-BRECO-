-- Habilita Realtime (postgres_changes) para las tablas compartidas, para
-- que un cambio hecho en un modulo (ej. Asignacion de Viajes) se refleje
-- solo, sin recargar, en cualquier otro modulo que lea la misma tabla
-- (Programa Diario, Entrega de Turno, la pantalla Aeropuerto, etc.) y en
-- las sesiones de otros usuarios.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clientes', 'unidades', 'cajas', 'operadores',
    'viajes', 'estatus_viaje',
    'facturas', 'facturas_sistema',
    'entrega_turno_unidad', 'entrega_turno_nota',
    'reportes', 'usuarios', 'roles', 'empresa'
  ])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
