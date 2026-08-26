import type {
  Caja,
  Cliente,
  Empresa,
  EntregaTurnoNota,
  EntregaTurnoUnidad,
  EstatusViajeCustom,
  Factura,
  FacturaSistema,
  Operador,
  ReporteExterno,
  Rol,
  SemaforoEntrega,
  TipoNotaEntregaTurno,
  Unidad,
  Usuario,
  Viaje,
} from '../types';

// Cada par fromXRow/xToRow convierte entre una fila de Supabase (columnas en
// snake_case, tal como quedaron en supabase/schema.sql) y el tipo de la app
// (camelCase). Son planos a proposito: nada de logica, solo el cambio de
// nombre de columnas.

export function clienteFromRow(row: Record<string, unknown>): Cliente {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    rfc: row.rfc as string,
    contacto: row.contacto as string,
    telefono: row.telefono as string,
    email: row.email as string,
    direccion: row.direccion as string,
    estatus: row.estatus as Cliente['estatus'],
  };
}
export function clienteToRow(c: Cliente) {
  return { ...c };
}

export function unidadFromRow(row: Record<string, unknown>): Unidad {
  return {
    id: row.id as string,
    economico: row.economico as string,
    placas: row.placas as string,
    tipo: row.tipo as Unidad['tipo'],
    marca: row.marca as string,
    modelo: row.modelo as string,
    anio: row.anio as number,
    estatus: row.estatus as Unidad['estatus'],
    operadorAsignadoId: (row.operador_asignado_id as string | null) ?? undefined,
    clienteAsignadoId: (row.cliente_asignado_id as string | null) ?? undefined,
  };
}
export function unidadToRow(u: Unidad) {
  return {
    id: u.id,
    economico: u.economico,
    placas: u.placas,
    tipo: u.tipo,
    marca: u.marca,
    modelo: u.modelo,
    anio: u.anio,
    estatus: u.estatus,
    operador_asignado_id: u.operadorAsignadoId ?? null,
    cliente_asignado_id: u.clienteAsignadoId ?? null,
  };
}

export function cajaFromRow(row: Record<string, unknown>): Caja {
  return {
    id: row.id as string,
    economico: row.economico as string,
    placas: row.placas as string,
    tipo: row.tipo as Caja['tipo'],
    capacidad: row.capacidad as string,
    estatus: row.estatus as Caja['estatus'],
    marca: (row.marca as string | null) ?? undefined,
    modelo: (row.modelo as string | null) ?? undefined,
    anio: (row.anio as number | null) ?? undefined,
  };
}
export function cajaToRow(c: Caja) {
  return {
    id: c.id,
    economico: c.economico,
    placas: c.placas,
    tipo: c.tipo,
    capacidad: c.capacidad,
    estatus: c.estatus,
    marca: c.marca ?? null,
    modelo: c.modelo ?? null,
    anio: c.anio ?? null,
  };
}

export function operadorFromRow(row: Record<string, unknown>): Operador {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    licencia: row.licencia as string,
    tipoLicencia: row.tipo_licencia as string,
    telefono: row.telefono as string,
    vigenciaLicencia: (row.vigencia_licencia as string | null) ?? '',
    estatus: row.estatus as Operador['estatus'],
  };
}
export function operadorToRow(o: Operador) {
  return {
    id: o.id,
    nombre: o.nombre,
    licencia: o.licencia,
    tipo_licencia: o.tipoLicencia,
    telefono: o.telefono,
    vigencia_licencia: o.vigenciaLicencia || null,
    estatus: o.estatus,
  };
}

