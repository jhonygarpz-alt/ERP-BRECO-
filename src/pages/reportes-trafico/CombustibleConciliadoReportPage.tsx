import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularCombustibleConciliado, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function CombustibleConciliadoReportPage() {
  const { gastosViaje, viajes, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularCombustibleConciliado(gastosViaje.items, viajes.items, unidades.items, filtro),
    [gastosViaje.items, viajes.items, unidades.items, filtro],
  );
  const conDescuadre = filas.filter((f) => !f.conciliado).length;

  function handleExportarExcel() {
    exportarExcel(
      'combustible-conciliado',
      ['Fecha', 'Unidad', 'Litros', 'Precio/Litro', 'Monto Calculado', 'Monto Capturado', 'Diferencia', 'Conciliado'],
      filas.map((f) => [f.fecha, f.unidad, f.litros, f.precioLitro, f.montoCalculado, f.montoCapturado, f.diferencia, f.conciliado ? 'Si' : 'No']),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/combustible-conciliado?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">04. Combustible Conciliado</h1>
        <p className="mt-1 text-sm text-ink-500">
          Compara, en cada carga de combustible capturada con litros y precio por litro, si el monto coincide con
          litros x precio -- para detectar errores de captura.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Fecha', 'Unidad', 'Litros', 'Precio/Litro', 'Monto Calculado', 'Monto Capturado', 'Diferencia', 'Conciliado']}
        rows={filas.map((f) => [
          f.fecha,
          f.unidad,
          f.litros.toLocaleString('es-MX'),
          money(f.precioLitro),
          money(f.montoCalculado),
          money(f.montoCapturado),
          money(f.diferencia),
          f.conciliado ? 'Si' : 'No',
        ])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} cargas de combustible · {conDescuadre} con descuadre
      </p>
    </div>
  );
}
