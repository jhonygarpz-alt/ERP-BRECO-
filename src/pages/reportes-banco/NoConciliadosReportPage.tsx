import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularMovimientosNoConciliados, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function NoConciliadosReportPage() {
  const { movimientosBancarios, cuentasBancarias } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(90));

  const filas = useMemo(
    () => calcularMovimientosNoConciliados(movimientosBancarios.items, cuentasBancarias.items, filtro),
    [movimientosBancarios.items, cuentasBancarias.items, filtro],
  );
  const total = filas.reduce((acc, f) => acc + (f.tipo === 'Ingreso' ? f.importe : -f.importe), 0);

  function handleExportarExcel() {
    exportarExcel(
      'movimientos-no-conciliados',
      ['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Referencia', 'Importe'],
      filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.referencia, f.importe]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/no-conciliados?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">05. Movimientos No Conciliados</h1>
        <p className="mt-1 text-sm text-ink-500">Movimientos activos que todavia no se han emparejado en ninguna conciliacion.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Referencia', 'Importe']}
        rows={filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.referencia, money(f.importe)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} movimientos sin conciliar · Efecto neto: {money(total)}
      </p>
    </div>
  );
}
