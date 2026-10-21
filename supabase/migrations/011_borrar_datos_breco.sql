-- OPCIONAL Y DESTRUCTIVO: borra los datos operativos actuales de BRECO
-- (clientes, unidades, cajas, operadores, viajes, facturas, y todo lo
-- capturado en Entrega de Turno / bitacora de ubicaciones / reportes
-- importados) para arrancar limpio con el modelo multi-empresa y cargar
-- los catalogos reales por plantilla.
--
-- NO borra: la empresa BRECO en si, sus usuarios ni sus roles -- los logins
-- que ya existen siguen funcionando igual despues de correr esto.
--
-- Correlo SOLO cuando estes listo; no hace falta correrlo junto con la
-- migracion 010.

truncate table
  public.viajes,
  public.viaje_ubicacion,
  public.facturas,
  public.facturas_sistema,
  public.gastos_mantenimiento,
  public.tanque_movimientos,
  public.entrega_turno_unidad,
  public.entrega_turno_nota,
  public.clientes,
  public.unidades,
  public.cajas,
  public.operadores
restart identity;
