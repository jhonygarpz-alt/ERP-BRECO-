-- ============================================================================
-- "Llantas de refaccion" (catalogos de Unidades y Remolques) deja de ser un
-- numero y pasa a ser una de estas 3 opciones fijas:
--   - Sin llanta de refaccion
--   - Solo neumatico
--   - Rin con llanta
-- Como el campo era numerico y recien se agrego (todavia sin captura real
-- esperada), se convierte la columna a texto reiniciando el valor a vacio
-- en vez de intentar traducir el numero anterior a una de estas opciones.
-- ============================================================================

alter table public.unidades
  alter column llantas_refaccion drop default,
  alter column llantas_refaccion type text using '',
  alter column llantas_refaccion set default '';

alter table public.cajas
  alter column llantas_refaccion drop default,
  alter column llantas_refaccion type text using '',
  alter column llantas_refaccion set default '';
