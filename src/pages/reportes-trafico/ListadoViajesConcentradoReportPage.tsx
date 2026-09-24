import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularListadoViajesConcentrado, money, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';

export function ListadoViajesConcentradoReportPage() {
  const { viajes, clientes, operadores, unidades, cajas, gastosViaje } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(
    () => calcularListadoViajesConcentrado(viajes.items, clientes.items, operadores.items, unidades.items, cajas.items, gastosViaje.items, filtro),
    [viajes.items, clientes.items, operadores.items, unidades.items, cajas.items, gastosViaje.items, filtro],
  );
  const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
  const totalGastos = filas.reduce((acc, f) => acc + f.gastos, 0);

  function handleExportarExcel() {
    exportarExcel(
      'listado-de-viajes-concentrado',
      ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Remolques', 'Origen', 'Destino', 'Kilometros', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus'],
      filas.map((f) => [
        f.folio,
        f.fecha,
        f.cliente,
        f.operador,
        f.unidad,
        f.remolques,
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
    window.open(`#/trafico/reportes/imprimir/viajes-concentrado?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">16. Listado de Viajes Concentrado</h1>
        <p className="mt-1 text-sm text-ink-500">
          Vista concentrada de cada viaje: cliente, operador, unidad, remolques, ruta, ingreso, gastos y utilidad en un
          solo renglon.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Remolques', 'Origen', 'Destino', 'Km', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus']}
        rows={filas.map((f) => [
          f.folio,
          f.fecha,
          f.cliente,
          f.operador,
          f.unidad,
          f.remolques,
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
        {filas.length} viajes · Ingreso {money(totalIngreso)} · Gastos {money(totalGastos)} · Utilidad {money(totalIngreso - totalGastos)}
      </p>
    </div>
  );
}
