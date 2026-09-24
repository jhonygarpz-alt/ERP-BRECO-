import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../lib/DataContext';
import { calcularGastosPorViaje, money, rangoUltimosDias, type FiltroFechas } from '../lib/reportesTrafico';
import { exportarExcel } from '../lib/exportarExcel';
import { TONE_HEX } from '../lib/chartColors';
import { ReporteFiltros } from '../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../components/reportes-trafico/ReporteTabla';
import { StatCard } from '../components/ui/StatCard';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export function GastosPorViajeDetalladoPage() {
  const { viajes, gastosViaje, clientes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularGastosPorViaje(viajes.items, gastosViaje.items, clientes.items, filtro),
    [viajes.items, gastosViaje.items, clientes.items, filtro],
  );

  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
  const totalGastos = filas.reduce((acc, f) => acc + f.gastos, 0);
  const totalUtilidad = totalIngreso - totalGastos;

  const datosGrafica = filas
    .slice()
    .sort((a, b) => b.ingreso - a.ingreso)
    .slice(0, 12)
    .map((f) => ({ viaje: f.folio, Ingreso: f.ingreso, Gastos: f.gastos, Utilidad: f.utilidad }));

  function handleExportarExcel() {
    exportarExcel(
      'detallado-gastos-por-viaje',
      ['Folio', 'Fecha', 'Cliente', 'Ingreso', 'Gastos', 'Utilidad'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.ingreso, f.gastos, f.utilidad]),
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">Detallado de Gastos por Viaje</h1>
        <p className="mt-1 text-sm text-ink-500">
          Por cada viaje: lo cobrado (conceptos de facturacion), los gastos capturados en Gastos de Viaje, y la utilidad que
          le queda a la empresa.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={() => window.print()} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Ingresos" value={money(totalIngreso)} icon={TrendingUp} accent="green" />
        <StatCard label="Total Gastos" value={money(totalGastos)} icon={TrendingDown} accent="red" />
        <StatCard label="Utilidad Neta" value={money(totalUtilidad)} icon={DollarSign} accent={totalUtilidad >= 0 ? 'blue' : 'red'} />
      </div>

      {datosGrafica.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">
            Ingreso vs Gastos -- top {datosGrafica.length} viajes por ingreso del periodo
          </p>
          <ResponsiveContainer width="100%" height={Math.max(260, datosGrafica.length * 30)}>
            <BarChart data={datosGrafica} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-line-800)" />
              <XAxis type="number" tickFormatter={(v) => money(v)} tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="viaje" width={90} tick={{ fill: 'var(--color-ink-300)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Ingreso" fill={TONE_HEX.green} radius={[0, 4, 4, 0]} />
              <Bar dataKey="Gastos" fill={TONE_HEX.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Ingreso', 'Gastos', 'Utilidad']}
        rows={filas.map((f) => [f.folio, f.fecha, f.cliente, money(f.ingreso), money(f.gastos), money(f.utilidad)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        Total del periodo: Ingreso {money(totalIngreso)} &middot; Gastos {money(totalGastos)} &middot; Utilidad {money(totalUtilidad)}
      </p>
    </div>
  );
}
