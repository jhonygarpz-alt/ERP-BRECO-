import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularMovimientosBancarios, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function MovimientosBancariosReportPage() {
  const { movimientosBancarios, cuentasBancarias } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularMovimientosBancarios(movimientosBancarios.items, cuentasBancarias.items, filtro),
    [movimientosBancarios.items, cuentasBancarias.items, filtro],
  );
  const ingresos = filas.filter((f) => f.tipo === 'Ingreso').reduce((acc, f) => acc + f.importe, 0);
  const egresos = filas.filter((f) => f.tipo === 'Egreso').reduce((acc, f) => acc + f.importe, 0);

  function handleExportarExcel() {
    exportarExcel(
      'movimientos-bancarios',
      ['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Beneficiario', 'Referencia', 'Importe', 'Conciliado', 'Estatus'],
      filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.beneficiario, f.referencia, f.importe, f.conciliado, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/movimientos?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">01. Movimientos Bancarios</h1>
        <p className="mt-1 text-sm text-ink-500">Todos los movimientos de todas las cuentas en el periodo seleccionado.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Beneficiario', 'Referencia', 'Importe', 'Conciliado', 'Estatus']}
        rows={filas.map((f) => [f.fecha, f.cuenta, f.tipo, f.concepto, f.beneficiario, f.referencia, money(f.importe), f.conciliado, f.estatus])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} movimientos · Ingresos {money(ingresos)} · Egresos {money(egresos)}
      </p>
    </div>
  );
}
