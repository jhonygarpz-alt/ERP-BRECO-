import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularDetalladoViajes, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function DetalladoViajesReportPage() {
  const { viajes, clientes, operadores, unidades, gastosViaje, rutas } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularDetalladoViajes(viajes.items, clientes.items, operadores.items, unidades.items, gastosViaje.items, rutas.items, filtro),
    [viajes.items, clientes.items, operadores.items, unidades.items, gastosViaje.items, rutas.items, filtro],
  );
  const totalKm = filas.reduce((acc, f) => acc + f.kilometros, 0);
  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
  const totalGastos = filas.reduce((acc, f) => acc + f.gastos, 0);
  const totalUtilidad = totalIngreso - totalGastos;

  function handleExportarExcel() {
    exportarExcel(
      'detallado-de-viajes',
      ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Kilometros', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus'],
      filas.map((f) => [
        f.folio,
        f.fecha,
        f.cliente,
        f.operador,
        f.unidad,
        f.origen,
        f.destino,
        f.kilometros,
        f.ingreso,
        f.gastos,
        f.utilidad,
        f.estatus,
      ]),
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
          Cada viaje del periodo con su cliente, operador, unidad, kilometros, ingreso facturado, gastos capturados en
          Gastos de Viaje y la utilidad resultante.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Kilometros', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus']}
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
          money(f.gastos),
          money(f.utilidad),
          f.estatus,
        ])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">
        {filas.length} viajes · {totalKm.toLocaleString('es-MX')} km · Ingreso {money(totalIngreso)} · Gastos {money(totalGastos)} · Utilidad{' '}
        {money(totalUtilidad)}
      </p>
    </div>
  );
}
