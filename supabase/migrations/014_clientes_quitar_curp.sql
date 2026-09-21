-- Se quita el campo CURP del catalogo de Clientes (no se usa).
alter table public.clientes drop column if exists curp;
