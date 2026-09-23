import type {
  Caja,
  ClasificacionOperador,
  ClasificacionViaje,
  Cliente,
  ConceptoFacturacion,
  CuentaBancaria,
  Destinatario,
  Empresa,
  EstatusUnidadCustom,
  EstatusViajeCustom,
  Factura,
  FacturaSistema,
  FormatoImpresion,
  GastoViaje,
  GrupoUnidad,
  IncidenciaViaje,
  MensajeViaje,
  ParqueHistorial,
  ParqueNota,
  Operador,
  Proveedor,
  ReporteExterno,
  Rol,
  Ruta,
  TipoViaje,
  Unidad,
  Usuario,
  Viaje,
  ViajeUbicacion,
} from '../types';

// Cada par fromXRow/xToRow convierte entre una fila de Supabase (columnas en
// snake_case, tal como quedaron en supabase/schema.sql) y el tipo de la app
// (camelCase). Son planos a proposito: nada de logica, solo el cambio de
// nombre de columnas.

export function clienteFromRow(row: Record<string, unknown>): Cliente {
  return {
    id: row.id as string,
    numeroCliente: row.numero_cliente as string,
    nombre: row.nombre as string,
    nombreCorto: row.nombre_corto as string,
    fechaAlta: row.fecha_alta as string,
    rfc: row.rfc as string,
    tipo: row.tipo as Cliente['tipo'],
    moneda: row.moneda as Cliente['moneda'],
    iva: row.iva as Cliente['iva'],
    grupo: row.grupo as string,
    sucursal: row.sucursal as string,
    estatus: row.estatus as Cliente['estatus'],
    operadorLogistico: row.operador_logistico as boolean,
    aplicarDetalleViajeXml: row.aplicar_detalle_viaje_xml as boolean,
    pais: row.pais as string,
    cp: row.cp as string,
    estado: row.estado as string,
    municipio: row.municipio as string,
    colonia: row.colonia as string,
    localidad: row.localidad as string,
    calle: row.calle as string,
    numeroExterior: row.numero_exterior as string,
    numeroInterior: row.numero_interior as string,
    telefonos: row.telefonos as string,
    celular: row.celular as string,
    correo: row.correo as string,
    contactos: (row.contactos as Cliente['contactos'] | null) ?? [],
    formaPago: row.forma_pago as string,
    diasCredito: row.dias_credito as number,
    limiteCreditoMxn: row.limite_credito_mxn as number,
    limiteCreditoUsd: row.limite_credito_usd as number,
    limitarViajes: row.limitar_viajes as boolean,
    limiteFacturasVencidas: (row.limite_facturas_vencidas as number | null) ?? null,
    bancoOrdenante: row.banco_ordenante as string,
    bancoOrdenanteExtranjero: row.banco_ordenante_extranjero as boolean,
    bancoRfc: row.banco_rfc as string,
    bancoNoCuenta: row.banco_no_cuenta as string,
  };
}
export function clienteToRow(c: Cliente) {
  return {
    id: c.id,
    numero_cliente: c.numeroCliente || null,
    nombre: c.nombre,
    nombre_corto: c.nombreCorto,
    fecha_alta: c.fechaAlta,
    rfc: c.rfc,
    tipo: c.tipo,
    moneda: c.moneda,
    iva: c.iva,
    grupo: c.grupo,
    sucursal: c.sucursal,
    estatus: c.estatus,
    operador_logistico: c.operadorLogistico,
    aplicar_detalle_viaje_xml: c.aplicarDetalleViajeXml,
    pais: c.pais,
    cp: c.cp,
    estado: c.estado,
    municipio: c.municipio,
    colonia: c.colonia,
    localidad: c.localidad,
    calle: c.calle,
    numero_exterior: c.numeroExterior,
    numero_interior: c.numeroInterior,
    telefonos: c.telefonos,
    celular: c.celular,
    correo: c.correo,
    contactos: c.contactos,
    forma_pago: c.formaPago,
    dias_credito: c.diasCredito,
    limite_credito_mxn: c.limiteCreditoMxn,
    limite_credito_usd: c.limiteCreditoUsd,
    limitar_viajes: c.limitarViajes,
    limite_facturas_vencidas: c.limiteFacturasVencidas,
    banco_ordenante: c.bancoOrdenante,
    banco_ordenante_extranjero: c.bancoOrdenanteExtranjero,
    banco_rfc: c.bancoRfc,
    banco_no_cuenta: c.bancoNoCuenta,
  };
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
    activa: row.activa as boolean,
    rentada: row.rentada as boolean,
    esPermisionario: row.es_permisionario as boolean,
    descripcion: row.descripcion as string,
    sucursal: row.sucursal as string,
    identidadSatelital: row.identidad_satelital as string,
    identificadorConvoy: row.identificador_convoy as string,
    numeroSerie: row.numero_serie as string,
    color: row.color as string,
    grupoUnidades: row.grupo_unidades as string,
    fotoDataUrl: row.foto_data_url as string,
    largoMetros: row.largo_metros as number,
    anchoMetros: row.ancho_metros as number,
    altoMetros: row.alto_metros as number,
    capacidadKg: row.capacidad_kg as number,
    numeroEjes: row.numero_ejes as number,
    pesoTaraTon: row.peso_tara_ton as number,
    tipoTransmision: row.tipo_transmision as string,
    tipoMotor: row.tipo_motor as string,
    tipoCombustible: row.tipo_combustible as string,
    tarjetaCombustible1: row.tarjeta_combustible_1 as string,
    tarjetaCombustible2: row.tarjeta_combustible_2 as string,
    tarjetaCombustible3: row.tarjeta_combustible_3 as string,
    capacidadTanqueLts: row.capacidad_tanque_lts as number,
    rendimientoCargadoKmLt: row.rendimiento_cargado_km_lt as number,
    rendimientoVacioKmLt: row.rendimiento_vacio_km_lt as number,
    documentosVencimiento: (row.documentos_vencimiento as Unidad['documentosVencimiento'] | null) ?? [],
    archivosAdicionales: (row.archivos_adicionales as Unidad['archivosAdicionales'] | null) ?? [],
    aseguradora: row.aseguradora as string,
    noPoliza: row.no_poliza as string,
    vigenciaDesde: (row.vigencia_desde as string | null) ?? '',
    vigenciaHasta: (row.vigencia_hasta as string | null) ?? '',
    propietario: (row.propietario as string | null) ?? '',
    ubicacion: (row.ubicacion as string | null) ?? '',
    estadoCarga: ((row.estado_carga as string | null) ?? 'Vacio') as Unidad['estadoCarga'],
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
    activa: u.activa,
    rentada: u.rentada,
    es_permisionario: u.esPermisionario,
    descripcion: u.descripcion,
    sucursal: u.sucursal,
    identidad_satelital: u.identidadSatelital,
    identificador_convoy: u.identificadorConvoy,
    numero_serie: u.numeroSerie,
    color: u.color,
    grupo_unidades: u.grupoUnidades,
    foto_data_url: u.fotoDataUrl,
    largo_metros: u.largoMetros,
    ancho_metros: u.anchoMetros,
    alto_metros: u.altoMetros,
    capacidad_kg: u.capacidadKg,
    numero_ejes: u.numeroEjes,
    peso_tara_ton: u.pesoTaraTon,
    tipo_transmision: u.tipoTransmision,
    tipo_motor: u.tipoMotor,
    tipo_combustible: u.tipoCombustible,
    tarjeta_combustible_1: u.tarjetaCombustible1,
    tarjeta_combustible_2: u.tarjetaCombustible2,
    tarjeta_combustible_3: u.tarjetaCombustible3,
    capacidad_tanque_lts: u.capacidadTanqueLts,
    rendimiento_cargado_km_lt: u.rendimientoCargadoKmLt,
    rendimiento_vacio_km_lt: u.rendimientoVacioKmLt,
    documentos_vencimiento: u.documentosVencimiento,
    archivos_adicionales: u.archivosAdicionales,
    aseguradora: u.aseguradora,
    no_poliza: u.noPoliza,
    vigencia_desde: u.vigenciaDesde || null,
    vigencia_hasta: u.vigenciaHasta || null,
    propietario: u.propietario,
    ubicacion: u.ubicacion,
    estado_carga: u.estadoCarga,
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
    activa: row.activa as boolean,
    rentada: row.rentada as boolean,
    esPermisionario: row.es_permisionario as boolean,
    descripcion: row.descripcion as string,
    sucursal: row.sucursal as string,
    identidadSatelital: row.identidad_satelital as string,
    identificadorConvoy: row.identificador_convoy as string,
    numeroSerie: row.numero_serie as string,
    color: row.color as string,
    grupoUnidades: row.grupo_unidades as string,
    fotoDataUrl: row.foto_data_url as string,
    largoMetros: row.largo_metros as number,
    anchoMetros: row.ancho_metros as number,
    altoMetros: row.alto_metros as number,
    capacidadKg: row.capacidad_kg as number,
    numeroEjes: row.numero_ejes as number,
    pesoTaraTon: row.peso_tara_ton as number,
    documentosVencimiento: (row.documentos_vencimiento as Caja['documentosVencimiento'] | null) ?? [],
    archivosAdicionales: (row.archivos_adicionales as Caja['archivosAdicionales'] | null) ?? [],
    aseguradora: row.aseguradora as string,
    noPoliza: row.no_poliza as string,
    vigenciaDesde: (row.vigencia_desde as string | null) ?? '',
    vigenciaHasta: (row.vigencia_hasta as string | null) ?? '',
    propietario: (row.propietario as string | null) ?? '',
    ubicacion: (row.ubicacion as string | null) ?? '',
    estadoCarga: ((row.estado_carga as string | null) ?? 'Vacio') as Caja['estadoCarga'],
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
    activa: c.activa,
    rentada: c.rentada,
    es_permisionario: c.esPermisionario,
    descripcion: c.descripcion,
    sucursal: c.sucursal,
    identidad_satelital: c.identidadSatelital,
    identificador_convoy: c.identificadorConvoy,
    numero_serie: c.numeroSerie,
    color: c.color,
    grupo_unidades: c.grupoUnidades,
    foto_data_url: c.fotoDataUrl,
    largo_metros: c.largoMetros,
    ancho_metros: c.anchoMetros,
    alto_metros: c.altoMetros,
    capacidad_kg: c.capacidadKg,
    numero_ejes: c.numeroEjes,
    peso_tara_ton: c.pesoTaraTon,
    documentos_vencimiento: c.documentosVencimiento,
    archivos_adicionales: c.archivosAdicionales,
    aseguradora: c.aseguradora,
    no_poliza: c.noPoliza,
    vigencia_desde: c.vigenciaDesde || null,
    vigencia_hasta: c.vigenciaHasta || null,
    propietario: c.propietario,
    ubicacion: c.ubicacion,
    estado_carga: c.estadoCarga,
  };
}

