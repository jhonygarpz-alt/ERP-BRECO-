import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularIngresosEgresos, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { TONE_HEX } from '../../lib/chartColors';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function IngresosEgresosReportPage() {
  const { cuentasBancarias, movimientosBancarios } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularIngresosEgresos(cuentasBancarias.items, movimientosBancarios.items, filtro),
    [cuentasBancarias.items, movimientosBancarios.items, filtro],
  );
  const totalIngresos = filas.reduce((acc, f) => acc + f.ingresos, 0);
  const totalEgresos = filas.reduce((acc, f) => acc + f.egresos, 0);

  function handleExportarExcel() {
    exportarExcel(
      'ingresos-vs-egresos',
      ['Cuenta', 'Ingresos', 'Egresos', 'Neto', 'Movimientos'],
      filas.map((f) => [f.cuenta, f.ingresos, f.egresos, f.neto, f.movimientos]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/ingresos-egresos?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">03. Ingresos vs Egresos</h1>
        <p className="mt-1 text-sm text-ink-500">Ingresos y egresos de cada cuenta con movimientos en el periodo seleccionado.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {filas.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">Ingresos vs Egresos por cuenta</p>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill={TONE_HEX.green} radius={[0, 4, 4, 0]} />
              <Bar dataKey="egresos" name="Egresos" fill={TONE_HEX.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Cuenta', 'Ingresos', 'Egresos', 'Neto', 'Movimientos']}
        rows={filas.map((f) => [f.cuenta, money(f.ingresos), money(f.egresos), money(f.neto), f.movimientos])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        Total: Ingresos {money(totalIngresos)} · Egresos {money(totalEgresos)} · Neto {money(totalIngresos - totalEgresos)}
      </p>
    </div>
  );
}
