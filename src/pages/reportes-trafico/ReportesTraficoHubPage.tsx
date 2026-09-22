import { Link } from 'react-router-dom';
import {
  ListChecks,
  Receipt,
  CalendarClock,
  Fuel,
  BarChart3,
  Wallet,
  Users,
  Truck,
  Percent,
  Gauge,
  FileText,
  HandCoins,
  FileWarning,
  Activity,
  ClipboardCheck,
  ListOrdered,
  AlertTriangle,
  ClipboardList,
  Boxes,
  Scale,
  Timer,
  PackageCheck,
  Settings2,
  FileSpreadsheet,
  PieChart,
  type LucideIcon,
} from 'lucide-react';

interface ReporteInfo {
  numero: number;
  titulo: string;
  icon: LucideIcon;
  color: string;
  to?: string;
}

const REPORTES: ReporteInfo[] = [
  { numero: 1, titulo: 'Listado de Viajes', icon: ListChecks, color: '#3b82f6', to: '/trafico/reportes/listado-viajes' },
  { numero: 2, titulo: 'Viajes Pendientes de Facturar', icon: Receipt, color: '#10b981', to: '/trafico/reportes/pendientes-facturar' },
  { numero: 3, titulo: 'Salidas Diarias con Importes', icon: CalendarClock, color: '#f59e0b' },
  { numero: 4, titulo: 'Combustible Conciliado', icon: Fuel, color: '#ef4444' },
  { numero: 5, titulo: 'Ingresos Generados por Unidad', icon: BarChart3, color: '#f97316' },
  { numero: 6, titulo: 'Gastos de Viaje por Liquidacion', icon: Wallet, color: '#8b5cf6' },
  { numero: 7, titulo: 'Ingresos por Operador', icon: Users, color: '#ec4899', to: '/trafico/reportes/ingresos-operador' },
  { numero: 8, titulo: 'Viajes por Unidad', icon: Truck, color: '#06b6d4', to: '/trafico/reportes/viajes-unidad' },
  { numero: 9, titulo: 'Descuentos por Operador', icon: Percent, color: '#eab308' },
  { numero: 10, titulo: 'Rendimiento por Unidad', icon: Gauge, color: '#f59e0b' },
  { numero: 11, titulo: 'Detallado de Viajes', icon: FileText, color: '#10b981' },
  { numero: 12, titulo: 'Relacion de Anticipos', icon: HandCoins, color: '#ef4444' },
  { numero: 13, titulo: 'Cartas Porte a Revision', icon: FileWarning, color: '#8992a6' },
  { numero: 14, titulo: 'Estatus de Viajes', icon: Activity, color: '#3b82f6', to: '/trafico/reportes/estatus-viajes' },
  { numero: 15, titulo: 'Reporte de Liquidaciones', icon: ClipboardCheck, color: '#eab308' },
  { numero: 16, titulo: 'Listado de Viajes Concentrado', icon: ListOrdered, color: '#8b5cf6' },
  { numero: 17, titulo: 'Vencimientos de Unidades', icon: AlertTriangle, color: '#f59e0b' },
  { numero: 18, titulo: 'Relacion de Viajes para Uso de Trafico', icon: ClipboardList, color: '#06b6d4' },
  { numero: 19, titulo: 'Inventario de Equipo en Viajes', icon: Boxes, color: '#ec4899' },
  { numero: 20, titulo: 'Anticipos vs Gastos por Viaje/Trayecto', icon: Scale, color: '#8992a6' },
  { numero: 21, titulo: 'Just in Time Detallado', icon: Timer, color: '#3b82f6' },
  { numero: 22, titulo: 'Disponibilidad de Equipo', icon: Settings2, color: '#10b981' },
  { numero: 23, titulo: 'Reporte de Operaciones', icon: FileSpreadsheet, color: '#f97316' },
  { numero: 24, titulo: 'Relacion de Viajes a Facturar', icon: PackageCheck, color: '#ef4444' },
  { numero: 25, titulo: 'Resumen de Viajes por Estatus', icon: PieChart, color: '#8b5cf6' },
];

export function ReportesTraficoHubPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Reportes de Trafico</h1>
        <p className="mt-1 text-sm text-ink-500">Consulta y genera la informacion clave de tu operacion.</p>
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