export function destinatarioFromRow(row: Record<string, unknown>): Destinatario {
  return {
    id: row.id as string,
    numero: row.numero as string,
    rfc: row.rfc as string,
    noEquivalencia: row.no_equivalencia as string,
    nombre: row.nombre as string,
    estatus: row.estatus as Destinatario['estatus'],
    esPatio: row.es_patio as boolean,
    clienteId: (row.cliente_id as string | null) ?? undefined,
    pais: row.pais as string,
    estado: row.estado as string,
    municipio: row.municipio as string,
    cp: row.cp as string,
    localidad: row.localidad as string,
    colonia: row.colonia as string,
    calle: row.calle as string,
    numeroExterior: row.numero_exterior as string,
    numeroInterior: row.numero_interior as string,
    telefono: row.telefono as string,
    contacto: row.contacto as string,
    correo: row.correo as string,
  };
}
export function destinatarioToRow(d: Destinatario) {
  return {
    id: d.id,
    numero: d.numero || null,
    rfc: d.rfc,
    no_equivalencia: d.noEquivalencia,
    nombre: d.nombre,
    estatus: d.estatus,
    es_patio: d.esPatio,
    cliente_id: d.clienteId ?? null,
    pais: d.pais,
    estado: d.estado,
    municipio: d.municipio,
    cp: d.cp,
    localidad: d.localidad,
    colonia: d.colonia,
    calle: d.calle,
    numero_exterior: d.numeroExterior,
    numero_interior: d.numeroInterior,
    telefono: d.telefono,
    contacto: d.contacto,
    correo: d.correo,
  };
}

