import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularAnticiposVsGastos, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function AnticiposVsGastosReportPage() {
  const { viajes, gastosViaje, clientes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularAnticiposVsGastos(viajes.items, gastosViaje.items, clientes.items, filtro),
    [viajes.items, gastosViaje.items, clientes.items, filtro],
  );
  const totalAnticipo = filas.reduce((acc, f) => acc + f.anticipo, 0);
  const totalGastos = filas.reduce((acc, f) => acc + f.totalGastos, 0);

  function handleExportarExcel() {
    exportarExcel(
      'anticipos-vs-gastos-por-viaje',
      ['Folio', 'Fecha', 'Cliente', 'Anticipo', 'Otros Gastos', 'Total Gastos', 'Diferencia'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.anticipo, f.otrosGastos, f.totalGastos, f.diferencia]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/anticipos-vs-gastos?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">20. Anticipos vs Gastos por Viaje</h1>
        <p className="mt-1 text-sm text-ink-500">
          Por cada viaje: cuanto se dio de anticipo/viaticos contra cuanto se gasto en total (el sistema no
          identifica el gasto por trayecto, solo por viaje completo).
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Anticipo', 'Otros Gastos', 'Total Gastos', 'Diferencia']}
        rows={filas.map((f) => [f.folio, f.fecha, f.cliente, money(f.anticipo), money(f.otrosGastos), money(f.totalGastos), money(f.diferencia)])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} viajes · Anticipo {money(totalAnticipo)} · Gastos {money(totalGastos)}
      </p>
    </div>
  );
}
