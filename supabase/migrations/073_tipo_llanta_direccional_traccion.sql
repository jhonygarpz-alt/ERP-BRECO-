-- ============================================================================
-- Unidades y Remolques: "Tipo de llanta" se divide en dos campos
-- independientes -- uno para el eje de direccion y otro para el de
-- traccion -- en vez de un solo campo de texto libre. Reemplaza tambien
-- el campo "Eje de la llanta" (migracion 071) por ser redundante con esta
-- division.
-- ============================================================================

alter table public.unidades add column if not exists tipo_llanta_direccional text not null default '';
alter table public.unidades add column if not exists tipo_llanta_traccion text not null default '';
alter table public.cajas add column if not exists tipo_llanta_direccional text not null default '';
alter table public.cajas add column if not exists tipo_llanta_traccion text not null default '';

-- La columna vieja "tipo_llanta" puede ya no existir (si esta migracion se
-- corre mas de una vez, o si nunca se llego a usar); se hace con SQL
-- dinamico guardado por information_schema para que la sentencia ni
-- siquiera se intente parsear cuando la columna ya no esta.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'unidades' and column_name = 'tipo_llanta'
  ) then
    execute $sql$
      update public.unidades set tipo_llanta_direccional = tipo_llanta
        where tipo_llanta_direccional = '' and tipo_llanta is not null and tipo_llanta <> ''
    $sql$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cajas' and column_name = 'tipo_llanta'
  ) then
    execute $sql$
      update public.cajas set tipo_llanta_direccional = tipo_llanta
        where tipo_llanta_direccional = '' and tipo_llanta is not null and tipo_llanta <> ''
    $sql$;
  end if;
end $$;

alter table public.unidades drop column if exists tipo_llanta;
alter table public.unidades drop column if exists eje_llanta;
alter table public.cajas drop column if exists tipo_llanta;
alter table public.cajas drop column if exists eje_llanta;
