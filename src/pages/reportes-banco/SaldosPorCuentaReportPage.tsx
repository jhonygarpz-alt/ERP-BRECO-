import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularSaldosPorCuenta, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { COLOR_MARCA } from '../../lib/chartColors';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function SaldosPorCuentaReportPage() {
  const { cuentasBancarias, movimientosBancarios } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularSaldosPorCuenta(cuentasBancarias.items, movimientosBancarios.items, filtro),
    [cuentasBancarias.items, movimientosBancarios.items, filtro],
  );
  const totalSaldo = filas.reduce((acc, f) => acc + f.saldoActual, 0);

  function handleExportarExcel() {
    exportarExcel(
      'saldos-por-cuenta',
      ['Cuenta', 'Moneda', 'Ingresos del Periodo', 'Egresos del Periodo', 'Saldo Actual'],
      filas.map((f) => [f.cuenta, f.moneda, f.ingresosPeriodo, f.egresosPeriodo, f.saldoActual]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/saldos-por-cuenta?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">02. Saldos por Cuenta</h1>
        <p className="mt-1 text-sm text-ink-500">
          Saldo actual de cada cuenta activa (suma de todos sus movimientos), mas ingresos/egresos del periodo seleccionado.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {filas.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">Saldo actual por cuenta</p>
          <ResponsiveContainer width="100%" height={Math.max(220, filas.length * 34)}>
            <BarChart data={filas} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-line-800)" />
              <XAxis type="number" tickFormatter={(v) => money(v)} tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cuenta" width={140} tick={{ fill: 'var(--color-ink-300)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Bar dataKey="saldoActual" fill={COLOR_MARCA} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Cuenta', 'Moneda', 'Ingresos del Periodo', 'Egresos del Periodo', 'Saldo Actual']}
        rows={filas.map((f) => [f.cuenta, f.moneda, money(f.ingresosPeriodo), money(f.egresosPeriodo), money(f.saldoActual)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">Saldo total: {money(totalSaldo)}</p>
    </div>
  );
}