export function viajeFromRow(row: Record<string, unknown>): Viaje {
  return {
    id: row.id as string,
    folio: row.folio as string,
    fecha: row.fecha as string,
    clienteId: (row.cliente_id as string | null) ?? '',
    unidadId: (row.unidad_id as string | null) ?? '',
    operadorId: (row.operador_id as string | null) ?? '',
    materiales: row.materiales as string,
    cajaNombre: row.caja_nombre as string,
    cajaEconomico: row.caja_economico as string,
    origen: row.origen as string,
    destino: row.destino as string,
    horaSalida: row.hora_salida as string,
    horaLlegadaEstimada: row.hora_llegada_estimada as string,
    cita: row.cita as string,
    importacion: row.importacion as boolean,
    exportacion: row.exportacion as boolean,
    estatus: row.estatus as Viaje['estatus'],
    observaciones: row.observaciones as string,
  };
}
export function viajeToRow(v: Viaje) {
  return {
    id: v.id,
    folio: v.folio,
    fecha: v.fecha,
    cliente_id: v.clienteId || null,
    unidad_id: v.unidadId || null,
    operador_id: v.operadorId || null,
    materiales: v.materiales,
    caja_nombre: v.cajaNombre,
    caja_economico: v.cajaEconomico,
    origen: v.origen,
    destino: v.destino,
    hora_salida: v.horaSalida,
    hora_llegada_estimada: v.horaLlegadaEstimada,
    cita: v.cita,
    importacion: v.importacion,
    exportacion: v.exportacion,
    estatus: v.estatus,
    observaciones: v.observaciones,
  };
}

export function estatusViajeFromRow(row: Record<string, unknown>): EstatusViajeCustom {
  return { id: row.id as string, nombre: row.nombre as string, color: (row.color as string) || 'gray' };
}
export function estatusViajeToRow(e: EstatusViajeCustom) {
  return { id: e.id, nombre: e.nombre, color: e.color };
}

export function entregaTurnoUnidadFromRow(row: Record<string, unknown>): EntregaTurnoUnidad {
  return {
    id: row.id as string,
    fecha: row.fecha as string,
    unidadTexto: (row.unidad_texto as string) ?? '',
    operadorTexto: (row.operador_texto as string) ?? '',
    servicioAnterior: (row.servicio_anterior as string) ?? '',
    semaforo: (row.semaforo as SemaforoEntrega) ?? 'verde',
    estatusActual: (row.estatus_actual as string) ?? '',
    notaAdicional: (row.nota_adicional as string) ?? '',
    cita: (row.cita as string) ?? '',
    instruccion: (row.instruccion as string) ?? '',
    proximoServicio: (row.proximo_servicio as string) ?? '',
    resumenEstatus: (row.resumen_estatus as string) ?? '',
    resumenSiguiente: (row.resumen_siguiente as string) ?? '',
    orden: Number(row.orden) || 0,
  };
}
export function entregaTurnoUnidadToRow(e: EntregaTurnoUnidad) {
  return {
    id: e.id,
    fecha: e.fecha,
    unidad_texto: e.unidadTexto,
    operador_texto: e.operadorTexto,
    servicio_anterior: e.servicioAnterior,
    semaforo: e.semaforo,
    estatus_actual: e.estatusActual,
    nota_adicional: e.notaAdicional,
    cita: e.cita,
    instruccion: e.instruccion,
    proximo_servicio: e.proximoServicio,
    resumen_estatus: e.resumenEstatus,
    resumen_siguiente: e.resumenSiguiente,
    orden: e.orden,
  };
}

export function entregaTurnoNotaFromRow(row: Record<string, unknown>): EntregaTurnoNota {
  return {
    id: row.id as string,
    fecha: row.fecha as string,
    tipo: row.tipo as TipoNotaEntregaTurno,
    texto: (row.texto as string) ?? '',
    orden: Number(row.orden) || 0,
  };
}
export function entregaTurnoNotaToRow(n: EntregaTurnoNota) {
  return { id: n.id, fecha: n.fecha, tipo: n.tipo, texto: n.texto, orden: n.orden };
}

export function facturaFromRow(row: Record<string, unknown>): Factura {
  return {
    id: row.id as string,
    folio: row.folio as string,
    fecha: row.fecha as string,
    viajeId: (row.viaje_id as string | null) ?? '',
    clienteId: (row.cliente_id as string | null) ?? '',
    importe: Number(row.importe),
    moneda: row.moneda as Factura['moneda'],
    estatus: row.estatus as Factura['estatus'],
    observaciones: row.observaciones as string,
  };
}
export function facturaToRow(f: Factura) {
  return {
    id: f.id,
    folio: f.folio,
    fecha: f.fecha,
    viaje_id: f.viajeId || null,
    cliente_id: f.clienteId || null,
    importe: f.importe,
    moneda: f.moneda,
    estatus: f.estatus,
    observaciones: f.observaciones,
  };
}

