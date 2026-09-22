import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../../lib/DataContext';
import { calcularEstatusViajes, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { TONE_HEX } from '../../lib/chartColors';
import type { Tone } from '../../components/ui/Badge';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function EstatusViajesReportPage() {
  const { viajes, estatusViajes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(() => calcularEstatusViajes(viajes.items, filtro), [viajes.items, filtro]);
  const total = filas.reduce((acc, f) => acc + f.cantidad, 0);

  function colorDe(estatus: string): string {
    const tono = (estatusViajes.items.find((e) => e.nombre === estatus)?.color as Tone | undefined) ?? 'gray';
    return TONE_HEX[tono] ?? TONE_HEX.gray;
  }

  function handleExportarExcel() {
    exportarExcel(
      'estatus-de-viajes',
      ['Estatus', 'Cantidad', 'Porcentaje'],
      filas.map((f) => [f.estatus, f.cantidad, total > 0 ? `${((f.cantidad / total) * 100).toFixed(1)}%` : '0%']),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/estatus-viajes?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">14. Estatus de Viajes</h1>
        <p className="mt-1 text-sm text-ink-500">Distribucion de los viajes del periodo segun su estatus actual.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      {filas.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={filas} dataKey="cantidad" nameKey="estatus" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {filas.map((f) => (
                  <Cell key={f.estatus} fill={colorDe(f.estatus)} stroke="var(--color-bg-800)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} viajes`, name]}
                contentStyle={{ background: 'var(--color-bg-800)', border: '1px solid var(--color-line-700)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-ink-100)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-ink-300)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <ReporteTabla
        headers={['Estatus', 'Cantidad', 'Porcentaje']}
        rows={filas.map((f) => [f.estatus, f.cantidad, total > 0 ? `${((f.cantidad / total) * 100).toFixed(1)}%` : '0%'])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{total} viajes en el periodo.</p>
    </div>
  );
}
