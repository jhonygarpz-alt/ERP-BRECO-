import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularCartasPorteRevision, rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { StatCard } from '../../components/ui/StatCard';

export function CartasPorteRevisionReportPage() {
  const { viajes, clientes, unidades, operadores, cajas } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoUltimosDias(90));

  const filas = useMemo(
    () => calcularCartasPorteRevision(viajes.items, clientes.items, unidades.items, operadores.items, cajas.items, filtro),
    [viajes.items, clientes.items, unidades.items, operadores.items, cajas.items, filtro],
  );

  function handleExportarExcel() {
    exportarExcel(
      'cartas-porte-a-revision',
      ['Folio', 'Fecha', 'Cliente', 'Datos Faltantes', 'Detalle'],
      filas.map((f) => [f.folio, f.fecha, f.cliente, f.faltantesCount, f.faltantes]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/cartas-porte-revision?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">13. Cartas Porte a Revision</h1>
        <p className="mt-1 text-sm text-ink-500">
          Viajes de tipo Carta Porte a los que todavia les falta capturar datos obligatorios del complemento CFDI.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <div className="mb-4">
        <StatCard label="Cartas Porte con datos faltantes" value={String(filas.length)} icon={AlertTriangle} accent="amber" />
      </div>

      {filas.length === 0 ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
          Todas las Cartas Porte del periodo estan completas.
        </div>
      ) : (
        <div className="space-y-3">
          {filas.map((f) => (
            <div key={f.folio} className="rounded-2xl border border-line-800 bg-bg-800 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-100">
                  {f.folio} · {f.cliente}
                </p>
                <p className="text-xs text-ink-500">
                  {f.fecha} · {f.faltantesCount} faltante{f.faltantesCount === 1 ? '' : 's'}
                </p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-400">
                {f.faltantes.split('; ').map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
