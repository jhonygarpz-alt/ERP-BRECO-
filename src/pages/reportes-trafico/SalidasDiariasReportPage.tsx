import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularSalidasDiarias, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { COLOR_MARCA } from '../../lib/chartColors';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function SalidasDiariasReportPage() {
  const { viajes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(() => calcularSalidasDiarias(viajes.items, filtro), [viajes.items, filtro]);
  const totalViajes = filas.reduce((acc, f) => acc + f.viajes, 0);
  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);

  function handleExportarExcel() {
    exportarExcel(
      'salidas-diarias-con-importes',
      ['Fecha', 'Viajes', 'Ingreso'],
      filas.map((f) => [f.fecha, f.viajes, f.ingreso]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/salidas-diarias?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">03. Salidas Diarias con Importes</h1>
        <p className="mt-1 text-sm text-ink-500">Numero de viajes e ingreso facturado, agrupado por dia.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {filas.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">Ingreso por dia</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filas} margin={{ left: 8, right: 24 }}>
              <CartesianGrid vertical={false} stroke="var(--color-line-800)" />
              <XAxis dataKey="fecha" tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => money(v)} tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Bar dataKey="ingreso" fill={COLOR_MARCA} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla headers={['Fecha', 'Viajes', 'Ingreso']} rows={filas.map((f) => [f.fecha, f.viajes, money(f.ingreso)])} />
      <p className="mt-3 text-right text-sm text-ink-500">
        {totalViajes} viajes · Total: {money(totalIngreso)}
      </p>
    </div>
  );
}
