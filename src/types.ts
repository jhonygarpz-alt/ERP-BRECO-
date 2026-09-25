export type Estatus = 'activo' | 'inactivo';

/**
 * Datos de timbrado ante el SAT de un CFDI (Factura, Carta Porte, Nota de
 * Credito o Complemento de Pago). El ERP hoy no se conecta a ningun PAC para
 * timbrar, asi que estos campos quedan vacios hasta que se conecte uno; los
 * formatos de impresion ya reservan su lugar (folio fiscal, sellos, QR) para
 * cuando ese timbrado real empiece a llenarlos.
 */
export interface DatosTimbradoCfdi {
  /** true mientras el timbrado lo genera el propio ERP en vez de un PAC real conectado al SAT. */
  simulado: boolean;
  folioFiscal: string;
  noSerieCertificadoEmisor: string;
  noSerieCertificadoSat: string;
  fechaHoraExpedicion: string;
  fechaHoraCertificacion: string;
  selloDigitalCfdi: string;
  selloDigitalSat: string;
  cadenaOriginal: string;
  /** Identificador del Complemento Carta Porte (IdCCP), solo aplica a viajes de tipo CartaPorte. */
  idCcp: string;
  cancelado: boolean;
  /** Clave del motivo de cancelacion SAT: 01, 02, 03 o 04. */
  motivoCancelacion: string;
  /** Folio fiscal (UUID) del CFDI que sustituye a este, solo obligatorio para el motivo 01. */
  folioSustitutoCancelacion: string;
  fechaCancelacion: string;
}

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

// El catalogo "estatus_unidad" permite agregar mas desde la app -- por eso
// es string libre y no una union cerrada (igual que EstatusViaje).
export type EstatusUnidad = string;

export type TipoEstatusUnidad = 'Disponible' | 'Ocupada';

export interface EstatusUnidadCustom {
  id: string;
  nombre: string;
  color: string;
  tipoEstatus: TipoEstatusUnidad;
}

/** Categoria de un documento de unidad, usada por Configuracion > Alertas de Vencimientos para saber a cual checkbox pertenece. */
export type TipoDocumentoUnidad = 'Placas' | 'Permisos' | 'Seguro Placa Mexicana' | 'Seguro Placa Americana' | 'Otro';

/** Un renglon de la tabla "Documentos de la unidad" (solo metadatos, sin archivo adjunto). */
export interface UnidadDocumentoVencimiento {
  numeroDocumento: string;
  documento: string;
  fechaVencimiento: string;
  /** Ausente en documentos capturados antes de que existiera esta categorizacion: se trata como 'Otro'. */
  tipo?: TipoDocumentoUnidad;
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
  // ---- Parque Vehicular ----
  /** Nombre del dueno de la unidad (relevante sobre todo si es rentada/permisionario). */
  propietario: string;
  /** Ubicacion actual en texto libre (ej. "Patios Empresa", una direccion); la actualiza el boton "Ubicacion Unidad" de Parque Vehicular. */
  ubicacion: string;
  estadoCarga: EstadoCarga;
  /** Kilometraje/odometro actual, capturado a mano; lo usa Mantenimiento > Servicios Programados para calcular vencimientos por km. */
  kilometrajeActual: number;
  // ---- Permiso SCT (Carta Porte / Autotransporte) ----
  numeroPermisoSct: string;
  vigenciaPermisoSct: string;
  verificacionSct: string;
  /** Clave del catalogo SAT c_TipoPermiso. */
  claveTipoPermisoSct: string;
}

export type EstadoCarga = 'Cargado' | 'Vacio';

// "Asignado" y "Fuera de servicio" se agregan para que Parque Vehicular
// pueda usar el mismo vocabulario de estatus en remolques que en unidades.
export type EstatusCaja = 'Disponible' | 'En uso' | 'Mantenimiento' | 'Asignado' | 'Fuera de servicio';

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
  // ---- Parque Vehicular ----
  propietario: string;
  ubicacion: string;
  estadoCarga: EstadoCarga;
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
  /** Nombre de una fila del catalogo "clasificaciones_operador" (ej. Propio, Permisionario, Torton, Full...). */
  clasificacion: string;
}

// Los 4 valores originales siguen siendo el default, pero el catalogo
// "estatus_viaje" permite agregar mas desde la app -- por eso es string
// libre y no una union cerrada.
export type EstatusViaje = string;

export interface EstatusViajeCustom {
  id: string;
  nombre: string;
  color: string;
  activo: boolean;
  esCarga: boolean;
  esDescarga: boolean;
  esTerminoDescarga: boolean;
}