export function operadorFromRow(row: Record<string, unknown>): Operador {
  return {
    id: row.id as string,
    numero: row.numero as string,
    nombre: row.nombre as string,
    nombres: row.nombres as string,
    apellidoPaterno: row.apellido_paterno as string,
    apellidoMaterno: row.apellido_materno as string,
    activo: row.activo as boolean,
    esPermisionario: row.es_permisionario as boolean,
    esExtranjero: row.es_extranjero as boolean,
    rfc: row.rfc as string,
    curp: row.curp as string,
    fechaContratacion: (row.fecha_contratacion as string | null) ?? '',
    sucursal: row.sucursal as string,
    telefono: row.telefono as string,
    celular: row.celular as string,
    hashGmtgps: row.hash_gmtgps as string,
    registroPatronal: row.registro_patronal as string,
    fotoDataUrl: row.foto_data_url as string,
    observaciones: row.observaciones as string,
    pais: row.pais as string,
    estado: row.estado as string,
    municipio: row.municipio as string,
    localidad: row.localidad as string,
    cp: row.cp as string,
    colonia: row.colonia as string,
    calle: row.calle as string,
    numeroExterior: row.numero_exterior as string,
    numeroInterior: row.numero_interior as string,
    domicilioReferencia: row.domicilio_referencia as string,
    licencia: row.licencia as string,
    vigenciaLicencia: (row.vigencia_licencia as string | null) ?? '',
    pasaporte: row.pasaporte as string,
    vigenciaPasaporte: (row.vigencia_pasaporte as string | null) ?? '',
    licenciaB: row.licencia_b as boolean,
    licenciaC: row.licencia_c as boolean,
    licenciaE: row.licencia_e as boolean,
    noImss: row.no_imss as string,
    grupoSanguineo: row.grupo_sanguineo as string,
    alergias: row.alergias as string,
    diabetico: row.diabetico as boolean,
    hipertenso: row.hipertenso as boolean,
    documentos: (row.documentos as Operador['documentos'] | null) ?? [],
    vencimientos: (row.vencimientos as Operador['vencimientos'] | null) ?? [],
    banco: row.banco as string,
    cuentaClabe: row.cuenta_clabe as string,
    noTarjeta: row.no_tarjeta as string,
    estatus: row.estatus as Operador['estatus'],
    clasificacion: (row.clasificacion as string | null) ?? '',
  };
}
export function operadorToRow(o: Operador) {
  return {
    id: o.id,
    numero: o.numero || null,
    nombre: o.nombre,
    nombres: o.nombres,
    apellido_paterno: o.apellidoPaterno,
    apellido_materno: o.apellidoMaterno,
    activo: o.activo,
    es_permisionario: o.esPermisionario,
    es_extranjero: o.esExtranjero,
    rfc: o.rfc,
    curp: o.curp,
    fecha_contratacion: o.fechaContratacion || null,
    sucursal: o.sucursal,
    telefono: o.telefono,
    celular: o.celular,
    hash_gmtgps: o.hashGmtgps,
    registro_patronal: o.registroPatronal,
    foto_data_url: o.fotoDataUrl,
    observaciones: o.observaciones,
    pais: o.pais,
    estado: o.estado,
    municipio: o.municipio,
    localidad: o.localidad,
    cp: o.cp,
    colonia: o.colonia,
    calle: o.calle,
    numero_exterior: o.numeroExterior,
    numero_interior: o.numeroInterior,
    domicilio_referencia: o.domicilioReferencia,
    licencia: o.licencia,
    vigencia_licencia: o.vigenciaLicencia || null,
    pasaporte: o.pasaporte,
    vigencia_pasaporte: o.vigenciaPasaporte || null,
    licencia_b: o.licenciaB,
    licencia_c: o.licenciaC,
    licencia_e: o.licenciaE,
    no_imss: o.noImss,
    grupo_sanguineo: o.grupoSanguineo,
    alergias: o.alergias,
    diabetico: o.diabetico,
    hipertenso: o.hipertenso,
    documentos: o.documentos,
    vencimientos: o.vencimientos,
    banco: o.banco,
    cuenta_clabe: o.cuentaClabe,
    no_tarjeta: o.noTarjeta,
    estatus: o.estatus,
    clasificacion: o.clasificacion,
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
    ubicacionActual: (row.ubicacion_actual as string | null) ?? '',
    creadoEn: (row.creado_en as string | null) ?? undefined,
    sucursal: (row.sucursal as string | null) ?? '',
    loadNumber: (row.load_number as string | null) ?? '',
    moneda: (row.moneda as string | null) ?? 'PESOS',
    tipoCambio: (row.tipo_cambio as number | null) ?? 1,
    rutaCodigo: (row.ruta_codigo as string | null) ?? '',
    rutaDescripcion: (row.ruta_descripcion as string | null) ?? '',
    facturable: (row.facturable as boolean | null) ?? true,
    kilometros: (row.kilometros as number | null) ?? 0,
    item: (row.item as string | null) ?? '',
    planta: (row.planta as string | null) ?? '',
    convenio: (row.convenio as string | null) ?? '',
    candadoOficial: (row.candado_oficial as string | null) ?? '',
    estatusFecha: (row.estatus_fecha as string | null) ?? '',
    estatusHora: (row.estatus_hora as string | null) ?? '',
    fechaCarga: (row.fecha_carga as string | null) ?? '',
    horaCarga: (row.hora_carga as string | null) ?? '',
    cargarEn: (row.cargar_en as string | null) ?? '',
    identificador: (row.identificador as string | null) ?? '',
    fechaEntrega: (row.fecha_entrega as string | null) ?? '',
    horaEntregaReal: (row.hora_entrega_real as string | null) ?? '',
    descargarEn: (row.descargar_en as string | null) ?? '',
    remolque1Id: (row.remolque1_id as string | null) ?? undefined,
    dollyId: (row.dolly_id as string | null) ?? undefined,
    remolque2Id: (row.remolque2_id as string | null) ?? undefined,
    trayectos: (row.trayectos as Viaje['trayectos'] | null) ?? [],
    materialesCarga: (row.materiales_carga as Viaje['materialesCarga'] | null) ?? [],
    pesoCargaTotal: (row.peso_carga_total as number | null) ?? 0,
    pesoCargaUnidad: (row.peso_carga_unidad as string | null) ?? 'KILOGRAMOS',
    conceptosFacturacionViaje: (row.conceptos_facturacion_viaje as Viaje['conceptosFacturacionViaje'] | null) ?? [],
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
    ubicacion_actual: v.ubicacionActual,
    sucursal: v.sucursal,
    load_number: v.loadNumber,
    moneda: v.moneda,
    tipo_cambio: v.tipoCambio,
    ruta_codigo: v.rutaCodigo,
    ruta_descripcion: v.rutaDescripcion,
    facturable: v.facturable,
    kilometros: v.kilometros,
    item: v.item,
    planta: v.planta,
    convenio: v.convenio,
    candado_oficial: v.candadoOficial,
    estatus_fecha: v.estatusFecha || null,
    estatus_hora: v.estatusHora,
    fecha_carga: v.fechaCarga || null,
    hora_carga: v.horaCarga,
    cargar_en: v.cargarEn,
    identificador: v.identificador,
    fecha_entrega: v.fechaEntrega || null,
    hora_entrega_real: v.horaEntregaReal,
    descargar_en: v.descargarEn,
    remolque1_id: v.remolque1Id || null,
    dolly_id: v.dollyId || null,
    remolque2_id: v.remolque2Id || null,
    trayectos: v.trayectos,
    materiales_carga: v.materialesCarga,
    peso_carga_total: v.pesoCargaTotal,
    peso_carga_unidad: v.pesoCargaUnidad,
    conceptos_facturacion_viaje: v.conceptosFacturacionViaje,
  };
}

