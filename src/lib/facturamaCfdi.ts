import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';
import type { DatosTimbradoCfdi, Factura } from '../types';

async function invocar(body: Record<string, unknown>): Promise<Record<string, unknown> | { error: string }> {
  const { data, error } = await supabase.functions.invoke<Record<string, unknown>>('facturama-cfdi', { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo = await error.context.json();
        if (cuerpo?.error) return { error: cuerpo.error as string };
      } catch {
        // Sin cuerpo JSON legible -- se usa el mensaje generico de abajo.
      }
    }
    return { error: mensajeDeError(error) };
  }
  return data ?? { error: 'Sin respuesta del servidor.' };
}

/** Timbra una factura ante el PAC (Facturama). Arma el Complemento Carta Porte automaticamente si alguno de los viajes lo requiere. */
export async function timbrarFactura(
  datos: Omit<Factura, 'id'>,
): Promise<{ timbrado: DatosTimbradoCfdi } | { error: string }> {
  const resultado = await invocar({
    accion: 'timbrar',
    factura: {
      folio: datos.folio,
      fecha: datos.fecha,
      clienteId: datos.clienteId,
      moneda: datos.moneda,
      tipoCambio: datos.tipoCambio,
      usoCfdi: datos.usoCfdi,
      metodoPago: datos.metodoPago,
      formaPago: datos.formaPago,
      viajeIds: datos.viajeIds,
      lineas: datos.lineas.map((l) => ({
        concepto: l.concepto,
        unidadMedida: l.unidadMedida,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        importe: l.importe,
        conceptoFacturacionId: l.conceptoFacturacionId,
      })),
    },
  });
  if ('error' in resultado) return { error: resultado.error as string };
  return { timbrado: resultado.timbrado as DatosTimbradoCfdi };
}

/** Cancela ante el PAC el CFDI ya timbrado y regresa el DatosTimbradoCfdi actualizado (cancelado:true). */
export async function cancelarFacturaPac(
  timbrado: DatosTimbradoCfdi,
  motivo: string,
  folioSustituto: string,
): Promise<{ timbrado: DatosTimbradoCfdi } | { error: string }> {
  if (!timbrado.facturamaId) {
    return { error: 'Esta factura no tiene el identificador del PAC guardado; no se puede cancelar automaticamente.' };
  }
  const resultado = await invocar({
    accion: 'cancelar',
    facturamaId: timbrado.facturamaId,
    motivo,
    uuidReplacement: motivo === '01' ? folioSustituto : undefined,
  });
  if ('error' in resultado) return { error: resultado.error as string };
  return {
    timbrado: {
      ...timbrado,
      cancelado: true,
      motivoCancelacion: motivo,
      folioSustitutoCancelacion: folioSustituto,
      fechaCancelacion: new Date().toISOString().slice(0, 19),
    },
  };
}
