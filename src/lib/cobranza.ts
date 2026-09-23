import { uid } from './storage';
import type { Cliente, Factura, NotaCredito, NotaCreditoLinea, PagoCliente } from '../types';

/** Cuanto se le ha abonado a una factura via pagos ya aplicados (no cancelados). */
export function abonosAplicadosAFactura(facturaId: string, pagos: PagoCliente[]): number {
  return pagos
    .filter((p) => p.estatus === 'Aplicado')
    .flatMap((p) => p.aplicaciones)
    .filter((a) => a.facturaId === facturaId)
    .reduce((acc, a) => acc + a.importe, 0);
}

/** Cuanto se le ha acreditado a una factura via notas de credito activas. */
export function notasCreditoAplicadasAFactura(facturaId: string, notas: NotaCredito[]): number {
  return notas
    .filter((n) => n.estatus === 'Activa' && n.facturaIds.includes(facturaId))
    .reduce((acc, n) => acc + n.total, 0);
}

/** Saldo pendiente real de una factura: importe - pagos aplicados - notas de credito aplicadas. Nunca negativo. */
export function saldoFactura(factura: Factura, pagos: PagoCliente[], notas: NotaCredito[]): number {
  if (factura.estatus === 'Cancelado') return 0;
  const saldo = factura.importe - abonosAplicadosAFactura(factura.id, pagos) - notasCreditoAplicadasAFactura(factura.id, notas);
  return Math.max(0, Math.round(saldo * 100) / 100);
}

export interface FacturaConSaldo {
  factura: Factura;
  saldo: number;
}

/** Facturas de un cliente que todavia tienen saldo pendiente (para elegir en Complementos de Pago). */
export function facturasPendientesDePago(facturas: Factura[], pagos: PagoCliente[], notas: NotaCredito[], clienteId: string): FacturaConSaldo[] {
  return facturas
    .filter((f) => f.clienteId === clienteId && f.estatus !== 'Cancelado')
    .map((f) => ({ factura: f, saldo: saldoFactura(f, pagos, notas) }))
    .filter((fc) => fc.saldo > 0)
    .sort((a, b) => a.factura.fecha.localeCompare(b.factura.fecha));
}

export interface TotalesNotaCredito {
  subtotal: number;
  totalIva: number;
  total: number;
}

export function calcularTotalesNotaCredito(lineas: NotaCreditoLinea[]): TotalesNotaCredito {
  const subtotal = lineas.reduce((acc, l) => acc + l.importe, 0);
  const totalIva = lineas.reduce((acc, l) => acc + l.importeIva, 0);
  return { subtotal, totalIva, total: subtotal + totalIva };
}

export function nextFolioCobranza(registros: { folio: string }[], prefijo: string): string {
  const max = registros.reduce((acc, r) => {
    const n = Number(r.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefijo}${String(max + 1).padStart(9, '0')}`;
}

export function nuevoPagoId() {
  return uid('pgo');
}

export interface MovimientoEstadoCuenta {
  fecha: string;
  tipo: 'Factura' | 'Pago' | 'Nota de Credito';
  documento: string;
  cargo: number;
  abono: number;
}

/** Movimientos de un cliente ordenados por fecha, con saldo corrido -- la base del Estado de Cuenta. */
export function estadoCuentaCliente(
  cliente: Cliente,
  facturas: Factura[],
  pagos: PagoCliente[],
  notas: NotaCredito[],
  desde: string,
  hasta: string,
): { movimientos: (MovimientoEstadoCuenta & { saldo: number })[]; saldoFinal: number } {
  const movimientos: MovimientoEstadoCuenta[] = [];

  facturas
    .filter((f) => f.clienteId === cliente.id && f.estatus !== 'Cancelado')
    .forEach((f) => movimientos.push({ fecha: f.fecha, tipo: 'Factura', documento: f.folio, cargo: f.importe, abono: 0 }));

  pagos
    .filter((p) => p.clienteId === cliente.id && p.estatus === 'Aplicado')
    .forEach((p) =>
      movimientos.push({
        fecha: p.fechaCobro,
        tipo: 'Pago',
        documento: p.folio,
        cargo: 0,
        abono: p.aplicaciones.reduce((acc, a) => acc + a.importe, 0),
      }),
    );

  notas
    .filter((n) => n.clienteId === cliente.id && n.estatus === 'Activa')
    .forEach((n) => movimientos.push({ fecha: n.fecha, tipo: 'Nota de Credito', documento: n.folio, cargo: 0, abono: n.total }));

  const enRango = movimientos.filter((m) => m.fecha >= desde && m.fecha <= hasta).sort((a, b) => a.fecha.localeCompare(b.fecha));

  let saldo = 0;
  const conSaldo = enRango.map((m) => {
    saldo += m.cargo - m.abono;
    return { ...m, saldo: Math.round(saldo * 100) / 100 };
  });

  return { movimientos: conSaldo, saldoFinal: Math.round(saldo * 100) / 100 };
}