export function estatusViajeFromRow(row: Record<string, unknown>): EstatusViajeCustom {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    color: (row.color as string) || 'gray',
    activo: (row.activo as boolean | null) ?? true,
    esCarga: (row.es_carga as boolean | null) ?? false,
    esDescarga: (row.es_descarga as boolean | null) ?? false,
    esTerminoDescarga: (row.es_termino_descarga as boolean | null) ?? false,
  };
}
export function estatusViajeToRow(e: EstatusViajeCustom) {
  return {
    id: e.id,
    nombre: e.nombre,
    color: e.color,
    activo: e.activo,
    es_carga: e.esCarga,
    es_descarga: e.esDescarga,
    es_termino_descarga: e.esTerminoDescarga,
  };
}

export function estatusUnidadFromRow(row: Record<string, unknown>): EstatusUnidadCustom {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    color: (row.color as string) || 'gray',
    tipoEstatus: row.tipo_estatus as EstatusUnidadCustom['tipoEstatus'],
  };
}
export function estatusUnidadToRow(e: EstatusUnidadCustom) {
  return { id: e.id, nombre: e.nombre, color: e.color, tipo_estatus: e.tipoEstatus };
}

export function incidenciaViajeFromRow(row: Record<string, unknown>): IncidenciaViaje {
  return {
    id: row.id as string,
    viajeId: row.viaje_id as string,
    tipo: row.tipo as string,
    descripcion: (row.descripcion as string) ?? '',
    severidad: (row.severidad as IncidenciaViaje['severidad']) ?? 'Media',
    estatus: (row.estatus as IncidenciaViaje['estatus']) ?? 'Abierta',
    creadoEn: row.creado_en as string | undefined,
    resueltoEn: (row.resuelto_en as string | null) ?? undefined,
  };
}
export function incidenciaViajeToRow(i: IncidenciaViaje) {
  return {
    id: i.id,
    viaje_id: i.viajeId,
    tipo: i.tipo,
    descripcion: i.descripcion,
    severidad: i.severidad,
    estatus: i.estatus,
    resuelto_en: i.resueltoEn || null,
  };
}

