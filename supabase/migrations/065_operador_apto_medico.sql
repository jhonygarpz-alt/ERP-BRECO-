-- ============================================================================
-- Catalogo de Operadores: renombra "Pasaporte" a "Apto Medico" (certificado de
-- aptitud medica del operador), ya que es el documento que realmente se usa
-- para el transporte domestico.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'operadores' and column_name = 'pasaporte'
  ) then
    alter table public.operadores rename column pasaporte to apto_medico;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'operadores' and column_name = 'vigencia_pasaporte'
  ) then
    alter table public.operadores rename column vigencia_pasaporte to vigencia_apto_medico;
  end if;
end $$;