export type SeveridadIncidencia = 'Alta' | 'Media' | 'Baja';
export type EstatusIncidencia = 'Abierta' | 'Resuelta';

/** Un evento reportado por trafico/operador sobre un viaje (Monitoreo > Incidencias). */
export interface IncidenciaViaje {
  id: string;
  viajeId: string;
  tipo: string;
  descripcion: string;
  severidad: SeveridadIncidencia;
  estatus: EstatusIncidencia;
  creadoEn?: string;
  resueltoEn?: string;
}

/** Un mensaje de la bitacora de comunicacion de un viaje (Monitoreo > Comunicacion). */
export interface MensajeViaje {
  id: string;
  viajeId: string;
  autor: string;
  mensaje: string;
  creadoEn?: string;
}

/** Un tramo del convoy de un viaje (Asignar Operador/Camion / Mas Trayectos). */
export interface ViajeTrayecto {
  id: string;
  operadorId: string;
  unidadId: string;
  origen: string;
  destino: string;
}

/** Un renglon de la pestana "Mercancias" (Descripciones / Materiales Carga). */
export interface ViajeMaterial {
  id: string;
  cantidad: number;
  unidadEmpaque: string;
  descripcion: string;
  peso: number;
  unidadPeso: string;
  // ---- Complemento Carta Porte (solo si el viaje es tipoDocumento='CartaPorte') ----
  /** Clave del catalogo SAT c_ClaveProdServCP (Bienes Transportados). */
  claveProdServCP?: string;
  descripcionProdServCP?: string;
  /** Clave del catalogo SAT c_ClaveUnidad para el peso/cantidad de la mercancia. */
  claveUnidadSat?: string;
  nombreUnidadSat?: string;
  /** Clave del catalogo SAT c_TipoEmbalaje. */
  claveEmbalajeSat?: string;
  descripcionEmbalajeSat?: string;
  materialPeligroso?: boolean;
  /** Clave del catalogo SAT c_MaterialPeligroso (solo si materialPeligroso=true). */
  claveMaterialPeligroso?: string;
  descripcionMaterialPeligroso?: string;
  // ---- Sector COFEPRIS (solo aplica a mercancia regulada: medicamentos, quimicos, etc.) ----
  aplicaCofepris?: boolean;
  /** Clave del catalogo SAT c_SectorCOFEPRIS. */
  cofeprisSector?: string;
  /** Clave del catalogo SAT c_TipoMateria. */
  cofeprisTipoMateria?: string;
  cofeprisDenominacionGenerica?: string;
  cofeprisDenominacionDistintiva?: string;
}

/** Un renglon de la pestana "Conceptos Facturacion" (cobro del viaje). */
export interface ViajeConceptoFacturacionLinea {
  id: string;
  conceptoFacturacionId: string;
  concepto: string;
  unidadMedida: string;
  importe: number;
  traslada: string;
  retiene: string;
  importeIsr: number;
}

export type TipoDocumentoViaje = 'Viaje' | 'CartaPorte';

export interface Viaje {
  id: string;
  folio: string;
  fecha: string;
  /** 'Viaje' (documento normal) o 'CartaPorte' (requiere el complemento CFDI de Carta Porte). */
  tipoDocumento: TipoDocumentoViaje;
  /** Datos de timbrado del CFDI de Carta Porte (vacios hasta que se conecte un PAC). */
  timbrado: DatosTimbradoCfdi;
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
  nacional: boolean;
  local: boolean;
  /**
   * Clave del catalogo SAT c_ConfigAutotransporte para el Complemento Carta
   * Porte de este viaje en particular. Por defecto se toma la de la unidad
   * asignada (Unidad.tipo), pero se puede sobreescribir aqui porque la
   * configuracion vehicular cambia cuando la unidad lleva remolque(s)
   * (p.ej. una unidad "C2" pasa a ser "T3S2" al enganchar un semirremolque).
   */
  configVehicularClaveSat?: string;
  estatus: EstatusViaje;
  observaciones: string;
  ubicacionActual: string;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
  // ---- Pestana General (agregados al calcar "Agregando Viaje") ----
  sucursal: string;
  loadNumber: string;
  moneda: string;
  tipoCambio: number;
  rutaCodigo: string;
  rutaDescripcion: string;
  facturable: boolean;
  kilometros: number;
  item: string;
  planta: string;
  convenio: string;
  candadoOficial: string;
  estatusFecha: string;
  estatusHora: string;
  fechaCarga: string;
  horaCarga: string;
  cargarEn: string;
  identificador: string;
  fechaEntrega: string;
  horaEntregaReal: string;
  descargarEn: string;
  remolque1Id?: string;
  dollyId?: string;
  remolque2Id?: string;
  trayectos: ViajeTrayecto[];
  // ---- Pestana Mercancias ----
  materialesCarga: ViajeMaterial[];
  pesoCargaTotal: number;
  pesoCargaUnidad: string;
  // ---- Pestana Conceptos Facturacion ----
  conceptosFacturacionViaje: ViajeConceptoFacturacionLinea[];
}