export function mensajeViajeFromRow(row: Record<string, unknown>): MensajeViaje {
  return {
    id: row.id as string,
    viajeId: row.viaje_id as string,
    autor: (row.autor as string) ?? '',
    mensaje: (row.mensaje as string) ?? '',
    creadoEn: row.creado_en as string | undefined,
  };
}
export function mensajeViajeToRow(m: MensajeViaje) {
  return { id: m.id, viaje_id: m.viajeId, autor: m.autor, mensaje: m.mensaje };
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
    creadoEn: (row.creado_en as string | null) ?? undefined,
    tipo: (row.tipo as Factura['tipo']) || 'Concepto',
    viajeIds: (row.viaje_ids as string[] | null) ?? [],
    sucursal: (row.sucursal as string) ?? '',
    condicionesPago: (row.condiciones_pago as string) ?? 'CREDITO',
    formaPago: (row.forma_pago as string) ?? '',
    metodoPago: (row.metodo_pago as string) ?? 'PPD',
    usoCfdi: (row.uso_cfdi as string) ?? 'G03',
    tipoCambio: Number(row.tipo_cambio) || 1,
    referencia: (row.referencia as string) ?? '',
    solicitante: (row.solicitante as string) ?? '',
    lineas: (row.lineas as Factura['lineas'] | null) ?? [],
    subtotal: Number(row.subtotal) || 0,
    descuentoTotal: Number(row.descuento_total) || 0,
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
    tipo: f.tipo,
    viaje_ids: f.viajeIds,
    sucursal: f.sucursal,
    condiciones_pago: f.condicionesPago,
    forma_pago: f.formaPago,
    metodo_pago: f.metodoPago,
    uso_cfdi: f.usoCfdi,
    tipo_cambio: f.tipoCambio,
    referencia: f.referencia,
    solicitante: f.solicitante,
    lineas: f.lineas,
    subtotal: f.subtotal,
    descuento_total: f.descuentoTotal,
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
    empresaId: (row.empresa_id as string | null) ?? undefined,
  };
}
export function rolToRow(r: Rol) {
  const { empresaId, ...resto } = r;
  return { ...resto, ...(empresaId ? { empresa_id: empresaId } : {}) };
}

export function usuarioFromRow(row: Record<string, unknown>): Usuario {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    email: row.email as string,
    telefono: row.telefono as string,
    rolId: (row.rol_id as string | null) ?? '',
    estatus: row.estatus as Usuario['estatus'],
    empresaId: (row.empresa_id as string | null) ?? undefined,
    esSuperAdmin: (row.es_super_admin as boolean | null) ?? false,
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
    ...(u.empresaId ? { empresa_id: u.empresaId } : {}),
    ...(u.esSuperAdmin ? { es_super_admin: u.esSuperAdmin } : {}),
  };
}

