import { uid } from './storage';
import type { GastoViaje, LineaConciliacion, MovimientoBancario, PagoProveedor } from '../types';

/** Saldo actual de una cuenta: suma de todos sus movimientos activos (ingresos - egresos). Nunca se guarda. */
export function saldoCuenta(cuentaBancariaId: string, movimientos: MovimientoBancario[]): number {
  const saldo = movimientos
    .filter((m) => m.cuentaBancariaId === cuentaBancariaId && m.estatus === 'Activo')
    .reduce((acc, m) => acc + (m.tipo === 'Ingreso' ? m.importe : -m.importe), 0);
  return Math.round(saldo * 100) / 100;
}

export interface TotalesMovimientos {
  ingresos: number;
  egresos: number;
  movimientos: number;
}

export function totalesMovimientos(movimientos: MovimientoBancario[]): TotalesMovimientos {
  const activos = movimientos.filter((m) => m.estatus === 'Activo');
  return {
    ingresos: Math.round(activos.filter((m) => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.importe, 0) * 100) / 100,
    egresos: Math.round(activos.filter((m) => m.tipo === 'Egreso').reduce((acc, m) => acc + m.importe, 0) * 100) / 100,
    movimientos: activos.length,
  };
}

/** Saldo corrido de una cuenta a lo largo de TODA su historia (no solo el rango filtrado), como en un estado de cuenta real. */
export function saldosCorridosCuenta(cuentaBancariaId: string, movimientos: MovimientoBancario[]): Map<string, number> {
  const propios = movimientos
    .filter((m) => m.cuentaBancariaId === cuentaBancariaId && m.estatus === 'Activo')
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.creadoEn ?? '').localeCompare(b.creadoEn ?? ''));

  const saldos = new Map<string, number>();
  let saldo = 0;
  for (const m of propios) {
    saldo += m.tipo === 'Ingreso' ? m.importe : -m.importe;
    saldos.set(m.id, Math.round(saldo * 100) / 100);
  }
  return saldos;
}

export function nextFolioBanco(registros: { folio: string }[], prefijo: string): string {
  const max = registros.reduce((acc, r) => {
    const n = Number(r.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefijo}${String(max + 1).padStart(9, '0')}`;
}

/** Cuanto se le ha pagado a un gasto via pagos a proveedor ya aplicados (no cancelados). */
export function montoPagadoGasto(gastoId: string, pagos: PagoProveedor[]): number {
  return pagos
    .filter((p) => p.estatus === 'Aplicado')
    .flatMap((p) => p.aplicaciones)
    .filter((a) => a.gastoId === gastoId)
    .reduce((acc, a) => acc + a.importe, 0);
}

/** Saldo pendiente real de un gasto: monto - pagos aplicados. Nunca negativo. */
export function saldoGasto(gasto: GastoViaje, pagos: PagoProveedor[]): number {
  if (gasto.estatus === 'Cancelado') return 0;
  const saldo = gasto.monto - montoPagadoGasto(gasto.id, pagos);
  return Math.max(0, Math.round(saldo * 100) / 100);
}

export interface GastoConSaldo {
  gasto: GastoViaje;
  saldo: number;
}

/** Gastos de un proveedor que generan pasivo y todavia tienen saldo pendiente (para elegir en Cuentas por Pagar). */
export function gastosPendientesDePago(gastos: GastoViaje[], pagos: PagoProveedor[], proveedorId: string): GastoConSaldo[] {
  return gastos
    .filter((g) => g.proveedorId === proveedorId && g.generaPasivo && g.estatus !== 'Cancelado')
    .map((g) => ({ gasto: g, saldo: saldoGasto(g, pagos) }))
    .filter((gc) => gc.saldo > 0)
    .sort((a, b) => a.gasto.fecha.localeCompare(b.gasto.fecha));
}

function diferenciaDias(desdeIso: string, hastaIso: string): number {
  const [y1, m1, d1] = desdeIso.split('-').map(Number);
  const [y2, m2, d2] = hastaIso.split('-').map(Number);
  return Math.abs(Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000));
}

/**
 * Empareja cada renglon importado del banco con un Movimiento Bancario ya capturado en el
 * sistema: misma cuenta, mismo tipo, mismo importe (redondeado a centavos) y una fecha dentro
 * de la tolerancia. No compara contra el texto del banco (concepto/referencia pueden venir muy
 * distintos a como se capturaron en el sistema) -- solo importe + fecha, como se acordo.
 */
export function autoMatchConciliacion(
  lineasImportadas: Omit<LineaConciliacion, 'id' | 'movimientoBancarioId' | 'estatus'>[],
  movimientos: MovimientoBancario[],
  cuentaBancariaId: string,
  toleranciaDias = 3,
): LineaConciliacion[] {
  const candidatos = movimientos.filter(
    (m) => m.cuentaBancariaId === cuentaBancariaId && m.estatus === 'Activo' && !m.conciliado,
  );
  const usados = new Set<string>();

  return lineasImportadas.map((linea) => {
    const importeRedondeado = Math.round(Math.abs(linea.importe) * 100) / 100;
    const match = candidatos.find(
      (m) =>
        !usados.has(m.id) &&
        m.tipo === linea.tipo &&
        Math.round(m.importe * 100) / 100 === importeRedondeado &&
        diferenciaDias(m.fecha, linea.fecha) <= toleranciaDias,
    );
    if (match) usados.add(match.id);
    return {
      id: uid('lc'),
      ...linea,
      movimientoBancarioId: match?.id,
      estatus: match ? 'Conciliado' : 'Pendiente',
    };
  });
}

export interface ResumenConciliacion {
  conciliados: number;
  pendientes: number;
  sinCoincidencia: number;
  montoConciliado: number;
}

export function resumenConciliacion(lineas: LineaConciliacion[]): ResumenConciliacion {
  return {
    conciliados: lineas.filter((l) => l.estatus === 'Conciliado').length,
    pendientes: lineas.filter((l) => l.estatus === 'Pendiente').length,
    sinCoincidencia: lineas.filter((l) => l.estatus === 'Sin coincidencia').length,
    montoConciliado: Math.round(lineas.filter((l) => l.estatus === 'Conciliado').reduce((acc, l) => acc + Math.abs(l.importe), 0) * 100) / 100,
  };
}

export function nuevaConciliacionId() {
  return uid('con');
}