/** Un punto de la bitacora de avance de un viaje (ej. "Monterrey", "San Luis Potosi"). */
export interface ViajeUbicacion {
  id: string;
  viajeId: string;
  texto: string;
  creadoEn?: string;
}

export type EstatusFactura = 'Pendiente' | 'Facturado' | 'Pagado' | 'Cancelado';

export type TipoFactura = 'Viaje' | 'Concepto';

/** Un renglon de la factura (misma forma que ViajeConceptoFacturacionLinea, mas cantidad/precio/descuento porque aqui si se editan a mano). */
export interface FacturaLinea {
  id: string;
  conceptoFacturacionId?: string;
  concepto: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  importe: number;
  traslada: string;
  importeIva: number;
  retiene: string;
  importeRetencion: number;
}

export interface Factura {
  id: string;
  folio: string;
  fecha: string;
  /** Datos de timbrado del CFDI (vacios hasta que se conecte un PAC). */
  timbrado: DatosTimbradoCfdi;
  /** Primer viaje relacionado (compatibilidad con reportes existentes); la lista completa vive en viajeIds. */
  viajeId: string;
  clienteId: string;
  importe: number;
  moneda: 'MXN' | 'USD';
  estatus: EstatusFactura;
  observaciones: string;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
  // ---- Facturacion por Viaje / por Concepto ----
  tipo: TipoFactura;
  /** Todos los viajes incluidos (Por Viaje puede facturar varios juntos; Por Concepto queda vacio). */
  viajeIds: string[];
  sucursal: string;
  condicionesPago: string;
  formaPago: string;
  metodoPago: string;
  usoCfdi: string;
  tipoCambio: number;
  referencia: string;
  solicitante: string;
  lineas: FacturaLinea[];
  subtotal: number;
  descuentoTotal: number;
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

/** Configuracion de Configuracion > Alertas de Vencimientos: que categorias de documentos generan alerta y con cuantos dias de anticipacion. */
export interface AlertasVencimientosConfig {
  unidad: {
    placas: boolean;
    permisos: boolean;
    seguroPlacaMexicana: boolean;
    seguroPlacaAmericana: boolean;
    documentosAdicionales: boolean;
    diasNotificar: number;
  };
  operador: {
    licencia: boolean;
    pasaporte: boolean;
    documentosAdicionales: boolean;
    diasNotificar: number;
  };
}

export interface Empresa {
  id: string;
  nombre: string;
  razonSocial: string;
  rfc: string;
  /** Clave + descripcion del catalogo SAT c_RegimenFiscal (ej. "612 - Personas Fisicas con Actividades Empresariales y Profesionales"), para el encabezado de los CFDI impresos. */
  regimenFiscal: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  logoDataUrl: string;
  estatus: 'activa' | 'inactiva';
  /** Ruta en Supabase Storage (bucket "empresa-documentos") del ultimo PDF de Constancia de Situacion Fiscal importado. */
  csfStoragePath: string;
  csfImportadaEn?: string;
  alertasVencimientos: AlertasVencimientosConfig;
}

export type EstatusTicketSoporte = 'Nuevo' | 'Atendido' | 'Cerrado';

export interface MensajeTicketSoporte {
  id: string;
  autor: 'cliente' | 'soporte';
  texto: string;
  fecha: string;
}

/**
 * Conversacion de soporte iniciada desde el widget del ERP. Solo el usuario
 * que la abrio y el super admin de la plataforma pueden verla/responderla.
 * "Nuevo" = el cliente espera respuesta; "Atendido" = el ultimo mensaje lo
 * escribio soporte.
 */
export interface TicketSoporte {
  id: string;
  /** Las asignan triggers de la base de datos; nunca se envian al insertar. */
  empresaId?: string;
  usuarioId?: string;
  nombre: string;
  empresaTexto: string;
  telefono: string;
  mensajes: MensajeTicketSoporte[];
  estatus: EstatusTicketSoporte;
  creadoEn?: string;
}

export type Modulo =
  | 'Catalogos'
  | 'Viajes'
  | 'Facturacion'
  | 'Cobranza'
  | 'Banco'
  | 'Mantenimiento'
  | 'Almacen'
  | 'Programa'
  | 'Monitoreo'
  | 'Reportes'
  | 'Configuracion';

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

export interface ClasificacionViaje {
  id: string;
  codigo: string;
  clasificacion: string;
  activo: boolean;
}

export interface GrupoUnidad {
  id: string;
  codigo: string;
  nombre: string;
  color: string;
}

export interface TipoViaje {
  id: string;
  codigo: string;
  tipoViaje: string;
  activo: boolean;
}

export interface ClasificacionOperador {
  id: string;
  codigo: string;
  clasificacion: string;
  activo: boolean;
}

/** Una fila de la tabla Traslado o Retencion dentro de un Concepto de Facturacion (ej. "IVA 16%"). */
export interface ImpuestoConcepto {
  impuesto: string;
  aplica: boolean;
  predeterminado: boolean;
}

export interface ConceptoFacturacion {
  id: string;
  codigo: string;
  concepto: string;
  activo: boolean;
  traslados: ImpuestoConcepto[];
  retenciones: ImpuestoConcepto[];
  incluirCalculoIngresosLiquidacion: boolean;
  incluirCalculoLiquidacionPorcentajeFlete: boolean;
  incluirReporteControlMovimientosInterterminal: boolean;
  incluirReporteControlMovimientosTransporteGasolina: boolean;
  /** Clave del catalogo SAT c_ClaveProdServ (CFDI). */
  claveProdServ: string;
  claveProdServDescripcion: string;
  /** Clave del catalogo SAT c_ClaveUnidad (CFDI). */
  claveUnidad: string;
  claveUnidadNombre: string;
  unidadMedida: string;
  noIdentificacion: string;
  /** Clave del catalogo SAT c_ObjetoImp. */
  objetoImpuesto: string;
}

export type TipoOperacionRuta = 'Importacion' | 'Exportacion';
export type TipoTrayectoRuta = 'Permanente' | 'Eventual';

/** Un tramo dentro del catalogo de Rutas (secuencia de origen/destino con su propio trazo). */
export interface RutaTrayecto {
  id: string;
  secuencia: number;
  origen: string;
  destino: string;
  kilometros: number;
  horas: number;
  eta: string;
  tipoTrayecto: TipoTrayectoRuta;
  /** JSON con las coordenadas [lat, lon] del trazo calculado (OpenStreetMap/OSRM). */
  trazoRuta: string;
}

/** Catalogo de Rutas/Tarifas: plantilla reutilizable para armar un viaje rapido (trayectos, conceptos y mercancias precargados). */
export interface Ruta {
  id: string;
  codigo: string;
  activo: boolean;
  facturable: boolean;
  internacional: boolean;
  tipoOperacion: TipoOperacionRuta;
  clienteId?: string;
  descripcion: string;
  /** Destinatario de origen. */
  origenId?: string;
  /** Destinatario de destino. */
  destinoId?: string;
  /** Clave del catalogo SAT c_ConfigAutotransporte, o vacio para "Todos los tipos de unidades". */
  tipoUnidad: string;
  tipoViajeId?: string;
  clasificacionId?: string;
  origenDireccion: string;
  destinoDireccion: string;
  horas: number;
  eta: string;
  kilometros: number;
  tipoTrayecto: TipoTrayectoRuta;
  trayectoLiquidable: boolean;
  trazoRuta: string;
  trayectos: RutaTrayecto[];
  conceptosFacturacion: ViajeConceptoFacturacionLinea[];
  materialesCarga: ViajeMaterial[];
}

// Los valores tipicos son Peajes/Combustible/Viaticos/Anticipo, pero queda
// libre (como EstatusViaje) para poder capturar "Otro" con una descripcion
// propia sin tener que dar de alta un catalogo aparte.
export type TipoGastoViaje = string;

export type TipoCombustible = 'Diesel' | 'Gasolina';

export type EstatusGastoViaje = 'Activo' | 'Cancelado';

/** Un gasto capturado contra un viaje (peajes, combustible, viaticos/anticipos, u otro). */
export interface GastoViaje {
  id: string;
  viajeId: string;
  operadorId?: string;
  tipo: TipoGastoViaje;
  concepto: string;
  proveedorId?: string;
  fecha: string;
  numeroReferencia: string;
  moneda: string;
  monto: number;
  /** "Generar pasivo en cuentas por pagar": marca el gasto para que Cuentas por Pagar lo tome en cuenta. */
  generaPasivo: boolean;
  notas: string;
  estatus: EstatusGastoViaje;
  // Solo aplican cuando tipo === 'Combustible': permiten calcular el monto
  // automaticamente (litros x precio por litro) en vez de capturarlo a mano.
  combustibleTipo?: TipoCombustible;
  litros?: number;
  precioLitro?: number;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
}

/** Catalogo de conceptos de deduccion para Descuentos a Operador (Prestamo, Uniforme, Herramienta, etc.). */
export interface DeduccionOperador {
  id: string;
  numero: string;
  nombre: string;
  activa: boolean;
}

export type TipoDescuentoOperador = 'Permanente' | 'Otros Descuentos';
export type FormaDescontarOperador = 'Dinero' | 'Porcentaje';
export type EstatusDescuentoOperador = 'Activo' | 'Cancelado';

/**
 * Un descuento/prestamo dado de alta a un operador (submodulo de Trafico,
 * debajo de Gastos de Viaje). "Permanente" se descuenta indefinidamente
 * (sin importeTotalADescontar); "Otros Descuentos" tiene un monto total a
 * saldar (ej. un prestamo) -- el saldo pendiente se calcula restando la
 * suma de sus AbonoDescuentoOperador, nunca se guarda.
 */
export interface DescuentoOperador {
  id: string;
  folio: string;
  descontarAPartir: string;
  operadorId: string;
  deduccionId: string;
  tipoDescuento: TipoDescuentoOperador;
  formaDescontar: FormaDescontarOperador;
  /** Monto fijo por liquidacion si formaDescontar es 'Dinero', o el porcentaje si es 'Porcentaje'. */
  importePorLiquidacion: number;
  moneda: 'MXN' | 'USD';
  /** Monto total del descuento (ej. el prestamo completo). 0 = sin tope (uso tipico de "Permanente"). */
  importeTotalADescontar: number;
  observaciones: string;
  estatus: EstatusDescuentoOperador;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
}

/** Un abono aplicado a un DescuentoOperador (va reduciendo su saldo pendiente). */
export interface AbonoDescuentoOperador {
  id: string;
  descuentoOperadorId: string;
  fecha: string;
  monto: number;
  observaciones: string;
  /** Solo la pone la base de datos (default now()); nunca se escribe desde la app. */
  creadoEn?: string;
}

/** Un formato de impresion configurable por area/proceso (ej. "Viajes" -> Con Importe Real / Con Valor $0). */
export interface FormatoImpresion {
  id: string;
  area: string;
  /** Identificador tecnico que usa la pantalla de impresion de esa area para saber que formato se eligio. */
  clave: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

/** Documentos que se conforman de Serie + Folio (a diferencia de "Invoice", que no se usa). */
export type TipoDocumentoFolio = 'Factura' | 'CartaPorte' | 'NotaCredito';

/**
 * Catalogo de Folios (Configuracion): rangos de folios autorizados por
 * documento/sucursal/serie, con sus datos de aprobacion. Por ahora es un
 * catalogo de referencia/control administrativo -- no sustituye todavia la
 * numeracion automatica de Factura/Viaje(Carta Porte)/NotaCredito, que sigue
 * generando su propio folio.
 */
export interface FolioAutorizado {
  id: string;
  documento: TipoDocumentoFolio;
  sucursal: string;
  serie: string;
  folioInicial: number;
  folioFinal: number;
  noAprobacion: string;
  anioAprobacion: number;
  fechaAprobacion: string;
  activo: boolean;
  creadoEn?: string;
}

/** "unidad" o "remolque" (Caja): a que catalogo pertenece el registro de Parque Vehicular. */
export type EntidadParque = 'unidad' | 'remolque';

/** Una nota libre agregada desde Parque Vehicular a una unidad o remolque; se muestra la mas reciente en la columna "Nota". */
export interface ParqueNota {
  id: string;
  entidadTipo: EntidadParque;
  entidadId: string;
  texto: string;
  creadoEn?: string;
}

/** Bitacora de cambios (estatus, ubicacion, cargado/vacio) hechos desde Parque Vehicular sobre una unidad o remolque. */
export interface ParqueHistorial {
  id: string;
  entidadTipo: EntidadParque;
  entidadId: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  creadoEn?: string;
}

// ============================================================================
// Cobranza: Complementos de Pago, Notas de Credito y Estados de Cuenta.
// ============================================================================

/** Cuanto de un Pago/Abono se aplico a una factura especifica (un pago puede repartirse entre varias). */
export interface AplicacionPago {
  facturaId: string;
  importe: number;
}

export type EstatusPago = 'Aplicado' | 'Cancelado';

/** Un pago/abono de un cliente (Cobranza > Complementos de Pago), repartido entre una o mas facturas. */
export interface PagoCliente {
  id: string;
  folio: string;
  /** Datos de timbrado del CFDI de Complemento de Pago (vacios hasta que se conecte un PAC). */
  timbrado: DatosTimbradoCfdi;
  clienteId: string;
  fechaMovimiento: string;
  fechaCobro: string;
  formaPago: string;
  cuentaBancariaId?: string;
  importeDepositado: number;
  moneda: string;
  tipoCambio: number;
  referenciaBancaria: string;
  concepto: string;
  aplicaciones: AplicacionPago[];
  /** Parte del deposito que no se aplico a ninguna factura (queda como saldo a favor del cliente). */
  saldoAFavor: number;
  estatus: EstatusPago;
  creadoEn?: string;
}

/** Un renglon de Nota de Credito (concepto que reduce el saldo de una o mas facturas relacionadas). */
export interface NotaCreditoLinea {
  id: string;
  concepto: string;
  unidadMedida: string;
  importe: number;
  traslada: string;
  importeIva: number;
}

export type EstatusNotaCredito = 'Activa' | 'Cancelada';

/** Nota de Credito (Cobranza > Notas de Credito): reduce el saldo pendiente de una o mas facturas de un cliente. */
export interface NotaCredito {
  id: string;
  folio: string;
  fecha: string;
  /** Datos de timbrado del CFDI (vacios hasta que se conecte un PAC). */
  timbrado: DatosTimbradoCfdi;
  sucursal: string;
  clienteId: string;
  /** Facturas a las que esta NC les reduce el saldo. */
  facturaIds: string[];
  formaPago: string;
  metodoPago: string;
  usoCfdi: string;
  moneda: string;
  tipoCambio: number;
  lineas: NotaCreditoLinea[];
  observaciones: string;
  subtotal: number;
  total: number;
  estatus: EstatusNotaCredito;
  creadoEn?: string;
}

// ============================================================================
// Banco: Movimientos Bancarios, Cuentas por Pagar y Conciliaciones.
// ============================================================================

export type TipoMovimientoBancario = 'Ingreso' | 'Egreso';

/** Como se origino un Movimiento Bancario: capturado a mano, o generado automaticamente por otro modulo. */
export type OrigenMovimientoBancario = 'Manual' | 'ComplementoPago' | 'PagoProveedor';

export type EstatusMovimientoBancario = 'Activo' | 'Cancelado';

/** Un movimiento (ingreso o egreso) de una cuenta bancaria. Su saldo NUNCA se guarda: se calcula sumando estos movimientos. */
export interface MovimientoBancario {
  id: string;
  cuentaBancariaId: string;
  fecha: string;
  tipo: TipoMovimientoBancario;
  concepto: string;
  beneficiario: string;
  importe: number;
  referencia: string;
  observaciones: string;
  origen: OrigenMovimientoBancario;
  /** Id del PagoCliente/PagoProveedor que genero este movimiento, cuando origen no es 'Manual'. */
  origenId?: string;
  conciliado: boolean;
  estatus: EstatusMovimientoBancario;
  creadoEn?: string;
}

/**
 * Cuanto de un Pago a Proveedor se aplico a un pasivo especifico (un pago puede cubrir varios).
 * Un pasivo es un GastoViaje marcado "Genera pasivo" o una Compra de Almacen -- exactamente uno
 * de los dos ids viene lleno segun el origen.
 */
export interface AplicacionGasto {
  gastoId?: string;
  compraId?: string;
  importe: number;
}

export type EstatusPagoProveedor = 'Aplicado' | 'Cancelado';

/** Un pago a proveedor (Banco > Cuentas por Pagar) que liquida uno o mas gastos de viaje marcados "Genera pasivo". */
export interface PagoProveedor {
  id: string;
  folio: string;
  proveedorId: string;
  fecha: string;
  cuentaBancariaId?: string;
  formaPago: string;
  referencia: string;
  concepto: string;
  aplicaciones: AplicacionGasto[];
  importe: number;
  estatus: EstatusPagoProveedor;
  creadoEn?: string;
}

export type EstatusLineaConciliacion = 'Conciliado' | 'Pendiente' | 'Sin coincidencia';

/** Un renglon del archivo de movimientos del banco que se importo para conciliar, ya emparejado (o no) con un Movimiento Bancario del sistema. */
export interface LineaConciliacion {
  id: string;
  fecha: string;
  descripcion: string;
  referencia: string;
  importe: number;
  tipo: TipoMovimientoBancario;
  movimientoBancarioId?: string;
  estatus: EstatusLineaConciliacion;
}

/** Una conciliacion bancaria guardada (Banco > Conciliaciones): que movimientos del banco se emparejaron con cuales del sistema. */
export interface ConciliacionBancaria {
  id: string;
  cuentaBancariaId: string;
  desde: string;
  hasta: string;
  archivoNombre: string;
  saldoFinalBanco: number;
  lineas: LineaConciliacion[];
  creadoEn?: string;
}

// ============================================================================
// Mantenimiento: Catalogos, Reportes de Fallas, Ordenes de Servicio,
// Servicios Programados y Checklist Fisicomecanico Rapido.
// ============================================================================

/** Catalogo "Clasificaciones de Servicio" (ej. Motor, Frenos, Electrico, Suspension, Llantas). */
export interface ClasificacionServicio {
  id: string;
  codigo: string;
  clasificacion: string;
  activo: boolean;
}

/** Catalogo "Servicios" con codigo, usado como renglon en una Orden de Servicio (ej. Cambio de aceite, Balanceo). */
export interface CatalogoServicio {
  id: string;
  codigo: string;
  descripcion: string;
  tiempoEstandarHoras: number;
  activo: boolean;
}

export type TipoMecanico = 'Mecanico' | 'Ayudante';

/** Catalogo "Mecanicos/Ayudantes": roster interno de quien realiza las reparaciones. */
export interface Mecanico {
  id: string;
  numero: string;
  nombre: string;
  tipo: TipoMecanico;
  activo: boolean;
}

/** Catalogo "Planes de Servicio": intervalos de mantenimiento preventivo (ej. Cambio de aceite cada 10,000 km o 6 meses). */
export interface PlanServicio {
  id: string;
  codigo: string;
  nombre: string;
  /** Aplica a un grupo de unidades especifico, o 'Todas'. */
  aplicaA: string;
  intervaloKm: number | null;
  intervaloMeses: number | null;
  activo: boolean;
}

export interface ReporteFallaDocumento {
  id: string;
  descripcion: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

export type EstatusReporteFalla = 'Abierto' | 'Atendido' | 'Cancelado';

/** Un reporte de falla capturado sobre una unidad (Mantenimiento > Reportes de Fallas). */
export interface ReporteFalla {
  id: string;
  folio: string;
  fecha: string;
  codigoFalla: string;
  sucursal: string;
  unidadId: string;
  operadorId?: string;
  clasificacionServicioId?: string;
  descripcion: string;
  documentos: ReporteFallaDocumento[];
  estatus: EstatusReporteFalla;
  /** Se llena cuando el reporte se atiende dentro de una Orden de Servicio. */
  ordenServicioId?: string;
  creadoEn?: string;
}

/** Un renglon de servicio dentro de una Orden de Servicio. */
export interface OrdenServicioLinea {
  id: string;
  catalogoServicioId?: string;
  codigo: string;
  descripcion: string;
  manoObra: number;
  fechaInicio: string;
  horaInicio: string;
  fechaFinal: string;
  horaFinal: string;
  tiempoServicioHoras: number;
}

export interface OrdenServicioFoto {
  id: string;
  storagePath: string;
  nombreArchivo: string;
  subidoEn: string;
}

export type TipoOrdenServicio = 'Interno' | 'Externo';
export type TipoServicioMantenimiento = 'Preventivo' | 'Correctivo';
export type EstatusOrdenServicio = 'Abierta' | 'En Proceso' | 'Concluida' | 'Cancelada';

/** Orden de Servicio (Mantenimiento > Ordenes de Servicio): repara/da mantenimiento a una unidad, interno o con un proveedor externo. */
export interface OrdenServicio {
  id: string;
  folio: string;
  fecha: string;
  tipo: TipoOrdenServicio;
  moneda: string;
  tipoCambio: number;
  tipoServicio: TipoServicioMantenimiento;
  unidadId: string;
  estatus: EstatusOrdenServicio;
  proveedorId?: string;
  proveedorNota: string;
  lugarReparacion: string;
  notas: string;
  noChecklist: string;
  vidaProbableAnios: number | null;
  vidaProbableKm: number | null;
  quienRealizaId?: string;
  mecanicosIds: string[];
  observaciones: string;
  reporteFallaIds: string[];
  planesServicioIds: string[];
  /** Kilometraje de la unidad al momento de esta orden -- base para calcular el proximo vencimiento por km en Servicios Programados. */
  kilometrajeAlMomento: number;
  lineas: OrdenServicioLinea[];
  fotos: OrdenServicioFoto[];
  creadoEn?: string;
}

export interface ChecklistFisicomecanicoItem {
  id: string;
  seccion: string;
  concepto: string;
  descripcion: string;
  completado: boolean;
  observaciones: string;
}

/** Checklist Fisicomecanico Rapido: inspeccion visual de una unidad, ligada o no a un viaje. */
export interface ChecklistFisicomecanico {
  id: string;
  folio: string;
  fecha: string;
  unidadId: string;
  operadorId?: string;
  items: ChecklistFisicomecanicoItem[];
  observacionesGenerales: string;
  creadoEn?: string;
}

// ============================================================================
// Almacen: Catalogos (Almacenes, Articulos, Tipos de Movimiento), ciclo de
// compras (Cotizaciones, Requisiciones, Ordenes de Compra, Compras) y
// Movimientos/Inventario de Almacen.
// ============================================================================

export interface Almacen {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/** Catalogo de Articulos/Insumos/Refacciones que se mueven por almacen. */
export interface Articulo {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precioUnitario: number;
  activo: boolean;
}

export type NaturalezaMovimientoAlmacen = 'Entrada' | 'Salida';

/** Catalogo editable de Tipos de Movimiento de Almacen (ej. Entrada por Compra, Salida por Consumo). */
export interface TipoMovimientoAlmacen {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza: NaturalezaMovimientoAlmacen;
  activo: boolean;
}

/** Una linea de articulo generica, reutilizada por Cotizaciones/Requisiciones/Ordenes de Compra/Compras/Movimientos. */
export interface LineaArticuloAlmacen {
  id: string;
  articuloId?: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  unidadMedida: string;
  observaciones: string;
}

export type EstatusCotizacion = 'Abierta' | 'Cerrada' | 'Cancelada';

/** Cotizacion de un proveedor para uno o varios articulos, referencia de precio antes de comprar. */
export interface Cotizacion {
  id: string;
  folio: string;
  fecha: string;
  proveedorId?: string;
  moneda: string;
  tipoCambio: number;
  lineas: LineaArticuloAlmacen[];
  observaciones: string;
  estatus: EstatusCotizacion;
}

export type EstatusRequisicion = 'Abierta' | 'Aplicada' | 'Cancelada';

/** Requisicion interna de compra; paso opcional antes de una Orden de Compra. */
export interface Requisicion {
  id: string;
  folio: string;
  fecha: string;
  proveedorId?: string;
  almacenId?: string;
  referencia: string;
  moneda: string;
  tipoCambio: number;
  lineas: LineaArticuloAlmacen[];
  observaciones: string;
  estatus: EstatusRequisicion;
}

/** Una linea de Orden de Compra: ademas de cantidad/precio, da seguimiento a lo ya recibido via Compras. */
export interface LineaOrdenCompra extends LineaArticuloAlmacen {
  almacenId: string;
  cantidadRecibida: number;
}

export type EstatusOrdenCompra = 'Abierta' | 'Parcialmente Recibida' | 'Recibida' | 'Cancelada';

/** Orden de Compra: autoriza a un proveedor a surtir articulos; puede originarse en una Requisicion o crearse directa. */
export interface OrdenCompra {
  id: string;
  folio: string;
  fecha: string;
  proveedorId: string;
  requisicionId?: string;
  referencia: string;
  moneda: string;
  tipoCambio: number;
  lineas: LineaOrdenCompra[];
  observaciones: string;
  estatus: EstatusOrdenCompra;
}

/** Una linea de Compra: liga a la Orden de Compra/almacen de origen para descontar lo pendiente. */
export interface LineaCompra extends LineaArticuloAlmacen {
  ordenCompraId?: string;
  /** Id de la linea original dentro de esa Orden de Compra, para descontar su cantidadRecibida al aplicar la Compra. */
  ordenCompraLineaId?: string;
  almacenId: string;
}

export type EstatusCompra = 'Aplicada' | 'Cancelada';

/** Compra: registra la mercancia que efectivamente entrega el proveedor (con o sin Orden de Compra previa). */
export interface Compra {
  id: string;
  folio: string;
  fecha: string;
  proveedorId: string;
  folioFiscalUuid: string;
  serieDocumento: string;
  numeroDocumento: string;
  fechaRecibido: string;
  fechaVencimiento: string;
  moneda: string;
  tipoCambio: number;
  ordenesCompraIds: string[];
  lineas: LineaCompra[];
  generarPasivo: boolean;
  observaciones: string;
  estatus: EstatusCompra;
  creadoEn?: string;
}

export type OrigenMovimientoAlmacen = 'Manual' | 'Compra';
export type EstatusMovimientoAlmacen = 'Aplicado' | 'Cancelado';

/** Movimiento de entrada o salida de almacen (manual o generado automaticamente al registrar una Compra). */
export interface MovimientoAlmacen {
  id: string;
  folio: string;
  fecha: string;
  tipoMovimientoId: string;
  almacenId: string;
  almacenDestinoId?: string;
  proveedorId?: string;
  referencia: string;
  moneda: string;
  tipoCambio: number;
  lineas: LineaArticuloAlmacen[];
  observaciones: string;
  origen: OrigenMovimientoAlmacen;
  origenId?: string;
  estatus: EstatusMovimientoAlmacen;
  creadoEn?: string;
}
