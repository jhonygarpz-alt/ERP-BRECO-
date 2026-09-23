/**
 * Catalogos oficiales del SAT (Complemento Carta Porte), compartidos entre
 * Unidades (configuracion vehicular del vehiculo motriz) y Remolques
 * (subtipo de remolque/semirremolque). Se usan como el "Tipo de unidad" /
 * "Tipo de remolque" de cada catalogo para que la clasificacion ya calce
 * con la clave que despues pide el CFDI de Carta Porte.
 */

export interface ClaveSat {
  clave: string;
  descripcion: string;
}

/** c_UsoCFDI -- para que efecto fiscal solicita el cliente el comprobante (Facturacion). */
export const USO_CFDI_SAT: ClaveSat[] = [
  { clave: 'G01', descripcion: 'Adquisicion de mercancias' },
  { clave: 'G02', descripcion: 'Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', descripcion: 'Gastos en general' },
  { clave: 'I01', descripcion: 'Construcciones' },
  { clave: 'I02', descripcion: 'Mobiliario y equipo de oficina por inversiones' },
  { clave: 'I03', descripcion: 'Equipo de transporte' },
  { clave: 'I04', descripcion: 'Equipo de computo y accesorios' },
  { clave: 'I05', descripcion: 'Dados, troqueles, moldes, matrices y otros activos' },
  { clave: 'I06', descripcion: 'Comunicaciones telefonicas' },
  { clave: 'I07', descripcion: 'Comunicaciones satelitales' },
  { clave: 'I08', descripcion: 'Otra maquinaria y equipo' },
  { clave: 'D01', descripcion: 'Honorarios medicos, dentales y gastos hospitalarios' },
  { clave: 'D02', descripcion: 'Gastos medicos por incapacidad o discapacidad' },
  { clave: 'D03', descripcion: 'Gastos funerales' },
  { clave: 'D04', descripcion: 'Donativos' },
  { clave: 'D05', descripcion: 'Intereses reales pagados por creditos hipotecarios (casa habitacion)' },
  { clave: 'D06', descripcion: 'Aportaciones voluntarias al SAR' },
  { clave: 'D07', descripcion: 'Primas por seguros de gastos medicos' },
  { clave: 'D08', descripcion: 'Gastos de transportacion escolar obligatoria' },
  { clave: 'D09', descripcion: 'Depositos en cuentas para el ahorro, pensiones' },
  { clave: 'D10', descripcion: 'Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', descripcion: 'Sin efectos fiscales' },
  { clave: 'CP01', descripcion: 'Pagos' },
  { clave: 'CN01', descripcion: 'Nomina' },
];

/** c_ConfigAutotransporte -- configuracion vehicular del vehiculo motriz (Unidades). */
export const CONFIG_AUTOTRANSPORTE_SAT: ClaveSat[] = [
  { clave: 'VL', descripcion: 'Vehiculo ligero de carga (2 llantas en el eje delantero y 2 llantas en el eje trasero)' },
  { clave: 'C2', descripcion: 'Camion Unitario (2 llantas en el eje delantero y 4 llantas en el eje trasero)' },
  { clave: 'C3', descripcion: 'Camion Unitario (2 llantas en el eje delantero y 6 u 8 llantas en los dos ejes traseros)' },
  { clave: 'C2R2', descripcion: 'Camion-Remolque (6 llantas en el camion y 8 llantas en remolque)' },
  { clave: 'C3R2', descripcion: 'Camion-Remolque (10 llantas en el camion y 8 llantas en remolque)' },
  { clave: 'C2R3', descripcion: 'Camion-Remolque (6 llantas en el camion y 12 llantas en remolque)' },
  { clave: 'C3R3', descripcion: 'Camion-Remolque (10 llantas en el camion y 12 llantas en remolque)' },
  { clave: 'T2S1', descripcion: 'Tractocamion Articulado (6 llantas en el tractocamion, 4 llantas en el semirremolque)' },
  { clave: 'T2S2', descripcion: 'Tractocamion Articulado (6 llantas en el tractocamion, 8 llantas en el semirremolque)' },
  { clave: 'T2S3', descripcion: 'Tractocamion Articulado (6 llantas en el tractocamion, 12 llantas en el semirremolque)' },
  { clave: 'T3S1', descripcion: 'Tractocamion Articulado (10 llantas en el tractocamion, 4 llantas en el semirremolque)' },
  { clave: 'T3S2', descripcion: 'Tractocamion Articulado (10 llantas en el tractocamion, 8 llantas en el semirremolque)' },
  { clave: 'T3S3', descripcion: 'Tractocamion Articulado (10 llantas en el tractocamion, 12 llantas en el semirremolque)' },
  { clave: 'T2S1R2', descripcion: 'Tractocamion Semirremolque-Remolque (6-4-8 llantas)' },
  { clave: 'T2S2R2', descripcion: 'Tractocamion Semirremolque-Remolque (6-8-8 llantas)' },
  { clave: 'T2S1R3', descripcion: 'Tractocamion Semirremolque-Remolque (6-4-12 llantas)' },
  { clave: 'T3S1R2', descripcion: 'Tractocamion Semirremolque-Remolque (10-4-8 llantas)' },
  { clave: 'T3S1R3', descripcion: 'Tractocamion Semirremolque-Remolque (10-4-12 llantas)' },
  { clave: 'T3S2R2', descripcion: 'Tractocamion Semirremolque-Remolque (10-8-8 llantas)' },
  { clave: 'T3S2R3', descripcion: 'Tractocamion Semirremolque-Remolque (10-8-12 llantas)' },
  { clave: 'T3S2R4', descripcion: 'Tractocamion Semirremolque-Remolque (10-8-16 llantas)' },
  { clave: 'T2S2S2', descripcion: 'Tractocamion Semirremolque-Semirremolque (6-8-8 llantas)' },
  { clave: 'T3S2S2', descripcion: 'Tractocamion Semirremolque-Semirremolque (10-8-8 llantas)' },
  { clave: 'T3S3S2', descripcion: 'Tractocamion Semirremolque-Semirremolque (10-12-8 llantas)' },
  { clave: 'OTROEVGP', descripcion: 'Especializado de carga Voluminosa y/o Gran Peso' },
  { clave: 'OTROSG', descripcion: 'Servicio de Gruas' },
  { clave: 'GPLUTA', descripcion: 'Grua de Pluma Tipo A' },
  { clave: 'GPLUTB', descripcion: 'Grua de Pluma Tipo B' },
  { clave: 'GPLUTC', descripcion: 'Grua de Pluma Tipo C' },
  { clave: 'GPLUTD', descripcion: 'Grua de Pluma Tipo D' },
  { clave: 'GPLATA', descripcion: 'Grua de Plataforma Tipo A' },
  { clave: 'GPLATB', descripcion: 'Grua de Plataforma Tipo B' },
  { clave: 'GPLATC', descripcion: 'Grua de Plataforma Tipo C' },
  { clave: 'GPLATD', descripcion: 'Grua de Plataforma Tipo D' },
];

