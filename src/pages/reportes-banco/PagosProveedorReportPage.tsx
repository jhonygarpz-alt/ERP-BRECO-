import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularPagosProveedor, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function PagosProveedorReportPage() {
  const { pagosProveedor, proveedores } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularPagosProveedor(pagosProveedor.items, proveedores.items, filtro),
    [pagosProveedor.items, proveedores.items, filtro],
  );
  const total = filas.filter((f) => f.estatus === 'Aplicado').reduce((acc, f) => acc + f.importe, 0);

  function handleExportarExcel() {
    exportarExcel(
      'pagos-a-proveedor',
      ['Folio', 'Fecha', 'Proveedor', 'Forma de Pago', 'Referencia', 'Importe', 'Estatus'],
      filas.map((f) => [f.folio, f.fecha, f.proveedor, f.formaPago, f.referencia, f.importe, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/pagos-proveedor?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">06. Pagos a Proveedor</h1>
        <p className="mt-1 text-sm text-ink-500">Pagos realizados a proveedores en el periodo seleccionado.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Proveedor', 'Forma de Pago', 'Referencia', 'Importe', 'Estatus']}
        rows={filas.map((f) => [f.folio, f.fecha, f.proveedor, f.formaPago, f.referencia, money(f.importe), f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} pagos · Total aplicado: {money(total)}
      </p>
    </div>
  );
}
