// Calculos puros para los Reportes de Bancos: mismo patron que
// src/lib/reportesTrafico.ts -- cada funcion recibe las colecciones ya
// cargadas y un rango de fechas, y regresa filas listas para pantalla,
// Excel o PDF. Los helpers de rango de fechas y el formato de moneda se
// reutilizan de reportesTrafico.ts para no duplicarlos.
import type {
  Compra,
  ConciliacionBancaria,
  CuentaBancaria,
  GastoViaje,
  MovimientoBancario,
  PagoProveedor,
  Proveedor,
} from '../types';
import { comprasPendientesDePago, gastosPendientesDePago, resumenConciliacion, saldoCuenta, totalesMovimientos } from './banco';
import type { FiltroFechas } from './reportesTrafico';

export { money, rangoAnioActual, rangoHoy, rangoMesActual, rangoTodo, rangoUltimosDias, type FiltroFechas } from './reportesTrafico';

export function nombreCuenta(cuentas: CuentaBancaria[], id: string): string {
  const c = cuentas.find((x) => x.id === id);
  return c ? `${c.banco} · ${c.numero}` : '—';
}
export function nombreProveedor(proveedores: Proveedor[], id: string): string {
  return proveedores.find((p) => p.id === id)?.nombre ?? '—';
}

function enRango(fecha: string, filtro: FiltroFechas): boolean {
  return fecha >= filtro.desde && fecha <= filtro.hasta;
}

// ---- 01. Movimientos Bancarios ----
export interface FilaMovimientoBancario {
  fecha: string;
  cuenta: string;
  tipo: string;
  concepto: string;
  beneficiario: string;
  referencia: string;
  importe: number;
  conciliado: string;
  estatus: string;
}
export function calcularMovimientosBancarios(
  movimientos: MovimientoBancario[],
  cuentas: CuentaBancaria[],
  filtro: FiltroFechas,
): FilaMovimientoBancario[] {
  return movimientos
    .filter((m) => enRango(m.fecha, filtro))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.creadoEn ?? '').localeCompare(b.creadoEn ?? ''))
    .map((m) => ({
      fecha: m.fecha,
      cuenta: nombreCuenta(cuentas, m.cuentaBancariaId),
      tipo: m.tipo,
      concepto: m.concepto || '—',
      beneficiario: m.beneficiario || '—',
      referencia: m.referencia || '—',
      importe: m.importe,
      conciliado: m.conciliado ? 'Si' : 'No',
      estatus: m.estatus,
    }));
}

// ---- 02. Saldos por Cuenta ----
export interface FilaSaldoCuenta {
  cuenta: string;
  moneda: string;
  ingresosPeriodo: number;
  egresosPeriodo: number;
  saldoActual: number;
}
export function calcularSaldosPorCuenta(cuentas: CuentaBancaria[], movimientos: MovimientoBancario[], filtro: FiltroFechas): FilaSaldoCuenta[] {
  return cuentas
    .filter((c) => c.activa)
    .map((c) => {
      const propios = movimientos.filter((m) => m.cuentaBancariaId === c.id);
      const enPeriodo = totalesMovimientos(propios.filter((m) => enRango(m.fecha, filtro)));
      return {
        cuenta: `${c.banco} · ${c.numero}`,
        moneda: c.moneda,
        ingresosPeriodo: enPeriodo.ingresos,
        egresosPeriodo: enPeriodo.egresos,
        saldoActual: saldoCuenta(c.id, movimientos),
      };
    })
    .sort((a, b) => a.cuenta.localeCompare(b.cuenta));
}

// ---- 03. Ingresos vs Egresos ----
export interface FilaIngresoEgreso {
  cuenta: string;
  ingresos: number;
  egresos: number;
  neto: number;
  movimientos: number;
}
export function calcularIngresosEgresos(cuentas: CuentaBancaria[], movimientos: MovimientoBancario[], filtro: FiltroFechas): FilaIngresoEgreso[] {
  return cuentas
    .map((c) => {
      const enPeriodo = movimientos.filter((m) => m.cuentaBancariaId === c.id && enRango(m.fecha, filtro));
      const t = totalesMovimientos(enPeriodo);
      return { cuenta: `${c.banco} · ${c.numero}`, ingresos: t.ingresos, egresos: t.egresos, neto: t.ingresos - t.egresos, movimientos: t.movimientos };
    })
    .filter((f) => f.movimientos > 0)
    .sort((a, b) => b.neto - a.neto);
}

