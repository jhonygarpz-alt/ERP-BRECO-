import { uid } from './storage';
import type { Cliente, Factura, FacturaLinea, Viaje } from '../types';

export function creditoDisponibleDeCliente(cliente: Cliente | undefined, facturas: Factura[]): number {
  if (!cliente) return 0;
  const saldoPendiente = facturas
    .filter((f) => f.clienteId === cliente.id && f.estatus !== 'Pagado' && f.estatus !== 'Cancelado')
    .reduce((acc, f) => acc + f.importe, 0);
  return cliente.limiteCreditoMxn - saldoPendiente;
}

/** Extrae el porcentaje de un texto tipo "IVA 16%" / "RETENCION IVA 4%" -> 0.16 / 0.04. */
export function porcentajeDeTexto(texto: string): number {
  const m = texto.match(/(\d+(\.\d+)?)\s*%/);
  return m ? Number(m[1]) / 100 : 0;
}

/** Convierte los conceptos ya capturados en un Viaje (pestana "Conceptos Facturacion") en renglones de Factura. */
export function lineasDesdeViaje(viaje: Viaje): FacturaLinea[] {
  return viaje.conceptosFacturacionViaje.map((c) => ({
    id: uid('fl'),
    conceptoFacturacionId: c.conceptoFacturacionId,
    concepto: c.concepto,
    unidadMedida: c.unidadMedida,
    cantidad: 1,
    precioUnitario: c.importe,
    descuento: 0,
    importe: c.importe,
    traslada: c.traslada,
    importeIva: c.importe * porcentajeDeTexto(c.traslada),
    retiene: c.retiene,
    importeRetencion: c.importeIsr,
  }));
}

/** Viajes que todavia no estan incluidos en ninguna factura activa (no cancelada), opcionalmente acotado a un cliente. */
export function viajesPendientesDeFacturar(viajes: Viaje[], facturas: Factura[], clienteId?: string): Viaje[] {
  const facturados = new Set<string>();
  facturas.forEach((f) => {
    if (f.estatus === 'Cancelado') return;
    const ids = f.viajeIds && f.viajeIds.length > 0 ? f.viajeIds : [f.viajeId];
    ids.forEach((id) => id && facturados.add(id));
  });
  return viajes
    .filter((v) => v.estatus.trim().toLowerCase() !== 'cancelado' && !facturados.has(v.id))
    .filter((v) => !clienteId || v.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export interface TotalesFactura {
  subtotal: number;
  descuentoTotal: number;
  totalIva: number;
  totalRetenciones: number;
  total: number;
}

export function calcularTotalesFactura(lineas: FacturaLinea[]): TotalesFactura {
  const subtotal = lineas.reduce((acc, l) => acc + l.importe, 0);
  const descuentoTotal = lineas.reduce((acc, l) => acc + l.descuento, 0);
  const totalIva = lineas.reduce((acc, l) => acc + l.importeIva, 0);
  const totalRetenciones = lineas.reduce((acc, l) => acc + l.importeRetencion, 0);
  return { subtotal, descuentoTotal, totalIva, totalRetenciones, total: subtotal - descuentoTotal + totalIva - totalRetenciones };
}

/** Siguiente folio consecutivo de 9 digitos, igual al formato ya usado en Viajes/Facturas del sistema de referencia. */
export function nextFolioFactura(facturas: Factura[]): string {
  const max = facturas.reduce((acc, f) => {
    const n = Number(f.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return String(max + 1).padStart(9, '0');
}
