-- ============================================================================
-- Catalogo de Clientes completo: agrega todos los campos del formulario real
-- (Datos Generales, Domicilio, Contactos, Pagos/Creditos, Informacion
-- adicional del pago) y retira los campos sueltos que existian antes
-- (contacto/telefono/email/direccion como texto libre), ya cubiertos por la
-- nueva estructura de domicilio + contactos.
-- ============================================================================

alter table public.clientes
  drop column if exists contacto,
  drop column if exists telefono,
  drop column if exists email,
  drop column if exists direccion;

alter table public.clientes
  add column if not exists numero_cliente text not null default '',
  add column if not exists nombre_corto text not null default '',
  add column if not exists fecha_alta date not null default current_date,
  add column if not exists curp text not null default '',
  add column if not exists tipo text not null default 'Nacional' check (tipo in ('Nacional', 'Extranjero')),
  add column if not exists moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  add column if not exists iva text not null default 'IVA 16%' check (iva in ('IVA 16%', 'IVA 0%', 'Exento')),
  add column if not exists grupo text not null default '',
  add column if not exists sucursal text not null default 'Matriz',
  add column if not exists operador_logistico boolean not null default false,
  add column if not exists aplicar_detalle_viaje_xml boolean not null default false,
  add column if not exists pais text not null default 'Mexico',
  add column if not exists cp text not null default '',
  add column if not exists estado text not null default '',
  add column if not exists municipio text not null default '',
  add column if not exists colonia text not null default '',
  add column if not exists localidad text not null default '',
  add column if not exists calle text not null default '',
  add column if not exists numero_exterior text not null default '',
  add column if not exists numero_interior text not null default '',
  add column if not exists telefonos text not null default '',
  add column if not exists celular text not null default '',
  add column if not exists correo text not null default '',
  add column if not exists contactos jsonb not null default '[]'::jsonb,
  add column if not exists forma_pago text not null default 'Efectivo',
  add column if not exists dias_credito integer not null default 0,
  add column if not exists limite_credito_mxn numeric(12, 2) not null default 0,
  add column if not exists limite_credito_usd numeric(12, 2) not null default 0,
  add column if not exists limitar_viajes boolean not null default false,
  add column if not exists limite_facturas_vencidas integer,
  add column if not exists banco_ordenante text not null default '',
  add column if not exists banco_ordenante_extranjero boolean not null default false,
  add column if not exists banco_rfc text not null default '',
  add column if not exists banco_no_cuenta text not null default '';

-- Autonumera "numero_cliente" (formato 000001, consecutivo por empresa) si no
-- viene explicito -- por ejemplo al importar un catalogo que ya trae su
-- propio numero.
create or replace function public.set_numero_cliente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  siguiente integer;
begin
  if new.numero_cliente is null or new.numero_cliente = '' then
    select coalesce(max(numero_cliente::integer), 0) + 1 into siguiente
    from public.clientes
    where empresa_id = new.empresa_id and numero_cliente ~ '^[0-9]+$';
    new.numero_cliente := lpad(siguiente::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Los triggers "before insert" de una tabla se disparan en orden alfabetico
-- por nombre; "trg_empresa_id_clientes" (migracion 010) se dispara antes que
-- "trg_numero_cliente" y deja empresa_id ya listo para el conteo de arriba.
drop trigger if exists trg_numero_cliente on public.clientes;
create trigger trg_numero_cliente before insert on public.clientes
  for each row execute function public.set_numero_cliente();
