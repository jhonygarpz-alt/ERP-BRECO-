import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularInventarioEquipoEnViajes, rangoHoy, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function InventarioEquipoViajesReportPage() {
  const { viajes, unidades, cajas } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoHoy());

  const filas = useMemo(
    () => calcularInventarioEquipoEnViajes(viajes.items, unidades.items, cajas.items, filtro),
    [viajes.items, unidades.items, cajas.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'inventario-de-equipo-en-viajes',
      ['Folio', 'Fecha', 'Unidad', 'Remolque 1', 'Dolly', 'Remolque 2', 'Estatus'],
      filas.map((f) => [f.folio, f.fecha, f.unidad, f.remolque1, f.dolly, f.remolque2, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/inventario-equipo?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">19. Inventario de Equipo en Viajes</h1>
        <p className="mt-1 text-sm text-ink-500">Que remolques/dolly trae enganchados cada viaje del periodo.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Unidad', 'Remolque 1', 'Dolly', 'Remolque 2', 'Estatus']}
        rows={filas.map((f) => [f.folio, f.fecha, f.unidad, f.remolque1, f.dolly, f.remolque2, f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} viajes con equipo asignado.</p>
    </div>
  );
}
