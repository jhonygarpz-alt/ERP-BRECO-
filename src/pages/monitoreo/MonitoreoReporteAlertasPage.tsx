import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { calcularReporteAlertas } from '../../lib/monitoreoReportes';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function MonitoreoReporteAlertasPage() {
  const { viajes, rutas, viajeUbicaciones } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularReporteAlertas(viajes.items, rutas.items, viajeUbicaciones.items, filtro, new Date()),
    [viajes.items, rutas.items, viajeUbicaciones.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'historial-de-alertas',
      ['Folio', 'Fecha', 'Tipo', 'Mensaje', 'Detalle'],
      filas.map((f) => [f.folio, f.fecha, f.tipo, f.mensaje, f.detalle]),
    );
  }

  function handleImprimir() {
    window.open(`#/monitoreo/reportes/imprimir/alertas?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/monitoreo/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Monitoreo
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">Historial de Alertas</h1>
        <p className="mt-1 text-sm text-ink-500">
          Alertas activas al momento de generar el reporte, filtradas por cuando empezo su condicion.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Tipo', 'Mensaje', 'Detalle']}
        rows={filas.map((f) => [f.folio, f.fecha, f.tipo, f.mensaje, f.detalle])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} alertas en el periodo.</p>
    </div>
  );
}
