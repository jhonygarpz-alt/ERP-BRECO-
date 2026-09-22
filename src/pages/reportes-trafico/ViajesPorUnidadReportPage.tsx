import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularViajesPorUnidad, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function ViajesPorUnidadReportPage() {
  const { viajes, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(() => calcularViajesPorUnidad(viajes.items, unidades.items, filtro), [viajes.items, unidades.items, filtro]);
  const totalViajes = filas.reduce((acc, f) => acc + f.viajes, 0);
  const totalKm = filas.reduce((acc, f) => acc + f.kilometros, 0);

  function handleExportarExcel() {
    exportarExcel(
      'viajes-por-unidad',
      ['Unidad', 'Viajes', 'Kilometros'],
      filas.map((f) => [f.unidad, f.viajes, f.kilometros]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/viajes-unidad?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">08. Viajes por Unidad</h1>
        <p className="mt-1 text-sm text-ink-500">Numero de viajes (no cancelados) y kilometraje recorrido por cada unidad en el periodo.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Unidad', 'Viajes', 'Kilometros']}
        rows={filas.map((f) => [f.unidad, f.viajes, f.kilometros.toLocaleString('es-MX')])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {totalViajes} viajes · {totalKm.toLocaleString('es-MX')} km en el periodo.
      </p>
    </div>
  );
}
