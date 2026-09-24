import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularDetalladoViajes, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function DetalladoViajesReportPage() {
  const { viajes, clientes, operadores, unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularDetalladoViajes(viajes.items, clientes.items, operadores.items, unidades.items, filtro),
    [viajes.items, clientes.items, operadores.items, unidades.items, filtro],
  );
  const totalKm = filas.reduce((acc, f) => acc + f.kilometros, 0);
  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);

  function handleExportarExcel() {
    exportarExcel(
      'detallado-de-viajes',
      ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Kilometros', 'Ingreso', 'Estatus'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.operador, f.unidad, f.origen, f.destino, f.kilometros, f.ingreso, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/detallado-viajes?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">11. Detallado de Viajes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Cada viaje del periodo con su cliente, operador, unidad, kilometros e ingreso facturado.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Kilometros', 'Ingreso', 'Estatus']}
        rows={filas.map((f) => [
          f.folio,
          f.fecha,
          f.cliente,
          f.operador,
          f.unidad,
          f.origen,
          f.destino,
          f.kilometros.toLocaleString('es-MX'),
          money(f.ingreso),
          f.estatus,
        ])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} viajes · {totalKm.toLocaleString('es-MX')} km · Total: {money(totalIngreso)}
      </p>
    </div>
  );
}
