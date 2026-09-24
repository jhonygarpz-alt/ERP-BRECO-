import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularAnticiposOperador, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function AnticiposOperadorReportPage() {
  const { gastosViaje, viajes, operadores } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularAnticiposOperador(gastosViaje.items, viajes.items, operadores.items, filtro),
    [gastosViaje.items, viajes.items, operadores.items, filtro],
  );
  const total = filas.reduce((acc, f) => acc + f.monto, 0);

  function handleExportarExcel() {
    exportarExcel(
      'relacion-de-anticipos',
      ['Fecha', 'Viaje', 'Operador', 'Monto', 'Referencia'],
      filas.map((f) => [f.fecha, f.folioViaje, f.operador, f.monto, f.referencia]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/anticipos-operador?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">12. Relacion de Anticipos</h1>
        <p className="mt-1 text-sm text-ink-500">
          Gastos de Viaje capturados como "Viaticos / Anticipo" en el periodo, por operador.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Fecha', 'Viaje', 'Operador', 'Monto', 'Referencia']}
        rows={filas.map((f) => [f.fecha, f.folioViaje, f.operador, money(f.monto), f.referencia])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} anticipos · Total: {money(total)}
      </p>
    </div>
  );
}
