import type { Modulo } from '../types';

// Catalogo de "pantallas" del sistema, agrupadas por Modulo, para los
// permisos finos de Rol.permisosPantalla (ver src/types.ts). El id de cada
// pantalla es su ruta real (o "configuracion:tab" para las pestanas de
// Configuracion, que viven en una sola pagina sin ruta propia) -- se usa tal
// cual como llave del permiso y para filtrar Sidebar/rutas.
export interface PantallaInfo {
  id: string;
  modulo: Modulo;
  label: string;
}

export const PANTALLAS: PantallaInfo[] = [
  // ---- Catalogos ----
  { id: '/catalogos/clientes', modulo: 'Catalogos', label: 'Clientes' },
  { id: '/catalogos/destinatarios', modulo: 'Catalogos', label: 'Destinatarios' },
  { id: '/catalogos/proveedores', modulo: 'Catalogos', label: 'Proveedores' },
  { id: '/catalogos/constancia-fiscal', modulo: 'Catalogos', label: 'Constancia Fiscal' },
  { id: '/catalogos/cuentas-bancarias', modulo: 'Catalogos', label: 'Cuentas Bancarias' },
  { id: '/catalogos/estatus-viaje', modulo: 'Catalogos', label: 'Estatus de Viaje' },
  { id: '/catalogos/estatus-unidad', modulo: 'Catalogos', label: 'Estatus de Unidad' },
  { id: '/catalogos/clasificaciones-viaje', modulo: 'Catalogos', label: 'Clasificaciones de Viaje' },
  { id: '/catalogos/grupos-unidad', modulo: 'Catalogos', label: 'Grupos de Unidad' },
  { id: '/catalogos/tipos-viaje', modulo: 'Catalogos', label: 'Tipos de Viaje' },
  { id: '/catalogos/clasificaciones-operador', modulo: 'Catalogos', label: 'Clasificaciones de Operador' },
  { id: '/catalogos/conceptos-facturacion', modulo: 'Catalogos', label: 'Conceptos de Facturacion' },
  { id: '/catalogos/rutas', modulo: 'Catalogos', label: 'Rutas' },
  { id: '/catalogos/unidades', modulo: 'Catalogos', label: 'Unidades' },
  { id: '/catalogos/remolques', modulo: 'Catalogos', label: 'Remolques' },
  { id: '/catalogos/operadores', modulo: 'Catalogos', label: 'Operadores' },
  { id: '/parque-vehicular', modulo: 'Catalogos', label: 'Parque Vehicular' },

  // ---- Flota Digital 360 ----
  { id: '/flota-360', modulo: 'Flota', label: 'Flota Digital 360' },

  // ---- Viajes (Trafico) ----
  { id: '/viajes', modulo: 'Viajes', label: 'Asignacion de Viajes' },
  { id: '/gastos-viaje', modulo: 'Viajes', label: 'Gastos de Viaje' },
  { id: '/descuentos-operador', modulo: 'Viajes', label: 'Descuentos a Operador' },
  { id: '/gastos-viaje/detallado', modulo: 'Viajes', label: 'Detallado de Gastos por Viaje' },
  { id: '/viajes-del-dia', modulo: 'Viajes', label: 'Viajes del Dia' },
  { id: '/aeropuerto', modulo: 'Viajes', label: 'Pantalla Aeropuerto' },
  { id: '/trafico/reportes', modulo: 'Viajes', label: 'Reportes de Trafico' },

  // ---- Programa ----
  { id: '/programa', modulo: 'Programa', label: 'Programa Diario' },

  // ---- Monitoreo ----
  { id: '/monitoreo', modulo: 'Monitoreo', label: 'Centro de Control' },
  { id: '/monitoreo/viajes', modulo: 'Monitoreo', label: 'Monitoreo de Viajes' },
  { id: '/monitoreo/mapa', modulo: 'Monitoreo', label: 'Mapa GPS' },
  { id: '/monitoreo/bitacora', modulo: 'Monitoreo', label: 'Bitacora de Seguimiento' },
  { id: '/monitoreo/incidencias', modulo: 'Monitoreo', label: 'Incidencias' },
  { id: '/monitoreo/alertas', modulo: 'Monitoreo', label: 'Alertas' },
  { id: '/monitoreo/comunicacion', modulo: 'Monitoreo', label: 'Comunicacion' },
  { id: '/monitoreo/reportes', modulo: 'Monitoreo', label: 'Reportes de Monitoreo' },

  // ---- Facturacion ----
  { id: '/facturacion', modulo: 'Facturacion', label: 'Facturacion Diaria' },
  { id: '/facturacion/por-viaje', modulo: 'Facturacion', label: 'Por Viaje' },
  { id: '/facturacion/por-concepto', modulo: 'Facturacion', label: 'Por Concepto' },

  // ---- Cobranza ----
  { id: '/cobranza/complementos-pago', modulo: 'Cobranza', label: 'Complementos de Pago' },
  { id: '/cobranza/notas-credito', modulo: 'Cobranza', label: 'Notas de Credito' },
  { id: '/cobranza/estados-cuenta', modulo: 'Cobranza', label: 'Estados de Cuenta' },

  // ---- Banco ----
  { id: '/banco/movimientos', modulo: 'Banco', label: 'Movimientos Bancarios' },
  { id: '/banco/cuentas-por-pagar', modulo: 'Banco', label: 'Cuentas por Pagar' },
  { id: '/banco/conciliaciones', modulo: 'Banco', label: 'Conciliaciones' },
  { id: '/banco/reportes', modulo: 'Banco', label: 'Reportes de Bancos' },

  // ---- Mantenimiento ----
  { id: '/mantenimiento/catalogos', modulo: 'Mantenimiento', label: 'Catalogos' },
  { id: '/mantenimiento/reportes-falla', modulo: 'Mantenimiento', label: 'Reportes de Fallas' },
  { id: '/mantenimiento/ordenes-servicio', modulo: 'Mantenimiento', label: 'Ordenes de Servicios' },
  { id: '/mantenimiento/servicios-programados', modulo: 'Mantenimiento', label: 'Servicios Programados' },
  { id: '/mantenimiento/checklist', modulo: 'Mantenimiento', label: 'Checklist Fisicomecanico Rapido' },

  // ---- Almacen ----
  { id: '/almacen/catalogos', modulo: 'Almacen', label: 'Catalogos' },
  { id: '/almacen/cotizaciones', modulo: 'Almacen', label: 'Cotizaciones' },
  { id: '/almacen/requisiciones', modulo: 'Almacen', label: 'Requisiciones' },
  { id: '/almacen/ordenes-compra', modulo: 'Almacen', label: 'Ordenes de Compra' },
  { id: '/almacen/compras', modulo: 'Almacen', label: 'Compras' },
  { id: '/almacen/movimientos', modulo: 'Almacen', label: 'Movimientos de Almacen' },
  { id: '/almacen/inventario', modulo: 'Almacen', label: 'Inventario de Almacen' },

  // ---- Reportes ----
  { id: '/reportes', modulo: 'Reportes', label: 'Reportes' },
  { id: '/reportes-operativos', modulo: 'Reportes', label: 'Reportes Operativos' },

  // ---- Configuracion (pestanas dentro de una sola pagina, no rutas propias) ----
  { id: 'configuracion:empresa', modulo: 'Configuracion', label: 'Informacion de la Empresa' },
  { id: 'configuracion:usuarios', modulo: 'Configuracion', label: 'Usuarios' },
  { id: 'configuracion:roles', modulo: 'Configuracion', label: 'Roles y Permisos' },
  { id: 'configuracion:formatos', modulo: 'Configuracion', label: 'Formatos de Impresion' },
  { id: 'configuracion:folios', modulo: 'Configuracion', label: 'Catalogo de Folios' },
  { id: 'configuracion:alertas', modulo: 'Configuracion', label: 'Alertas de Vencimientos' },
  { id: 'configuracion:temas', modulo: 'Configuracion', label: 'Temas' },
];

export function pantallasDeModulo(modulo: Modulo): PantallaInfo[] {
  return PANTALLAS.filter((p) => p.modulo === modulo);
}