export function facturaSistemaFromRow(row: Record<string, unknown>): FacturaSistema {
  return {
    id: String(row.id),
    cliente: (row.cliente as string) ?? '',
    economicoTracto: (row.economico_tracto as string) ?? '',
    economicoRemolque: (row.economico_remolque as string) ?? '',
    origenPedido: (row.origen_pedido as string) ?? '',
    locacionOrigen: (row.locacion_origen as string) ?? '',
    transportista: (row.transportista as string) ?? '',
    fechaOrigen: (row.fecha_origen as string | null) ?? '',
    destinoPedido: (row.destino_pedido as string) ?? '',
    locacionDestino: (row.locacion_destino as string) ?? '',
    fechaDestino: (row.fecha_destino as string | null) ?? '',
    ordenTrabajo: (row.orden_trabajo as string | null) ?? '',
    tipoPedido: (row.tipo_pedido as string) ?? '',
    fechaFactura: (row.fecha_factura as string) ?? '',
    totalFactura: Number(row.total_factura) || 0,
    saldoPendiente: Number(row.saldo_pendiente) || 0,
    estadoPedido: (row.estado_pedido as string) ?? '',
    moneda: (row.moneda as string) ?? '',
    tipoCambio: Number(row.tipo_cambio) || 0,
    tarifa: Number(row.tarifa) || 0,
    adicional: Number(row.adicional) || 0,
    totalTarifa: Number(row.total_tarifa) || 0,
    utilidad: Number(row.utilidad) || 0,
  };
}
export function facturaSistemaToRow(f: FacturaSistema) {
  return {
    id: Number(f.id),
    cliente: f.cliente,
    economico_tracto: f.economicoTracto,
    economico_remolque: f.economicoRemolque,
    origen_pedido: f.origenPedido,
    locacion_origen: f.locacionOrigen,
    transportista: f.transportista,
    fecha_origen: f.fechaOrigen || null,
    destino_pedido: f.destinoPedido,
    locacion_destino: f.locacionDestino,
    fecha_destino: f.fechaDestino || null,
    orden_trabajo: f.ordenTrabajo || null,
    tipo_pedido: f.tipoPedido,
    fecha_factura: f.fechaFactura,
    total_factura: f.totalFactura,
    saldo_pendiente: f.saldoPendiente,
    estado_pedido: f.estadoPedido,
    moneda: f.moneda,
    tipo_cambio: f.tipoCambio,
    tarifa: f.tarifa,
    adicional: f.adicional,
    total_tarifa: f.totalTarifa,
    utilidad: f.utilidad,
  };
}

export function reporteFromRow(row: Record<string, unknown>): ReporteExterno {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string,
    url: row.url as string,
    actualizado: row.actualizado as string,
  };
}
export function reporteToRow(r: ReporteExterno) {
  return { ...r };
}

export function rolFromRow(row: Record<string, unknown>): Rol {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string,
    permisos: row.permisos as Rol['permisos'],
  };
}
export function rolToRow(r: Rol) {
  return { ...r };
}

export function usuarioFromRow(row: Record<string, unknown>): Usuario {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    email: row.email as string,
    telefono: row.telefono as string,
    rolId: (row.rol_id as string | null) ?? '',
    estatus: row.estatus as Usuario['estatus'],
  };
}
export function usuarioToRow(u: Usuario) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono,
    rol_id: u.rolId || null,
    estatus: u.estatus,
  };
}

export function empresaFromRow(row: Record<string, unknown>): Empresa {
  return {
    nombre: row.nombre as string,
    razonSocial: row.razon_social as string,
    rfc: row.rfc as string,
    direccion: row.direccion as string,
    telefono: row.telefono as string,
    email: row.email as string,
    sitioWeb: row.sitio_web as string,
    logoDataUrl: row.logo_data_url as string,
  };
}
export function empresaToRow(e: Empresa) {
  return {
    nombre: e.nombre,
    razon_social: e.razonSocial,
    rfc: e.rfc,
    direccion: e.direccion,
    telefono: e.telefono,
    email: e.email,
    sitio_web: e.sitioWeb,
    logo_data_url: e.logoDataUrl,
  };
}
