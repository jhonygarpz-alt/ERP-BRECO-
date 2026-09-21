export type Estatus = 'activo' | 'inactivo';

export interface ClienteContacto {
  nombre: string;
  puesto: string;
  telefono: string;
  celular: string;
  correo: string;
  principal: boolean;
}

export type TipoCliente = 'Nacional' | 'Extranjero';
export type MonedaCliente = 'MXN' | 'USD';
export type IvaCliente = 'IVA 16%' | 'IVA 0%' | 'Exento';

export interface Cliente {
  id: string;
  /** Numero de cliente consecutivo (ej. "000047"); lo autoasigna la base de datos si se deja vacio. */
  numeroCliente: string;
  /** Nombre Fiscal */
  nombre: string;
  nombreCorto: string;
  fechaAlta: string;
  rfc: string;
  tipo: TipoCliente;
  moneda: MonedaCliente;
  iva: IvaCliente;
  grupo: string;
  sucursal: string;
  estatus: Estatus;
  operadorLogistico: boolean;
  aplicarDetalleViajeXml: boolean;
  // Domicilio
  pais: string;
  cp: string;
  estado: string;
  municipio: string;
  colonia: string;
  localidad: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  telefonos: string;
  celular: string;
  correo: string;
  // Contactos
  contactos: ClienteContacto[];
  // Pagos / creditos
  formaPago: string;
  diasCredito: number;
  limiteCreditoMxn: number;
  limiteCreditoUsd: number;
  limitarViajes: boolean;
  limiteFacturasVencidas: number | null;
  // Informacion adicional del pago
  bancoOrdenante: string;
  bancoOrdenanteExtranjero: boolean;
  bancoRfc: string;
  bancoNoCuenta: string;
}

/** Ubicacion fisica de un cliente (o independiente) que sirve de origen/destino en un viaje. */
export interface Destinatario {
  id: string;
  numero: string;
  rfc: string;
  noEquivalencia: string;
  nombre: string;
  estatus: Estatus;
  esPatio: boolean;
  clienteId?: string;
  // Domicilio Fiscal
  pais: string;
  estado: string;
  municipio: string;
  cp: string;
  localidad: string;
  colonia: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  telefono: string;
  contacto: string;
  correo: string;
}

export type EstatusUnidad = 'Disponible' | 'En viaje' | 'Taller' | 'Fuera de servicio';

/** Un renglon de la tabla "Documentos de la unidad" (solo metadatos, sin archivo adjunto). */
export interface UnidadDocumentoVencimiento {
  numeroDocumento: string;
  documento: string;
  fechaVencimiento: string;
}

