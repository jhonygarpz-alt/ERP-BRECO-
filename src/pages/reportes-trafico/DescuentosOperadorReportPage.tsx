import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularDescuentosPorOperador, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { COLOR_MARCA } from '../../lib/chartColors';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function DescuentosOperadorReportPage() {
  const { abonosDescuentoOperador, descuentosOperador, operadores, deduccionesOperador } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularDescuentosPorOperador(abonosDescuentoOperador.items, descuentosOperador.items, operadores.items, deduccionesOperador.items, filtro),
    [abonosDescuentoOperador.items, descuentosOperador.items, operadores.items, deduccionesOperador.items, filtro],
  );
  const total = filas.reduce((acc, f) => acc + f.monto, 0);

  const porOperador = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const f of filas) mapa.set(f.operador, (mapa.get(f.operador) ?? 0) + f.monto);
    return Array.from(mapa.entries())
      .map(([operador, monto]) => ({ operador, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 15);
  }, [filas]);

  function handleExportarExcel() {
    exportarExcel(
      'descuentos-por-operador',
      ['Fecha', 'Operador', 'Folio Descuento', 'Deduccion', 'Monto'],
      filas.map((f) => [f.fecha, f.operador, f.folioDescuento, f.deduccion, f.monto]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/descuentos-operador?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">09. Descuentos por Operador</h1>
        <p className="mt-1 text-sm text-ink-500">
          Abonos aplicados a los descuentos/prestamos de cada operador (submodulo Descuentos a Operador) en el periodo.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {porOperador.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">Total descontado por operador</p>
          <ResponsiveContainer width="100%" height={Math.max(220, porOperador.length * 34)}>
            <BarChart data={porOperador} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-line-800)" />
              <XAxis type="number" tickFormatter={(v) => money(v)} tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="operador" width={160} tick={{ fill: 'var(--color-ink-300)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Bar dataKey="monto" fill={COLOR_MARCA} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Fecha', 'Operador', 'Folio Descuento', 'Deduccion', 'Monto']}
        rows={filas.map((f) => [f.fecha, f.operador, f.folioDescuento, f.deduccion, money(f.monto)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} abonos · Total: {money(total)}
      </p>
    </div>
  );
}
