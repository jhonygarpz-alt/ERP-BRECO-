import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularConciliacionesHistorico, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesBanco';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function ConciliacionesReportPage() {
  const { conciliacionesBancarias, cuentasBancarias } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(90));

  const filas = useMemo(
    () => calcularConciliacionesHistorico(conciliacionesBancarias.items, cuentasBancarias.items, filtro),
    [conciliacionesBancarias.items, cuentasBancarias.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'conciliaciones-bancarias',
      ['Fecha', 'Cuenta', 'Periodo', 'Archivo', 'Saldo Final Banco', 'Conciliados', 'Pendientes', 'Sin Coincidencia'],
      filas.map((f) => [f.fecha, f.cuenta, f.periodo, f.archivo, f.saldoFinalBanco, f.conciliados, f.pendientes, f.sinCoincidencia]),
    );
  }

  function handleImprimir() {
    window.open(`#/banco/reportes/imprimir/conciliaciones?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/banco/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Bancos
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">04. Conciliaciones Bancarias</h1>
        <p className="mt-1 text-sm text-ink-500">Historico de conciliaciones cargadas, con su resultado de emparejamiento.</p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Fecha', 'Cuenta', 'Periodo', 'Archivo', 'Saldo Final Banco', 'Conciliados', 'Pendientes', 'Sin Coincidencia']}
        rows={filas.map((f) => [f.fecha, f.cuenta, f.periodo, f.archivo, money(f.saldoFinalBanco), f.conciliados, f.pendientes, f.sinCoincidencia])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} conciliaciones en el rango.</p>
    </div>
  );
}