/** c_SubTipoRem -- subtipo de remolque/semirremolque (Remolques). */
export const SUBTIPO_REMOLQUE_SAT: ClaveSat[] = [
  { clave: 'CTR001', descripcion: 'Caballete' },
  { clave: 'CTR002', descripcion: 'Caja' },
  { clave: 'CTR003', descripcion: 'Caja Abierta' },
  { clave: 'CTR004', descripcion: 'Caja Cerrada' },
  { clave: 'CTR005', descripcion: 'Caja De Recoleccion Con Cargador Frontal' },
  { clave: 'CTR006', descripcion: 'Caja Refrigerada' },
  { clave: 'CTR007', descripcion: 'Caja Seca' },
  { clave: 'CTR008', descripcion: 'Caja Transferencia' },
  { clave: 'CTR009', descripcion: 'Cama Baja o Cuello Ganso' },
  { clave: 'CTR010', descripcion: 'Chasis Portacontenedor' },
  { clave: 'CTR011', descripcion: 'Convencional De Chasis' },
  { clave: 'CTR012', descripcion: 'Equipo Especial' },
  { clave: 'CTR013', descripcion: 'Estacas' },
  { clave: 'CTR014', descripcion: 'Gondola Madrina' },
  { clave: 'CTR015', descripcion: 'Grua Industrial' },
  { clave: 'CTR016', descripcion: 'Grua' },
  { clave: 'CTR017', descripcion: 'Integral' },
  { clave: 'CTR018', descripcion: 'Jaula' },
  { clave: 'CTR019', descripcion: 'Media Redila' },
  { clave: 'CTR020', descripcion: 'Pallet o Celdillas' },
  { clave: 'CTR021', descripcion: 'Plataforma' },
  { clave: 'CTR022', descripcion: 'Plataforma Con Grua' },
  { clave: 'CTR023', descripcion: 'Plataforma Encortinada' },
  { clave: 'CTR024', descripcion: 'Redilas' },
  { clave: 'CTR025', descripcion: 'Refrigerador' },
  { clave: 'CTR026', descripcion: 'Revolvedora' },
  { clave: 'CTR027', descripcion: 'Semicaja' },
  { clave: 'CTR028', descripcion: 'Tanque' },
  { clave: 'CTR029', descripcion: 'Tolva' },
  { clave: 'CTR031', descripcion: 'Volteo' },
  { clave: 'CTR032', descripcion: 'Volteo Desmontable' },
];

/** c_ObjetoImp -- si el concepto es objeto de impuesto (usado en Conceptos de Facturacion). */
export const OBJETO_IMPUESTO_SAT: ClaveSat[] = [
  { clave: '01', descripcion: 'No objeto de impuesto.' },
  { clave: '02', descripcion: 'Si objeto de impuesto.' },
  { clave: '03', descripcion: 'Si objeto del impuesto y no obligado al desglose.' },
  { clave: '04', descripcion: 'Si objeto del impuesto y no causa impuesto.' },
];
