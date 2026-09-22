import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularIngresosPorOperador, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { COLOR_MARCA } from '../../lib/chartColors';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function IngresosPorOperadorReportPage() {
  const { viajes, operadores } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularIngresosPorOperador(viajes.items, operadores.items, filtro),
    [viajes.items, operadores.items, filtro],
  );
  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
  const datosGrafica = filas.slice(0, 15);

  function handleExportarExcel() {
    exportarExcel(
      'ingresos-por-operador',
      ['Operador', 'Viajes', 'Ingreso'],
      filas.map((f) => [f.operador, f.viajes, f.ingreso]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/ingresos-operador?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">07. Ingresos por Operador</h1>
        <p className="mt-1 text-sm text-ink-500">
          Suma de los conceptos de facturacion de los viajes (no cancelados) de cada operador en el periodo.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {datosGrafica.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">
            Top {datosGrafica.length} operadores por ingreso
          </p>
          <ResponsiveContainer width="100%" height={Math.max(220, datosGrafica.length * 34)}>
            <BarChart data={datosGrafica} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-line-800)" />
              <XAxis type="number" tickFormatter={(v) => money(v)} tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="operador" width={160} tick={{ fill: 'var(--color-ink-300)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Bar dataKey="ingreso" fill={COLOR_MARCA} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Operador', 'Viajes', 'Ingreso']}
        rows={filas.map((f) => [f.operador, f.viajes, money(f.ingreso)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">Total del periodo: {money(totalIngreso)}</p>
    </div>
  );
}
