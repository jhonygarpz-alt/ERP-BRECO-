import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularJustInTime, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';
import { StatCard } from '../../components/ui/StatCard';
import { CheckCircle2, XCircle } from 'lucide-react';

export function JustInTimeReportPage() {
  const { viajes, clientes } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(30));

  const filas = useMemo(() => calcularJustInTime(viajes.items, clientes.items, filtro), [viajes.items, clientes.items, filtro]);
  const cumplieron = filas.filter((f) => f.cumplio === true).length;
  const noCumplieron = filas.filter((f) => f.cumplio === false).length;

  function handleExportarExcel() {
    exportarExcel(
      'just-in-time-detallado',
      ['Folio', 'Fecha', 'Cliente', 'Cita', 'Hora Salida', 'Diferencia (min)', 'Cumplio'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.cita, f.horaSalida, f.diferenciaMin ?? '', f.cumplio ? 'Si' : 'No']),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/just-in-time?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">21. Just in Time Detallado</h1>
        <p className="mt-1 text-sm text-ink-500">
          Compara la Hora de Cita (programada) contra la Hora de Salida (real) de cada viaje, con tolerancia de 15
          minutos. El sistema solo captura este par programado/real para la salida -- no existe una cita programada
          de entrega para comparar contra la llegada real.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Salieron a tiempo" value={String(cumplieron)} icon={CheckCircle2} accent="green" />
        <StatCard label="Salieron tarde" value={String(noCumplieron)} icon={XCircle} accent="red" />
      </div>

      <ReporteTabla
        headers={['Folio', 'Fecha', 'Cliente', 'Cita', 'Hora Salida', 'Diferencia (min)', 'Cumplio']}
        rows={filas.map((f) => [
          f.folio,
          f.fecha,
          f.cliente,
          f.cita,
          f.horaSalida,
          f.diferenciaMin === null ? '—' : String(f.diferenciaMin),
          f.cumplio === null ? '—' : f.cumplio ? 'Si' : 'No',
        ])}
      />
      <p className="mt-3 text-right text-sm text-ink-500">{filas.length} viajes con cita y hora de salida capturadas.</p>
    </div>
  );
}
