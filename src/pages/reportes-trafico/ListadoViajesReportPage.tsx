import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularListadoViajes, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function ListadoViajesReportPage() {
  const { viajes, clientes, operadores, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularListadoViajes(viajes.items, clientes.items, operadores.items, unidades.items, filtro),
    [viajes.items, clientes.items, operadores.items, unidades.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'listado-de-viajes',
      ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Estatus'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.operador, f.unidad, f.origen, f.destino, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/listado-viajes?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">01. Listado de Viajes</h1>
        <p className="mt-1 text-sm text-ink-500">Todos los viajes capturados en el rango de fechas seleccionado.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Estatus']}
        rows={filas.map((f) => [f.folio, f.fecha, f.cliente, f.operador, f.unidad, f.origen, f.destino, f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} viajes en el periodo.</p>
    </div>
  );
}
