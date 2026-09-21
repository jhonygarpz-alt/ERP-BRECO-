-- ============================================================================
-- Evita duplicidad en los datos obligatorios que identifican un registro,
-- por empresa (dos empresas distintas si pueden compartir el mismo RFC,
-- numero, etc. -- cada una es independiente). Los indices son parciales
-- (solo aplican cuando el campo no esta vacio) para no bloquear los
-- registros que todavia no capturan ese dato opcional.
-- ============================================================================

-- Operadores: numero siempre unico por empresa (ya sea autoasignado o
-- editado a mano); RFC y numero de licencia unicos por empresa cuando
-- tienen valor -- son los datos obligatorios que identifican a un
-- operador real, para no dar de alta al mismo operador dos veces.
create unique index if not exists idx_operadores_empresa_numero
  on public.operadores (empresa_id, numero) where numero <> '';
create unique index if not exists idx_operadores_empresa_rfc
  on public.operadores (empresa_id, upper(rfc)) where rfc <> '';
create unique index if not exists idx_operadores_empresa_licencia
  on public.operadores (empresa_id, upper(licencia)) where licencia <> '';

-- Clientes: numero de cliente unico por empresa; RFC unico por empresa
-- cuando tiene valor (evita dar de alta el mismo cliente dos veces).
create unique index if not exists idx_clientes_empresa_numero
  on public.clientes (empresa_id, numero_cliente) where numero_cliente <> '';
create unique index if not exists idx_clientes_empresa_rfc
  on public.clientes (empresa_id, upper(rfc)) where rfc <> '';

-- Destinatarios: solo el numero es unico -- el mismo RFC se repite a
-- proposito cuando un cliente tiene varias ubicaciones/domicilios.
create unique index if not exists idx_destinatarios_empresa_numero
  on public.destinatarios (empresa_id, numero) where numero <> '';
