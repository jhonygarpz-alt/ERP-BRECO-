import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularRendimientoPorUnidad, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function RendimientoPorUnidadReportPage() {
  const { viajes, gastosViaje, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularRendimientoPorUnidad(viajes.items, gastosViaje.items, unidades.items, filtro),
    [viajes.items, gastosViaje.items, unidades.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'rendimiento-por-unidad',
      ['Unidad', 'Kilometros', 'Litros', 'Rendimiento Real (km/l)', 'Rendimiento Config. Cargado', 'Rendimiento Config. Vacio'],
      filas.map((f) => [f.unidad, f.kilometros, f.litros, f.rendimientoReal, f.rendimientoConfigCargado, f.rendimientoConfigVacio]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/rendimiento-unidad?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">10. Rendimiento por Unidad</h1>
        <p className="mt-1 text-sm text-ink-500">
          Kilometros recorridos entre litros consumidos (rendimiento real), comparado contra el rendimiento
          configurado en el catalogo de Unidades.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Unidad', 'Kilometros', 'Litros', 'Rendimiento Real (km/l)', 'Config. Cargado', 'Config. Vacio']}
        rows={filas.map((f) => [
          f.unidad,
          f.kilometros.toLocaleString('es-MX'),
          f.litros.toLocaleString('es-MX'),
          f.rendimientoReal.toLocaleString('es-MX'),
          f.rendimientoConfigCargado.toLocaleString('es-MX'),
          f.rendimientoConfigVacio.toLocaleString('es-MX'),
        ])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} unidades con actividad en el periodo.</p>
    </div>
  );
}