export function empresaFromRow(row: Record<string, unknown>): Empresa {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    razonSocial: row.razon_social as string,
    rfc: row.rfc as string,
    direccion: row.direccion as string,
    telefono: row.telefono as string,
    email: row.email as string,
    sitioWeb: row.sitio_web as string,
    logoDataUrl: row.logo_data_url as string,
    estatus: (row.estatus as Empresa['estatus']) ?? 'activa',
    csfStoragePath: (row.csf_storage_path as string | null) ?? '',
    csfImportadaEn: (row.csf_importada_en as string | null) ?? undefined,
  };
}
export function empresaToRow(e: Empresa) {
  return {
    id: e.id,
    nombre: e.nombre,
    razon_social: e.razonSocial,
    rfc: e.rfc,
    direccion: e.direccion,
    telefono: e.telefono,
    email: e.email,
    sitio_web: e.sitioWeb,
    logo_data_url: e.logoDataUrl,
    estatus: e.estatus,
    csf_storage_path: e.csfStoragePath,
    csf_importada_en: e.csfImportadaEn ?? null,
  };
}

export function cuentaBancariaFromRow(row: Record<string, unknown>): CuentaBancaria {
  return {
    id: row.id as string,
    numero: row.numero as string,
    activa: row.activa as boolean,
    descripcion: row.descripcion as string,
    contabilizar: row.contabilizar as boolean,
    banco: row.banco as string,
    moneda: row.moneda as CuentaBancaria['moneda'],
  };
}
export function cuentaBancariaToRow(c: CuentaBancaria) {
  return {
    id: c.id,
    numero: c.numero,
    activa: c.activa,
    descripcion: c.descripcion,
    contabilizar: c.contabilizar,
    banco: c.banco,
    moneda: c.moneda,
  };
}

export function clasificacionViajeFromRow(row: Record<string, unknown>): ClasificacionViaje {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    clasificacion: row.clasificacion as string,
    activo: row.activo as boolean,
  };
}
export function clasificacionViajeToRow(c: ClasificacionViaje) {
  return { id: c.id, codigo: c.codigo || null, clasificacion: c.clasificacion, activo: c.activo };
}

export function clasificacionOperadorFromRow(row: Record<string, unknown>): ClasificacionOperador {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    clasificacion: row.clasificacion as string,
    activo: row.activo as boolean,
  };
}
export function clasificacionOperadorToRow(c: ClasificacionOperador) {
  return { id: c.id, codigo: c.codigo || null, clasificacion: c.clasificacion, activo: c.activo };
}

export function conceptoFacturacionFromRow(row: Record<string, unknown>): ConceptoFacturacion {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    concepto: row.concepto as string,
    activo: row.activo as boolean,
    traslados: (row.traslados as ConceptoFacturacion['traslados'] | null) ?? [],
    retenciones: (row.retenciones as ConceptoFacturacion['retenciones'] | null) ?? [],
    incluirCalculoIngresosLiquidacion: row.incluir_calculo_ingresos_liquidacion as boolean,
    incluirCalculoLiquidacionPorcentajeFlete: row.incluir_calculo_liquidacion_pct_flete as boolean,
    incluirReporteControlMovimientosInterterminal: row.incluir_reporte_cm_interterminal as boolean,
    incluirReporteControlMovimientosTransporteGasolina: row.incluir_reporte_cm_transporte_gasolina as boolean,
    claveProdServ: row.clave_prod_serv as string,
    claveProdServDescripcion: row.clave_prod_serv_descripcion as string,
    claveUnidad: row.clave_unidad as string,
    claveUnidadNombre: row.clave_unidad_nombre as string,
    unidadMedida: row.unidad_medida as string,
    noIdentificacion: row.no_identificacion as string,
    objetoImpuesto: row.objeto_impuesto as string,
  };
}
export function conceptoFacturacionToRow(c: ConceptoFacturacion) {
  return {
    id: c.id,
    codigo: c.codigo || null,
    concepto: c.concepto,
    activo: c.activo,
    traslados: c.traslados,
    retenciones: c.retenciones,
    incluir_calculo_ingresos_liquidacion: c.incluirCalculoIngresosLiquidacion,
    incluir_calculo_liquidacion_pct_flete: c.incluirCalculoLiquidacionPorcentajeFlete,
    incluir_reporte_cm_interterminal: c.incluirReporteControlMovimientosInterterminal,
    incluir_reporte_cm_transporte_gasolina: c.incluirReporteControlMovimientosTransporteGasolina,
    clave_prod_serv: c.claveProdServ,
    clave_prod_serv_descripcion: c.claveProdServDescripcion,
    clave_unidad: c.claveUnidad,
    clave_unidad_nombre: c.claveUnidadNombre,
    unidad_medida: c.unidadMedida,
    no_identificacion: c.noIdentificacion,
    objeto_impuesto: c.objetoImpuesto,
  };
}

