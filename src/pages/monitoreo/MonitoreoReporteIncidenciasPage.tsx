import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { calcularReporteIncidencias } from '../../lib/monitoreoReportes';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function MonitoreoReporteIncidenciasPage() {
  const { incidenciasViaje, viajes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(() => calcularReporteIncidencias(incidenciasViaje.items, viajes.items, filtro), [incidenciasViaje.items, viajes.items, filtro]);

  function handleExportarExcel() {
    exportarExcel(
      'incidencias-por-periodo',
      ['Folio', 'Fecha', 'Tipo', 'Descripcion', 'Severidad', 'Estatus'],
      filas.map((f) => [f.folio, f.fecha, f.tipo, f.descripcion, f.severidad, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/monitoreo/reportes/imprimir/incidencias?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/monitoreo/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Monitoreo
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">Incidencias por Periodo</h1>
        <p className="mt-1 text-sm text-ink-500">Todas las incidencias reportadas en el rango de fechas seleccionado.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Tipo', 'Descripcion', 'Severidad', 'Estatus']}
        rows={filas.map((f) => [f.folio, f.fecha, f.tipo, f.descripcion, f.severidad, f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} incidencias en el periodo.</p>
    </div>
  );
}
