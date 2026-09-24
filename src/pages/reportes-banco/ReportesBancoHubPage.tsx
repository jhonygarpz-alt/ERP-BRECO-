import { Link } from 'react-router-dom';
import { Landmark, Wallet, ArrowLeftRight, GitCompareArrows, FileWarning, Receipt, HandCoins, type LucideIcon } from 'lucide-react';

interface ReporteInfo {
  numero: number;
  titulo: string;
  icon: LucideIcon;
  color: string;
  to?: string;
}

const REPORTES: ReporteInfo[] = [
  { numero: 1, titulo: 'Movimientos Bancarios', icon: Landmark, color: '#3b82f6', to: '/banco/reportes/movimientos' },
  { numero: 2, titulo: 'Saldos por Cuenta', icon: Wallet, color: '#10b981', to: '/banco/reportes/saldos-por-cuenta' },
  { numero: 3, titulo: 'Ingresos vs Egresos', icon: ArrowLeftRight, color: '#f97316', to: '/banco/reportes/ingresos-egresos' },
  { numero: 4, titulo: 'Conciliaciones Bancarias', icon: GitCompareArrows, color: '#8b5cf6', to: '/banco/reportes/conciliaciones' },
  { numero: 5, titulo: 'Movimientos No Conciliados', icon: FileWarning, color: '#ef4444', to: '/banco/reportes/no-conciliados' },
  { numero: 6, titulo: 'Pagos a Proveedor', icon: Receipt, color: '#ec4899', to: '/banco/reportes/pagos-proveedor' },
  { numero: 7, titulo: 'Pasivos Pendientes por Proveedor', icon: HandCoins, color: '#eab308', to: '/banco/reportes/pasivos-proveedor' },
];

export function ReportesBancoHubPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Reportes de Bancos</h1>
        <p className="mt-1 text-sm text-ink-500">Consulta y genera la informacion clave de tus cuentas y pagos.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTES.map((r) => {
          const contenido = (
            <>
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${r.color}22`, color: r.color }}
              >
                <r.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink-600">{String(r.numero).padStart(2, '0')}</p>
                <p className="truncate text-sm font-medium text-ink-100">{r.titulo}</p>
                {!r.to && <p className="text-xs text-ink-600">Proximamente</p>}
              </div>
            </>
          );
          return r.to ? (
            <Link
              key={r.numero}
              to={r.to}
              className="flex items-center gap-3 rounded-2xl border border-line-800 bg-bg-800 p-4 transition hover:border-breco-500/50 hover:bg-bg-700/40"
            >
              {contenido}
            </Link>
          ) : (
            <div
              key={r.numero}
              className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-line-800 bg-bg-800/60 p-4 opacity-50"
            >
              {contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
