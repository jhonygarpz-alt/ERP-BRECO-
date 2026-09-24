import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import {
  calcularConciliacionesHistorico,
  calcularIngresosEgresos,
  calcularMovimientosBancarios,
  calcularMovimientosNoConciliados,
  calcularPagosProveedor,
  calcularPasivosPendientesPorProveedor,
  calcularSaldosPorCuenta,
  money,
  rangoUltimosDias,
  type FiltroFechas,
} from '../../lib/reportesBanco';

const TITULOS: Record<string, string> = {
  movimientos: '01. Movimientos Bancarios',
  'saldos-por-cuenta': '02. Saldos por Cuenta',
  'ingresos-egresos': '03. Ingresos vs Egresos',
  conciliaciones: '04. Conciliaciones Bancarias',
  'no-conciliados': '05. Movimientos No Conciliados',
  'pagos-proveedor': '06. Pagos a Proveedor',
  'pasivos-proveedor': '07. Pasivos Pendientes por Proveedor',
};

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };

export function ImprimirReporteBancoPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const { movimientosBancarios, cuentasBancarias, conciliacionesBancarias, pagosProveedor, proveedores, gastosViaje, compras, empresa } = useData();

  const filtro: FiltroFechas = {
    desde: searchParams.get('desde') || rangoUltimosDias(30).desde,
    hasta: searchParams.get('hasta') || rangoUltimosDias(30).hasta,
  };

  const { headers, rows, notaTotal } = useMemo(() => {
    switch (tipo) {
      case 'movimientos': {
        const filas = calcularMovimientosBancarios(movimientosBancarios.items, cuentasBancarias.items, filtro);
        return {
          headers: ['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Beneficiario', 'Referencia', 'Importe', 'Conciliado', 'Estatus'],
          rows: filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.beneficiario, f.referencia, money(f.importe), f.conciliado, f.estatus]),
          notaTotal: `${filas.length} movimientos en el periodo.`,
        };
      }
      case 'saldos-por-cuenta': {
        const filas = calcularSaldosPorCuenta(cuentasBancarias.items, movimientosBancarios.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.saldoActual, 0);
        return {
          headers: ['Cuenta', 'Moneda', 'Ingresos del Periodo', 'Egresos del Periodo', 'Saldo Actual'],
          rows: filas.map((f) => [f.cuenta, f.moneda, money(f.ingresosPeriodo), money(f.egresosPeriodo), money(f.saldoActual)]),
          notaTotal: `Saldo total: ${money(total)}`,
        };
      }
      case 'ingresos-egresos': {
        const filas = calcularIngresosEgresos(cuentasBancarias.items, movimientosBancarios.items, filtro);
        const totalIngresos = filas.reduce((acc, f) => acc + f.ingresos, 0);
        const totalEgresos = filas.reduce((acc, f) => acc + f.egresos, 0);
        return {
          headers: ['Cuenta', 'Ingresos', 'Egresos', 'Neto', 'Movimientos'],
          rows: filas.map((f) => [f.cuenta, money(f.ingresos), money(f.egresos), money(f.neto), String(f.movimientos)]),
          notaTotal: `Ingresos: ${money(totalIngresos)} · Egresos: ${money(totalEgresos)} · Neto: ${money(totalIngresos - totalEgresos)}`,
        };
      }
      case 'conciliaciones': {
        const filas = calcularConciliacionesHistorico(conciliacionesBancarias.items, cuentasBancarias.items, filtro);
        return {
          headers: ['Fecha', 'Cuenta', 'Periodo', 'Archivo', 'Saldo Final Banco', 'Conciliados', 'Pendientes', 'Sin Coincidencia'],
          rows: filas.map((f) => [
            f.fecha,
            f.cuenta,
            f.periodo,
            f.archivo,
            money(f.saldoFinalBanco),
            String(f.conciliados),
            String(f.pendientes),
            String(f.sinCoincidencia),
          ]),
          notaTotal: `${filas.length} conciliaciones en el rango.`,
        };
      }
      case 'no-conciliados': {
        const filas = calcularMovimientosNoConciliados(movimientosBancarios.items, cuentasBancarias.items, filtro);
        return {
          headers: ['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Referencia', 'Importe'],
          rows: filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.referencia, money(f.importe)]),
          notaTotal: `${filas.length} movimientos sin conciliar.`,
        };
      }
      case 'pagos-proveedor': {
        const filas = calcularPagosProveedor(pagosProveedor.items, proveedores.items, filtro);
        const total = filas.filter((f) => f.estatus === 'Aplicado').reduce((acc, f) => acc + f.importe, 0);
        return {
          headers: ['Folio', 'Fecha', 'Proveedor', 'Forma de Pago', 'Referencia', 'Importe', 'Estatus'],
          rows: filas.map((f) => [f.folio, f.fecha, f.proveedor, f.formaPago, f.referencia, money(f.importe), f.estatus]),
          notaTotal: `Total aplicado: ${money(total)}`,
        };
      }
      case 'pasivos-proveedor': {
        const filas = calcularPasivosPendientesPorProveedor(proveedores.items, gastosViaje.items, compras.items, pagosProveedor.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.totalPendiente, 0);
        return {
          headers: ['Proveedor', 'Gastos de Viaje Pendientes', 'Compras Pendientes', 'Total Pendiente'],
          rows: filas.map((f) => [f.proveedor, money(f.gastosPendientes), money(f.comprasPendientes), money(f.totalPendiente)]),
          notaTotal: `Total pendiente: ${money(total)}`,
        };
      }
      default:
        return { headers: [], rows: [] as string[][], notaTotal: '' };
    }
  }, [
    tipo,
    movimientosBancarios.items,
    cuentasBancarias.items,
    conciliacionesBancarias.items,
    pagosProveedor.items,
    proveedores.items,
    gastosViaje.items,
    compras.items,
    filtro.desde,
    filtro.hasta,
  ]);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [tipo]);

  const titulo = (tipo && TITULOS[tipo]) || 'Reporte';

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif', fontSize: 13 }}>
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Imprimir
        </button>
        <button onClick={() => window.close()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Sistema de Bancos'}</h1>
            {empresa.value.rfc && <p style={{ margin: 0, color: '#555' }}>RFC: {empresa.value.rfc}</p>}
            {empresa.value.direccion && <p style={{ margin: 0, color: '#555' }}>{empresa.value.direccion}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{titulo}</h2>
          <p style={{ margin: 0, color: '#555' }}>
            Del {filtro.desde} al {filtro.hasta}
          </p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={td} colSpan={headers.length || 1}>
                Sin datos en el rango de fechas seleccionado.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {notaTotal && <p style={{ textAlign: 'right', margin: '8px 0 0', fontWeight: 600 }}>{notaTotal}</p>}
    </div>
  );
}
