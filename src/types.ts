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

export type EstatusViaje =
  | 'Programado'
  | 'En transito'
  | 'Entregado'
  | 'Cancelado';

export interface Viaje {
  id: string;
  folio: string;
  fecha: string;
  clienteId: string;
  unidadId: string;
  cajaId: string;
  operadorId: string;
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegadaEstimada: string;
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