// ---- 04. Conciliaciones Bancarias (historico) ----
export interface FilaConciliacion {
  fecha: string;
  cuenta: string;
  periodo: string;
  archivo: string;
  saldoFinalBanco: number;
  conciliados: number;
  pendientes: number;
  sinCoincidencia: number;
}
export function calcularConciliacionesHistorico(
  conciliaciones: ConciliacionBancaria[],
  cuentas: CuentaBancaria[],
  filtro: FiltroFechas,
): FilaConciliacion[] {
  return conciliaciones
    .filter((c) => enRango(c.hasta, filtro))
    .slice()
    .sort((a, b) => b.hasta.localeCompare(a.hasta))
    .map((c) => {
      const r = resumenConciliacion(c.lineas);
      return {
        fecha: c.creadoEn?.slice(0, 10) || c.hasta,
        cuenta: nombreCuenta(cuentas, c.cuentaBancariaId),
        periodo: `${c.desde} al ${c.hasta}`,
        archivo: c.archivoNombre || '—',
        saldoFinalBanco: c.saldoFinalBanco,
        conciliados: r.conciliados,
        pendientes: r.pendientes,
        sinCoincidencia: r.sinCoincidencia,
      };
    });
}

// ---- 05. Movimientos No Conciliados ----
export interface FilaMovimientoNoConciliado {
  fecha: string;
  cuenta: string;
  tipo: string;
  concepto: string;
  referencia: string;
  importe: number;
}
export function calcularMovimientosNoConciliados(
  movimientos: MovimientoBancario[],
  cuentas: CuentaBancaria[],
  filtro: FiltroFechas,
): FilaMovimientoNoConciliado[] {
  return movimientos
    .filter((m) => m.estatus === 'Activo' && !m.conciliado && enRango(m.fecha, filtro))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => ({
      fecha: m.fecha,
      cuenta: nombreCuenta(cuentas, m.cuentaBancariaId),
      tipo: m.tipo,
      concepto: m.concepto || '—',
      referencia: m.referencia || '—',
      importe: m.importe,
    }));
}

// ---- 06. Pagos a Proveedor ----
export interface FilaPagoProveedor {
  folio: string;
  fecha: string;
  proveedor: string;
  formaPago: string;
  referencia: string;
  importe: number;
  estatus: string;
}
export function calcularPagosProveedor(pagos: PagoProveedor[], proveedores: Proveedor[], filtro: FiltroFechas): FilaPagoProveedor[] {
  return pagos
    .filter((p) => enRango(p.fecha, filtro))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio))
    .map((p) => ({
      folio: p.folio,
      fecha: p.fecha,
      proveedor: nombreProveedor(proveedores, p.proveedorId),
      formaPago: p.formaPago || '—',
      referencia: p.referencia || '—',
      importe: p.importe,
      estatus: p.estatus,
    }));
}

// ---- 07. Pasivos Pendientes por Proveedor ----
export interface FilaPasivoProveedor {
  proveedor: string;
  gastosPendientes: number;
  comprasPendientes: number;
  totalPendiente: number;
}
export function calcularPasivosPendientesPorProveedor(
  proveedores: Proveedor[],
  gastos: GastoViaje[],
  compras: Compra[],
  pagos: PagoProveedor[],
  filtro: FiltroFechas,
): FilaPasivoProveedor[] {
  const gastosCorte = gastos.filter((g) => g.fecha <= filtro.hasta);
  const comprasCorte = compras.filter((c) => c.fecha <= filtro.hasta);

  return proveedores
    .map((prov) => {
      const gastosPendientes = gastosPendientesDePago(gastosCorte, pagos, prov.id).reduce((acc, gc) => acc + gc.saldo, 0);
      const comprasPendientes = comprasPendientesDePago(comprasCorte, pagos, prov.id).reduce((acc, cc) => acc + cc.saldo, 0);
      return {
        proveedor: prov.nombre,
        gastosPendientes: Math.round(gastosPendientes * 100) / 100,
        comprasPendientes: Math.round(comprasPendientes * 100) / 100,
        totalPendiente: Math.round((gastosPendientes + comprasPendientes) * 100) / 100,
      };
    })
    .filter((f) => f.totalPendiente > 0)
    .sort((a, b) => b.totalPendiente - a.totalPendiente);
}