/** Un archivo cargado en "Archivos adicionales" (guardado en Supabase Storage). */
export interface UnidadArchivo {
  id: string;
  descripcion: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

export interface Unidad {
  id: string;
  economico: string;
  placas: string;
  /** Clave del catalogo SAT c_ConfigAutotransporte (Carta Porte). */
  tipo: string;
  marca: string;
  modelo: string;
  anio: number;
  estatus: EstatusUnidad;
  operadorAsignadoId?: string;
  clienteAsignadoId?: string;
  // Informacion general
  activa: boolean;
  rentada: boolean;
  esPermisionario: boolean;
  descripcion: string;
  sucursal: string;
  identidadSatelital: string;
  identificadorConvoy: string;
  numeroSerie: string;
  color: string;
  grupoUnidades: string;
  fotoDataUrl: string;
  // Especificaciones de la unidad
  largoMetros: number;
  anchoMetros: number;
  altoMetros: number;
  capacidadKg: number;
  numeroEjes: number;
  pesoTaraTon: number;
  tipoTransmision: string;
  tipoMotor: string;
  // Consumo de combustible
  tipoCombustible: string;
  tarjetaCombustible1: string;
  tarjetaCombustible2: string;
  tarjetaCombustible3: string;
  capacidadTanqueLts: number;
  rendimientoCargadoKmLt: number;
  rendimientoVacioKmLt: number;
  // Documentos de la unidad / Archivos adicionales
  documentosVencimiento: UnidadDocumentoVencimiento[];
  archivosAdicionales: UnidadArchivo[];
  // Seguros
  aseguradora: string;
  noPoliza: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export type EstatusCaja = 'Disponible' | 'En uso' | 'Mantenimiento';

/** Un renglon de la tabla "Documentos del remolque" (solo metadatos, sin archivo adjunto). */
export interface CajaDocumentoVencimiento {
  numeroDocumento: string;
  documento: string;
  fechaVencimiento: string;
}

/** Un archivo cargado en "Archivos adicionales" del remolque (guardado en Supabase Storage). */
export interface CajaArchivo {
  id: string;
  descripcion: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

/** Catalogo "Remolques" (antes "Cajas"): remolques y semirremolques de la flota. */
export interface Caja {
  id: string;
  economico: string;
  placas: string;
  /** Clave del catalogo SAT c_SubTipoRem (Carta Porte). */
  tipo: string;
  capacidad: string;
  estatus: EstatusCaja;
  marca?: string;
  modelo?: string;
  anio?: number;
  // Informacion general
  activa: boolean;
  rentada: boolean;
  esPermisionario: boolean;
  descripcion: string;
  sucursal: string;
  identidadSatelital: string;
  identificadorConvoy: string;
  numeroSerie: string;
  color: string;
  grupoUnidades: string;
  fotoDataUrl: string;
  // Especificaciones del remolque
  largoMetros: number;
  anchoMetros: number;
  altoMetros: number;
  capacidadKg: number;
  numeroEjes: number;
  pesoTaraTon: number;
  // Documentos / Archivos adicionales
  documentosVencimiento: CajaDocumentoVencimiento[];
  archivosAdicionales: CajaArchivo[];
  // Seguros
  aseguradora: string;
  noPoliza: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export type EstatusOperador = 'Disponible' | 'En viaje' | 'Descanso' | 'Baja';

/** Un archivo cargado al expediente del operador (guardado en Supabase Storage). */
export interface OperadorDocumento {
  id: string;
  descripcion: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

/** Un renglon de la lista "Vencimientos de Documentos" del expediente. */
export interface OperadorVencimiento {
  documento: string;
  nombre: string;
  fecha: string;
  activo: boolean;
}

export interface Operador {
  id: string;
  numero: string;
  /** Nombre completo (calculado a partir de nombres/apellidos); es lo que usa el resto del sistema para mostrar al operador. */
  nombre: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  activo: boolean;
  esPermisionario: boolean;
  esExtranjero: boolean;
  rfc: string;
  curp: string;
  fechaContratacion: string;
  sucursal: string;
  telefono: string;
  celular: string;
  hashGmtgps: string;
  registroPatronal: string;
  fotoDataUrl: string;
  observaciones: string;
  // Direccion del operador
  pais: string;
  estado: string;
  municipio: string;
  localidad: string;
  cp: string;
  colonia: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  domicilioReferencia: string;
  // Documentos de identidad
  licencia: string;
  vigenciaLicencia: string;
  pasaporte: string;
  vigenciaPasaporte: string;
  licenciaB: boolean;
  licenciaC: boolean;
  licenciaE: boolean;
  // Informacion medica
  noImss: string;
  grupoSanguineo: string;
  alergias: string;
  diabetico: boolean;
  hipertenso: boolean;
  // Expediente
  documentos: OperadorDocumento[];
  vencimientos: OperadorVencimiento[];
  // Informacion bancaria
  banco: string;
  cuentaClabe: string;
  noTarjeta: string;
  // Estatus operativo (Disponible/En viaje/Descanso/Baja), usado en Trafico
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
  ubicacionActual: string;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
}

/** Un punto de la bitacora de avance de un viaje (ej. "Monterrey", "San Luis Potosi"). */
export interface ViajeUbicacion {
  id: string;
  viajeId: string;
  texto: string;
  creadoEn?: string;
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
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
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
  id: string;
  nombre: string;
  razonSocial: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  logoDataUrl: string;
  estatus: 'activa' | 'inactiva';
  /** Ruta en Supabase Storage (bucket "empresa-documentos") del ultimo PDF de Constancia de Situacion Fiscal importado. */
  csfStoragePath: string;
  csfImportadaEn?: string;
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
  /** Solo se manda explicito cuando el super admin siembra los roles de una empresa nueva. */
  empresaId?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rolId: string;
  estatus: Estatus;
  empresaId?: string;
  esSuperAdmin?: boolean;
}

export type TipoProveedor = 'Nacional' | 'Extranjero';

/** Un archivo cargado en la pestana "Documentos" del proveedor (guardado en Supabase Storage). */
export interface ProveedorDocumento {
  id: string;
  descripcion: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

export interface Proveedor {
  id: string;
  numero: string;
  fecha: string;
  estatus: Estatus;
  tipo: TipoProveedor;
  rfc: string;
  nombre: string;
  nombreCorto: string;
  esProveedorCombustible: boolean;
  proveedorBienes: boolean;
  proveedorServicios: boolean;
  grupo: string;
  tipoOperacion: string;
  tipoTercero: string;
  shortNameSap: string;
  // Domicilio Fiscal
  pais: string;
  estado: string;
  cp: string;
  municipio: string;
  colonia: string;
  localidad: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  correo: string;
  telefonos: string;
  celular: string;
  nextel: string;
  // Creditos
  formaPago: string;
  diasCredito: number;
  limiteCreditoMxn: number;
  limiteCreditoUsd: number;
  // Cuenta Bancaria
  banco: string;
  cuentaClabe: string;
  noCuenta: string;
  // Documentos
  documentos: ProveedorDocumento[];
}

export interface CuentaBancaria {
  id: string;
  numero: string;
  activa: boolean;
  descripcion: string;
  contabilizar: boolean;
  banco: string;
  moneda: 'MXN' | 'USD';
}
