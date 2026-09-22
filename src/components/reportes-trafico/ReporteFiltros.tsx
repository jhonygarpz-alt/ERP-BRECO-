import { Download, Printer } from 'lucide-react';
import type { FiltroFechas } from '../../lib/reportesTrafico';
import { rangoAnioActual, rangoHoy, rangoMesActual, rangoTodo, rangoUltimosDias } from '../../lib/reportesTrafico';
import { GhostButton, Input, PrimaryButton } from '../ui/form';

const PRESETS: { label: string; obtener: () => FiltroFechas }[] = [
  { label: 'Hoy', obtener: rangoHoy },
  { label: '7 dias', obtener: () => rangoUltimosDias(7) },
  { label: '30 dias', obtener: () => rangoUltimosDias(30) },
  { label: 'Este mes', obtener: rangoMesActual },
  { label: 'Este anio', obtener: rangoAnioActual },
  { label: 'Todo el historico', obtener: rangoTodo },
];

export function ReporteFiltros({
  filtro,
  onFiltroChange,
  onExportarExcel,
  onImprimir,
}: {
  filtro: FiltroFechas;
  onFiltroChange: (f: FiltroFechas) => void;
  onExportarExcel: () => void;
  onImprimir: () => void;
}) {
  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-line-800 bg-bg-800 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Desde</span>
          <Input type="date" value={filtro.desde} onChange={(e) => onFiltroChange({ ...filtro, desde: e.target.value })} />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Hasta</span>
          <Input type="date" value={filtro.hasta} onChange={(e) => onFiltroChange({ ...filtro, hasta: e.target.value })} />
        </div>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <GhostButton type="button" onClick={onExportarExcel}>
            <Download size={16} /> Exportar Excel
          </GhostButton>
          <PrimaryButton type="button" onClick={onImprimir}>
            <Printer size={16} /> Exportar PDF
          </PrimaryButton>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onFiltroChange(p.obtener())}
            className="rounded-full border border-line-700 bg-bg-900 px-3 py-1 text-xs text-ink-400 transition hover:border-breco-500 hover:text-ink-100"
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-600">Entre mas amplio el rango de fechas, mas completa la informacion del reporte.</p>
    </div>
  );
}