export function rutaFromRow(row: Record<string, unknown>): Ruta {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    activo: row.activo as boolean,
    facturable: row.facturable as boolean,
    internacional: row.internacional as boolean,
    tipoOperacion: row.tipo_operacion as Ruta['tipoOperacion'],
    clienteId: (row.cliente_id as string | null) ?? undefined,
    descripcion: row.descripcion as string,
    origenId: (row.origen_id as string | null) ?? undefined,
    destinoId: (row.destino_id as string | null) ?? undefined,
    tipoUnidad: (row.tipo_unidad as string | null) ?? '',
    tipoViajeId: (row.tipo_viaje_id as string | null) ?? undefined,
    clasificacionId: (row.clasificacion_id as string | null) ?? undefined,
    origenDireccion: (row.origen_direccion as string | null) ?? '',
    destinoDireccion: (row.destino_direccion as string | null) ?? '',
    horas: (row.horas as number | null) ?? 0,
    eta: (row.eta as string | null) ?? '',
    kilometros: (row.kilometros as number | null) ?? 0,
    tipoTrayecto: (row.tipo_trayecto as Ruta['tipoTrayecto']) || 'Permanente',
    trayectoLiquidable: (row.trayecto_liquidable as boolean | null) ?? true,
    trazoRuta: (row.trazo_ruta as string | null) ?? '',
    trayectos: (row.trayectos as Ruta['trayectos'] | null) ?? [],
    conceptosFacturacion: (row.conceptos_facturacion as Ruta['conceptosFacturacion'] | null) ?? [],
    materialesCarga: (row.materiales_carga as Ruta['materialesCarga'] | null) ?? [],
  };
}
export function rutaToRow(r: Ruta) {
  return {
    id: r.id,
    codigo: r.codigo || null,
    activo: r.activo,
    facturable: r.facturable,
    internacional: r.internacional,
    tipo_operacion: r.tipoOperacion,
    cliente_id: r.clienteId || null,
    descripcion: r.descripcion,
    origen_id: r.origenId || null,
    destino_id: r.destinoId || null,
    tipo_unidad: r.tipoUnidad,
    tipo_viaje_id: r.tipoViajeId || null,
    clasificacion_id: r.clasificacionId || null,
    origen_direccion: r.origenDireccion,
    destino_direccion: r.destinoDireccion,
    horas: r.horas,
    eta: r.eta,
    kilometros: r.kilometros,
    tipo_trayecto: r.tipoTrayecto,
    trayecto_liquidable: r.trayectoLiquidable,
    trazo_ruta: r.trazoRuta,
    trayectos: r.trayectos,
    conceptos_facturacion: r.conceptosFacturacion,
    materiales_carga: r.materialesCarga,
  };
}

export function grupoUnidadFromRow(row: Record<string, unknown>): GrupoUnidad {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    nombre: row.nombre as string,
    color: row.color as string,
  };
}
export function grupoUnidadToRow(g: GrupoUnidad) {
  return { id: g.id, codigo: g.codigo || null, nombre: g.nombre, color: g.color };
}

export function tipoViajeFromRow(row: Record<string, unknown>): TipoViaje {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    tipoViaje: row.tipo_viaje as string,
    activo: row.activo as boolean,
  };
}
export function tipoViajeToRow(t: TipoViaje) {
  return { id: t.id, codigo: t.codigo || null, tipo_viaje: t.tipoViaje, activo: t.activo };
}

export function viajeUbicacionFromRow(row: Record<string, unknown>): ViajeUbicacion {
  return {
    id: row.id as string,
    viajeId: row.viaje_id as string,
    texto: row.texto as string,
    creadoEn: (row.creado_en as string | null) ?? undefined,
  };
}
export function viajeUbicacionToRow(u: ViajeUbicacion) {
  return { id: u.id, viaje_id: u.viajeId, texto: u.texto };
}

