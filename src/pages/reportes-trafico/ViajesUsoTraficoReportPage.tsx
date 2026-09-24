import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularViajesUsoTrafico, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function ViajesUsoTraficoReportPage() {
  const { viajes, operadores, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(7));

  const filas = useMemo(
    () => calcularViajesUsoTrafico(viajes.items, operadores.items, unidades.items, filtro),
    [viajes.items, operadores.items, unidades.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'viajes-para-uso-de-trafico',
      ['Folio', 'Tramo', 'Fecha', 'Operador', 'Unidad', 'Origen', 'Destino', 'Cita', 'Hora Salida', 'Estatus'],
      filas.map((f) => [f.folio, f.trayectoNum, f.fecha, f.operador, f.unidad, f.origen, f.destino, f.cita, f.horaSalida, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/viajes-uso-trafico?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">18. Relacion de Viajes para Uso de Trafico</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manifiesto operativo: un renglon por cada tramo/trayecto a despachar (util cuando un viaje trae varios
          tramos u operadores en convoy).
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Tramo', 'Fecha', 'Operador', 'Unidad', 'Origen', 'Destino', 'Cita', 'Hora Salida', 'Estatus']}
        rows={filas.map((f) => [f.folio, f.trayectoNum, f.fecha, f.operador, f.unidad, f.origen, f.destino, f.cita, f.horaSalida, f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} tramos en el periodo.</p>
    </div>
  );
}
