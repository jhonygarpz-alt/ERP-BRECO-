export type Estatus = 'activo' | 'inactivo';

export interface Cliente {
  id: string;
  nombre: string;
  rfc: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  estatus: Estatus;
}

export type TipoUnidad = 'Tractocamion' | 'Rabon' | 'Torton' | 'Camioneta';
export type EstatusUnidad = 'Disponible' | 'En viaje' | 'Taller' | 'Fuera de servicio';

export interface Unidad {
  id: string;
  economico: string;
  placas: string;
  tipo: TipoUnidad;
  marca: string;
  modelo: string;
  anio: number;
  estatus: EstatusUnidad;
  operadorAsignadoId?: string;
  clienteAsignadoId?: string;
}

export type TipoCaja = 'Seca' | 'Refrigerada' | 'Plataforma' | 'Contenedor';
export type EstatusCaja = 'Disponible' | 'En uso' | 'Mantenimiento';

export interface Caja {
  id: string;
  economico: string;
  placas: string;
  tipo: TipoCaja;
  capacidad: string;
  estatus: EstatusCaja;
  marca?: string;
  modelo?: string;
  anio?: number;
}

export type EstatusOperador = 'Disponible' | 'En viaje' | 'Descanso' | 'Baja';

export interface Operador {
  id: string;
  nombre: string;
  licencia: string;
  tipoLicencia: string;
  telefono: string;
  vigenciaLicencia: string;
  estatus: EstatusOperador;
}

// Los 4 valores originales siguen siendo el default, pero el catalogo
// "estatus_viaje" permite agregar mas desde la app -- por eso es string
// libre y no una union cerrada.
export type EstatusViaje = string;

export interface EstatusViajeCustom {
  id: string;
  nombre: string;
  color: string;
}

export type SemaforoEntrega = 'verde' | 'amarillo' | 'rojo';

export interface EntregaTurnoUnidad {
  id: string;
  fecha: string;
  unidadTexto: string;
  operadorTexto: string;
  servicioAnterior: string;
  semaforo: SemaforoEntrega;
  estatusActual: string;
  notaAdicional: string;
  cita: string;
  instruccion: string;
  proximoServicio: string;
  resumenEstatus: string;
  resumenSiguiente: string;
  orden: number;
}

export type TipoNotaEntregaTurno = 'cita' | 'prioridad';

export interface EntregaTurnoNota {
  id: string;
  fecha: string;
  tipo: TipoNotaEntregaTurno;
  texto: string;
  orden: number;
}

export interface Viaje {
  id: string;
  folio: string;
  fecha: string;
  clienteId: string;
  unidadId: string;
  operadorId: string;
  materiales: string;
  cajaNombre: string;
  cajaEconomico: string;
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegadaEstimada: string;
  cita: string;
  importacion: boolean;
  exportacion: boolean;
  estatus: EstatusViaje;
  observaciones: string;
}

export type EstatusFactura = 'Pendiente' | 'Facturado' | 'Pagado' | 'Cancelado';

export interface Factura {
  id: string;
  folio: string;
  fecha: string;
  viajeId: string;
  clienteId: string;
  importe: number;
  moneda: 'MXN' | 'USD';
  estatus: EstatusFactura;
  observaciones: string;
}

// Refleja la hoja "BASE_DATOS" del Excel real "Facturacion Diaria por
// Sistema" (OneDrive), importada manualmente desde Reportes Operativos.
export interface FacturaSistema {
  id: string;
  cliente: string;
  economicoTracto: string;
  economicoRemolque: string;
  origenPedido: string;
  locacionOrigen: string;
  transportista: string;
  fechaOrigen: string;
  destinoPedido: string;
  locacionDestino: string;
  fechaDestino: string;
  ordenTrabajo: string;
  tipoPedido: string;
  fechaFactura: string;
  totalFactura: number;
  saldoPendiente: number;
  estadoPedido: string;
  moneda: string;
  tipoCambio: number;
  tarifa: number;
  adicional: number;
  totalTarifa: number;
  utilidad: number;
}

export interface Empresa {
  nombre: string;
  razonSocial: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  logoDataUrl: string;
}

export type Modulo = 'Catalogos' | 'Viajes' | 'Facturacion' | 'Programa' | 'EntregaTurno' | 'Reportes' | 'Configuracion';

export interface ReporteExterno {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  actualizado: string;
}

export interface PermisoModulo {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: Record<Modulo, PermisoModulo>;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rolId: string;
  estatus: Estatus;
}
