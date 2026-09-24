import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularPasivosPendientesPorProveedor, money, rangoHoy, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function PasivosProveedorReportPage() {
  const { proveedores, gastosViaje, compras, pagosProveedor } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoHoy());

  const filas = useMemo(
    () => calcularPasivosPendientesPorProveedor(proveedores.items, gastosViaje.items, compras.items, pagosProveedor.items, filtro),
    [proveedores.items, gastosViaje.items, compras.items, pagosProveedor.items, filtro],
  );
  const total = filas.reduce((acc, f) => acc + f.totalPendiente, 0);

  function handleExportarExcel() {
    exportarExcel(
      'pasivos-pendientes-por-proveedor',
      ['Proveedor', 'Gastos de Viaje Pendientes', 'Compras Pendientes', 'Total Pendiente'],
      filas.map((f) => [f.proveedor, f.gastosPendientes, f.comprasPendientes, f.totalPendiente]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/pasivos-proveedor?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">07. Pasivos Pendientes por Proveedor</h1>
        <p className="mt-1 text-sm text-ink-500">
          Saldo pendiente de pago de cada proveedor (gastos de viaje y compras que generan pasivo) a la fecha de corte "Hasta".
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Proveedor', 'Gastos de Viaje Pendientes', 'Compras Pendientes', 'Total Pendiente']}
        rows={filas.map((f) => [f.proveedor, money(f.gastosPendientes), money(f.comprasPendientes), money(f.totalPendiente)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} proveedores con saldo pendiente · Total: {money(total)}
      </p>
    </div>
  );
}
