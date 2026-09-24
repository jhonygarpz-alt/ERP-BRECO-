import type { Caja, Cliente, Operador, Unidad, Viaje } from '../types';

/**
 * Valida que un Viaje de tipo Carta Porte tenga los datos que exige el
 * complemento CFDI Carta Porte 3.1 antes de poder guardarse. Devuelve una
 * lista de mensajes "Falta capturar X" -- vacia si ya esta completo.
 */
export function validarCartaPorteCompleta(
  form: Omit<Viaje, 'id'>,
  cliente: Cliente | undefined,
  unidad: Unidad | undefined,
  operador: Operador | undefined,
  remolque1: Caja | undefined,
  remolque2: Caja | undefined,
): string[] {
  const faltantes: string[] = [];

  if (!form.clienteId || !cliente) {
    faltantes.push('Falta capturar Cliente');
  } else if (!cliente.rfc.trim()) {
    faltantes.push('Falta el RFC del Cliente');
  }

  if (!operador) {
    faltantes.push('Falta capturar Operador (Asignar Operador/Camion)');
  } else {
    if (!operador.rfc.trim()) faltantes.push('Falta el RFC del Operador');
    if (!operador.licencia.trim()) faltantes.push('Falta la Licencia del Operador');
  }

  if (!unidad) {
    faltantes.push('Falta capturar Camion/Unidad (Asignar Operador/Camion)');
  } else {
    if (!unidad.placas.trim()) faltantes.push('Faltan las Placas de la Unidad');
    if (!(form.configVehicularClaveSat || unidad.tipo)) faltantes.push('Falta la Configuracion Vehicular de la Unidad');
    if (!unidad.claveTipoPermisoSct.trim() || !unidad.numeroPermisoSct.trim() || !unidad.vigenciaPermisoSct.trim()) {
      faltantes.push('Falta el Permiso SCT de la Unidad (Tipo, Numero o Vigencia)');
    }
    if (!unidad.aseguradora.trim() || !unidad.noPoliza.trim()) {
      faltantes.push('Falta la Aseguradora o Numero de Poliza de la Unidad');
    }
    if (!unidad.pesoTaraTon) faltantes.push('Falta el Peso Tara de la Unidad');
  }

  [remolque1, remolque2].forEach((remolque, i) => {
    if (!remolque) return;
    const num = i + 1;
    if (!remolque.tipo.trim()) faltantes.push(`Falta el Subtipo de Remolque ${num}`);
    if (!remolque.placas.trim()) faltantes.push(`Faltan las Placas del Remolque ${num}`);
    if (!remolque.pesoTaraTon) faltantes.push(`Falta el Peso Tara del Remolque ${num}`);
  });

  if (form.materialesCarga.length === 0) {
    faltantes.push('Falta capturar Mercancias');
  } else {
    form.materialesCarga.forEach((m) => {
      const nombre = m.descripcion || 'sin descripcion';
      if (!m.claveProdServCP) faltantes.push(`Falta la Clave SAT de Producto/Servicio en la mercancia "${nombre}"`);
      if (!m.claveUnidadSat) faltantes.push(`Falta la Clave SAT de Unidad en la mercancia "${nombre}"`);
      if (!m.peso) faltantes.push(`Falta el Peso en la mercancia "${nombre}"`);
      if (m.materialPeligroso && !m.claveMaterialPeligroso) {
        faltantes.push(`Falta la Clave SAT de Material Peligroso en la mercancia "${nombre}" (marcada como peligrosa)`);
      }
    });
  }

  if (form.conceptosFacturacionViaje.length === 0) {
    faltantes.push('Falta capturar Conceptos de Facturacion (Cobro)');
  }

  if (!form.kilometros) faltantes.push('Falta la Distancia Recorrida (Kilometros)');
  if (!form.fechaCarga.trim() || !form.horaCarga.trim()) faltantes.push('Falta la Fecha/Hora de Salida (Carga)');
  if (!form.fechaEntrega.trim() || !form.horaEntregaReal.trim()) faltantes.push('Falta la Fecha/Hora de llegada (Entrega)');
  if (!form.origen.trim() && !form.cargarEn.trim()) faltantes.push('Falta el Origen (Cargar En)');
  if (!form.destino.trim() && !form.descargarEn.trim()) faltantes.push('Falta el Destino (Descargar En)');

  return faltantes;
}

/** Peso bruto vehicular (Ton): tara de la unidad + tara de los remolques + peso de la carga. */
export function pesoBrutoVehicular(
  unidad: Unidad | undefined,
  remolque1: Caja | undefined,
  remolque2: Caja | undefined,
  pesoCargaKg: number,
): number {
  const taraUnidad = unidad?.pesoTaraTon ?? 0;
  const taraRemolques = (remolque1?.pesoTaraTon ?? 0) + (remolque2?.pesoTaraTon ?? 0);
  return Math.round((taraUnidad + taraRemolques + pesoCargaKg / 1000) * 1000) / 1000;
}
