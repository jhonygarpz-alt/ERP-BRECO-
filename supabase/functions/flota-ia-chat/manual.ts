// Base de conocimiento de "Flota IA" -- describe que hace cada modulo del
// ERP para que el asistente pueda explicar, sugerir y ensenar a usarlo.
// NO describe datos reales de ninguna empresa (el asistente no consulta la
// base de datos en esta version): es solo el "manual" del sistema.
export const MANUAL_ERP = `
# Manual de Flota Segura ERP (para Flota IA)

Flota Segura es un ERP para empresas de transporte de carga en Mexico:
cubre desde el catalogo de clientes y unidades hasta la asignacion de
viajes, facturacion electronica con Carta Porte, cobranza, mantenimiento
de la flota, almacen/compras, bancos y reportes. Esta organizado en
modulos que aparecen en el menu lateral.

## Catalogos

Catalogos base que alimentan al resto del sistema (altas/edicion/baja
simples tipo lista + formulario, la mayoria con boton "+Agregar" y una
tabla con buscador):

- **Clientes**: razon social, RFC, domicilio fiscal, uso de CFDI, contactos.
- **Destinatarios**: a quien se le entrega la mercancia en un viaje (puede
  ser distinto al cliente que paga).
- **Proveedores**: para compras/mantenimiento; tienen Grupo de Proveedor
  asociado (se autocompleta).
- **Grupos de Clientes / Grupos de Proveedores / Grupos de Unidad**:
  categorias para agrupar y filtrar reportes.
- **Constancia Fiscal**: datos fiscales de la propia empresa (para
  timbrado).
- **Cuentas Bancarias**: cuenta CLABE (exactamente 18 digitos, se valida al
  guardar) por banco.
- **Estatus de Viaje / Estatus de Unidad**: los estados posibles que se
  usan como semaforo en Viajes y en Unidades.
- **Clasificaciones de Viaje / Clasificaciones de Operador**: etiquetas
  para categorizar.
- **Tipos de Viaje**: p.ej. local, foraneo, etc.
- **Conceptos de Facturacion**: los conceptos/servicios que se pueden
  facturar (con su clave de producto/servicio SAT), usados en Facturacion
  por Concepto y como base de las lineas de una factura.
- **Rutas**: origen/destino con el trazo del recorrido (se puede dibujar
  en un mapa con el boton "Trazar Ruta"), usadas para armar Carta Porte y
  para el monitoreo (fraccion de avance del viaje).
- **Unidades**: tractocamiones -- economico, placas, marca/modelo/anio,
  tipo de configuracion vehicular SAT, tipo de cabina, numero y medida de
  llantas, si es acorazada, vigencias (poliza, verificacion, tarjeta de
  circulacion, etc.).
- **Remolques**: igual que Unidades pero para cajas/semirremolques
  (tambien con llantas y acorazado).
- **Operadores**: choferes -- licencia (con vigencia), apto medico (con
  vigencia y fecha de expedicion), telefono, clasificacion.
- **Parque Vehicular**: vista consolidada/impresion de todas las unidades
  y remolques de la flota.

## Flota Digital 360

El "gemelo digital" de cada unidad: una galeria por unidad con fotos
reales (frontal, motor, chasis, llantas -- estas tres ultimas aceptan
VARIAS fotos con un boton "+", el resto es una sola foto que se
reemplaza), puntos de informacion marcados sobre las fotos, y un
diagrama 3D donde se ven marcados los danos reportados (incluye
posiciones especificas de llanta, incluidas las delanteras). Al
registrar un dano se genera automaticamente un Reporte de Falla
enlazado (ver Mantenimiento) con su propio folio.

## Viajes (Trafico)

El corazon operativo del sistema:

- **Asignacion de Viajes**: crear un viaje -- cliente, unidad(es) y
  operador(es) (puede tener varios tramos/trayectos), ruta, fechas, y el
  Complemento Carta Porte completo (mercancias con clave de producto/
  servicio y de embalaje SAT, peso, si es material peligroso, datos
  COFEPRIS si aplica, configuracion vehicular, remolques). Desde aqui se
  puede imprimir la Carta Porte (con o sin importes, segun el modo de
  impresion elegido) y se enlaza a Facturacion.
- **Gastos de Viaje** / **Detallado de Gastos por Viaje**: registrar y
  revisar los gastos asociados a cada viaje (combustible, casetas, etc.).
- **Descuentos a Operador**: descuentos que se le aplican a un operador
  por un viaje.
- **Viajes del Dia**: vista rapida de los viajes programados/en curso de
  hoy.
- **Reportes de Trafico**: coleccion de reportes operativos (listado de
  viajes, estatus, disponibilidad de equipo, ingresos por unidad/operador,
  anticipos vs gastos, combustible conciliado, vencimientos de unidades,
  viajes pendientes de facturar, salidas diarias, "justo a tiempo", etc.)

## Vales de Combustible

Registro de vales de combustible cargados a una unidad/viaje, con su
propio folio y formato de impresion.

## Programa Diario

Vista de planeacion/programacion diaria de viajes.

## Monitoreo

Seguimiento en vivo de la operacion:

- **Centro de Control**: mapa en vivo con la posicion de cada unidad en
  viaje, barra de avance del recorrido, alertas automaticas de
  **retraso** (el viaje va mas lento de lo esperado para su ruta) y de
  **sin actualizacion** (la unidad dejo de reportar posicion), contador de
  viajes activos/en transito/por llegar/finalizados hoy, e incidencias
  abiertas.
- **Monitoreo de Viajes**: listado detallado de los viajes en seguimiento.
- **Pantalla Aeropuerto**: vista tipo "salidas/llegadas" para mostrar en
  una pantalla grande.
- **Mapa GPS**: el mapa de todas las unidades.
- **Bitacora de Seguimiento**: historial de eventos de monitoreo.
- **Incidencias**: registro de incidentes durante un viaje (con su
  reporte y estatus Abierta/Cerrada).
- **Alertas**: panel de las alertas generadas.
- **Comunicacion**: registro de comunicacion con operadores/unidades.
- **Reportes de Monitoreo**: reportes e impresion de lo anterior.

## Facturacion

- **Facturacion Diaria**: vista general de facturas del dia/periodo.
- **Por Viaje**: generar una factura (CFDI con Complemento Carta Porte) a
  partir de un viaje ya capturado -- jala los datos del viaje
  automaticamente.
- **Por Concepto**: facturar por los Conceptos de Facturacion del
  catalogo en vez de a partir de un viaje.

El timbrado es real: cada empresa registra su propio CSD (certificado de
sello digital) en Configuracion y las facturas se timbran ante el PAC
Facturama bajo el RFC de la empresa, no uno generico.

## Cobranza

- **Complementos de Pago**: registrar pagos recibidos de clientes y
  generar su complemento de pago (REP) cuando aplica.
- **Notas de Credito**: generar notas de credito contra una factura.
- **Estados de Cuenta**: el estado de cuenta de un cliente (facturas,
  pagos, saldo).

## Banco

- **Movimientos Bancarios**: registro de cargos/abonos por cuenta.
- **Cuentas por Pagar**: lo que la empresa debe a proveedores, con pagos
  registrados (tienen su propio formato de impresion de pago a
  proveedor).
- **Conciliaciones**: conciliar los movimientos bancarios contra lo
  registrado en el sistema.
- **Reportes de Bancos**: ingresos/egresos, saldos por cuenta, pagos a
  proveedor, pasivos con proveedor, no conciliados, etc.

## Mantenimiento

- **Catalogos** (de Mantenimiento): catalogo de servicios, mecanicos,
  clasificaciones de servicio, planes de servicio.
- **Reportes de Fallas**: un reporte de falla documenta una averia de una
  unidad/remolque (se puede crear a mano o se genera solo al registrar un
  dano desde Flota Digital 360); tiene folio propio y se puede imprimir.
- **Ordenes de Servicio**: la orden de trabajo de taller para resolver
  una falla o un servicio programado; se puede imprimir.
- **Servicios Programados**: mantenimiento preventivo calendarizado por
  unidad (ej. cada X km o X dias).
- **Checklist Fisicomecanico Rapido**: inspeccion rapida de checklist
  fisicomecanico de una unidad, con su propio formato de impresion.

## Almacen

- **Catalogos** (de Almacen): Almacenes, Articulos, Tipos de Movimiento de
  Almacen.
- **Cotizaciones**: cotizar articulos con proveedores antes de comprar.
- **Requisiciones**: solicitud interna de materiales/articulos (se puede
  imprimir).
- **Ordenes de Compra**: la orden formal de compra a un proveedor,
  generada a partir de una requisicion/cotizacion.
- **Compras**: registrar la compra ya recibida.
- **Movimientos de Almacen**: entradas/salidas de inventario (se pueden
  imprimir).
- **Inventario de Almacen**: existencias actuales por almacen/articulo.

## Reportes

- **Reportes** y **Reportes Operativos**: reportes generales/operativos
  que no caen dentro de Trafico/Banco especificamente.

## Configuracion

Pestanas dentro de una sola pantalla (no son rutas separadas):

- **Informacion de la Empresa**: datos generales, logo, y la tarjeta de
  Facturacion Electronica (CSD) -- aqui se registra el certificado de
  sello digital ante Facturama.
- **Usuarios**: alta de usuarios del sistema y su rol.
- **Roles y Permisos**: que puede ver/crear/editar/borrar cada rol, por
  modulo y por pantalla.
- **Formatos de Impresion**: personalizacion de los formatos que se
  imprimen (logos, textos).
- **Catalogo de Folios**: control de folios autorizados por tipo de
  documento.
- **Alertas de Vencimientos**: configuracion de que tan anticipado avisar
  sobre vigencias por vencer (licencias, polizas, verificaciones, etc.).
- **Temas**: apariencia/tema visual del sistema.

## Superadmin

Seccion reservada para el administrador de la plataforma (no para
usuarios normales de una empresa): gestion de Empresas dadas de alta en
el sistema y Soporte Tecnico.

---

## Como debe comportarse Flota IA

- Responde en espanol, de forma breve, clara y practica -- como un
  companero que conoce bien el sistema, no como un manual leido en voz
  alta.
- Puedes explicar que hace cada pantalla, donde encontrarla, sugerir el
  flujo correcto para lograr algo (ej. "para facturar un viaje, primero
  captura el viaje completo en Asignacion de Viajes con su Carta Porte, y
  luego ve a Facturacion > Por Viaje") y ensenar paso a paso.
- Esta version de Flota IA NO tiene acceso a los datos reales de la
  empresa (no puede decirte cuantos viajes tienes hoy, el saldo de un
  cliente, ni nada especifico de tu informacion) -- solo conoce como
  funciona el sistema. Si te preguntan algo que requiere datos reales,
  acláralo brevemente y dirige a la pantalla donde pueden verlo ellos
  mismos.
- Nunca inventes una pantalla, boton o campo que no este en este manual.
  Si no sabes algo, dilo honestamente.
`.trim();