export function proveedorFromRow(row: Record<string, unknown>): Proveedor {
  return {
    id: row.id as string,
    numero: row.numero as string,
    fecha: (row.fecha as string | null) ?? '',
    estatus: row.estatus as Proveedor['estatus'],
    tipo: row.tipo as Proveedor['tipo'],
    rfc: row.rfc as string,
    nombre: row.nombre as string,
    nombreCorto: row.nombre_corto as string,
    esProveedorCombustible: row.es_proveedor_combustible as boolean,
    proveedorBienes: row.proveedor_bienes as boolean,
    proveedorServicios: row.proveedor_servicios as boolean,
    grupo: row.grupo as string,
    tipoOperacion: row.tipo_operacion as string,
    tipoTercero: row.tipo_tercero as string,
    shortNameSap: row.short_name_sap as string,
    pais: row.pais as string,
    estado: row.estado as string,
    cp: row.cp as string,
    municipio: row.municipio as string,
    colonia: row.colonia as string,
    localidad: row.localidad as string,
    calle: row.calle as string,
    numeroExterior: row.numero_exterior as string,
    numeroInterior: row.numero_interior as string,
    correo: row.correo as string,
    telefonos: row.telefonos as string,
    celular: row.celular as string,
    nextel: row.nextel as string,
    formaPago: row.forma_pago as string,
    diasCredito: row.dias_credito as number,
    limiteCreditoMxn: row.limite_credito_mxn as number,
    limiteCreditoUsd: row.limite_credito_usd as number,
    banco: row.banco as string,
    cuentaClabe: row.cuenta_clabe as string,
    noCuenta: row.no_cuenta as string,
    documentos: (row.documentos as Proveedor['documentos'] | null) ?? [],
  };
}
export function proveedorToRow(p: Proveedor) {
  return {
    id: p.id,
    numero: p.numero || null,
    fecha: p.fecha || null,
    estatus: p.estatus,
    tipo: p.tipo,
    rfc: p.rfc,
    nombre: p.nombre,
    nombre_corto: p.nombreCorto,
    es_proveedor_combustible: p.esProveedorCombustible,
    proveedor_bienes: p.proveedorBienes,
    proveedor_servicios: p.proveedorServicios,
    grupo: p.grupo,
    tipo_operacion: p.tipoOperacion,
    tipo_tercero: p.tipoTercero,
    short_name_sap: p.shortNameSap,
    pais: p.pais,
    estado: p.estado,
    cp: p.cp,
    municipio: p.municipio,
    colonia: p.colonia,
    localidad: p.localidad,
    calle: p.calle,
    numero_exterior: p.numeroExterior,
    numero_interior: p.numeroInterior,
    correo: p.correo,
    telefonos: p.telefonos,
    celular: p.celular,
    nextel: p.nextel,
    forma_pago: p.formaPago,
    dias_credito: p.diasCredito,
    limite_credito_mxn: p.limiteCreditoMxn,
    limite_credito_usd: p.limiteCreditoUsd,
    banco: p.banco,
    cuenta_clabe: p.cuentaClabe,
    no_cuenta: p.noCuenta,
    documentos: p.documentos,
  };
}

export function gastoViajeFromRow(row: Record<string, unknown>): GastoViaje {
  return {
    id: row.id as string,
    viajeId: row.viaje_id as string,
    operadorId: (row.operador_id as string) || undefined,
    tipo: row.tipo as string,
    concepto: row.concepto as string,
    proveedorId: (row.proveedor_id as string) || undefined,
    fecha: row.fecha as string,
    numeroReferencia: row.numero_referencia as string,
    moneda: row.moneda as string,
    monto: Number(row.monto) || 0,
    generaPasivo: row.genera_pasivo as boolean,
    notas: row.notas as string,
    estatus: (row.estatus as GastoViaje['estatus']) || 'Activo',
    combustibleTipo: (row.combustible_tipo as GastoViaje['combustibleTipo']) || undefined,
    litros: row.litros !== null && row.litros !== undefined ? Number(row.litros) : undefined,
    precioLitro: row.precio_litro !== null && row.precio_litro !== undefined ? Number(row.precio_litro) : undefined,
    creadoEn: row.creado_en as string | undefined,
  };
}
export function gastoViajeToRow(g: GastoViaje) {
  return {
    id: g.id,
    viaje_id: g.viajeId,
    operador_id: g.operadorId || null,
    tipo: g.tipo,
    concepto: g.concepto,
    proveedor_id: g.proveedorId || null,
    fecha: g.fecha,
    numero_referencia: g.numeroReferencia,
    moneda: g.moneda,
    monto: g.monto,
    genera_pasivo: g.generaPasivo,
    notas: g.notas,
    estatus: g.estatus,
    combustible_tipo: g.combustibleTipo || null,
    litros: g.litros ?? null,
    precio_litro: g.precioLitro ?? null,
  };
}

export function parqueNotaFromRow(row: Record<string, unknown>): ParqueNota {
  return {
    id: row.id as string,
    entidadTipo: row.entidad_tipo as ParqueNota['entidadTipo'],
    entidadId: row.entidad_id as string,
    texto: row.texto as string,
    creadoEn: row.creado_en as string | undefined,
  };
}
export function parqueNotaToRow(n: ParqueNota) {
  return { id: n.id, entidad_tipo: n.entidadTipo, entidad_id: n.entidadId, texto: n.texto };
}

export function parqueHistorialFromRow(row: Record<string, unknown>): ParqueHistorial {
  return {
    id: row.id as string,
    entidadTipo: row.entidad_tipo as ParqueHistorial['entidadTipo'],
    entidadId: row.entidad_id as string,
    campo: row.campo as string,
    valorAnterior: row.valor_anterior as string,
    valorNuevo: row.valor_nuevo as string,
    creadoEn: row.creado_en as string | undefined,
  };
}
export function parqueHistorialToRow(h: ParqueHistorial) {
  return {
    id: h.id,
    entidad_tipo: h.entidadTipo,
    entidad_id: h.entidadId,
    campo: h.campo,
    valor_anterior: h.valorAnterior,
    valor_nuevo: h.valorNuevo,
  };
}

export function formatoImpresionFromRow(row: Record<string, unknown>): FormatoImpresion {
  return {
    id: row.id as string,
    area: row.area as string,
    clave: row.clave as string,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string,
    activo: row.activo as boolean,
  };
}
export function formatoImpresionToRow(f: FormatoImpresion) {
  return { id: f.id, area: f.area, clave: f.clave, nombre: f.nombre, descripcion: f.descripcion, activo: f.activo };
}
