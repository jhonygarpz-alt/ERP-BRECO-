import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing } from 'lucide-react';

const REPORTES = [
  { titulo: 'Incidencias por Periodo', icon: AlertTriangle, color: '#ef4444', to: '/monitoreo/reportes/incidencias' },
  { titulo: 'Historial de Alertas', icon: BellRing, color: '#f59e0b', to: '/monitoreo/reportes/alertas' },
];

export function MonitoreoReportesHubPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Reportes de Monitoreo</h1>
        <p className="mt-1 text-sm text-ink-500">Incidencias y alertas generadas durante la operacion, filtrables por fecha.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTES.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="flex items-center gap-3 rounded-2xl border border-line-800 bg-bg-800 p-4 transition hover:border-breco-500/50 hover:bg-bg-700/40"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${r.color}22`, color: r.color }}>
              <r.icon size={20} />
            </div>
            <p className="text-sm font-medium text-ink-100">{r.titulo}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
