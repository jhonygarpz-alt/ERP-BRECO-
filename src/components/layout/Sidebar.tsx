import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Route,
  Receipt,
  Wallet,
  Truck,
  CalendarClock,
  FileSpreadsheet,
  BarChart3,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  ClipboardList,
  ListChecks,
  PieChart,
  PlaneTakeoff,
  Sun,
  Moon,
  Radar,
  Navigation,
  Map,
  AlertTriangle,
  BellRing,
  MessageSquare,
  FileBarChart,
  FileText,
  HandCoins,
  FileMinus,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { BrandName } from '../ui/BrandName';

function NavRow({
  to,
  end,
  label,
  icon: Icon,
  collapsed,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${collapsed ? 'justify-center px-0' : ''} ${
          isActive
            ? 'bg-breco-500 font-semibold text-white shadow-md shadow-breco-glow'
            : 'font-medium text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

function NavGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

/** Grupo colapsable del menu (Trafico/Monitoreo/Facturacion): un boton que
 * expande/contrae su lista de sub-paginas, resaltado si la ruta actual cae
 * dentro de "routes". Se abre solo si la ruta activa ya esta dentro del
 * grupo al cargar la pantalla. */
function NavCollapsibleGroup({
  label,
  icon: Icon,
  routes,
  links,
  collapsed,
  onExpandCollapsed,
}: {
  label: string;
  icon: LucideIcon;
  routes: string[];
  links: { to: string; label: string; icon: LucideIcon }[];
  collapsed: boolean;
  onExpandCollapsed: () => void;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(routes.some((r) => location.pathname.startsWith(r)));

  if (links.length === 0) return null;

  return (
    <NavGroup>
      <button
        onClick={() => (collapsed ? (onExpandCollapsed(), setOpen(true)) : setOpen((v) => !v))}
        title={collapsed ? label : undefined}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${collapsed ? 'justify-center px-0' : ''} ${
          routes.some((r) => location.pathname.startsWith(r))
            ? 'font-semibold text-sb-text'
            : 'font-medium text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text'
        }`}
      >
        <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown size={16} className={`text-sb-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="relative ml-5 space-y-1 border-l border-sb-border py-1 pl-4">
          {links.map((item) => (
            <div key={item.to} className="relative">
              <span className="absolute -left-[18px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sb-border" />
              <NavRow to={item.to} end={item.to === routes[0]} label={item.label} icon={item.icon} />
            </div>
          ))}
        </div>
      )}
    </NavGroup>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        className="flex w-full items-center justify-center rounded-xl border border-sb-border bg-sb-bg-active p-2.5 text-sb-text-muted hover:text-sb-text"
      >
        {isLight ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-blue-400" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-sb-border bg-sb-bg-active px-3 py-2.5"
      title="Cambiar tema"
    >
      <Sun size={16} className={isLight ? 'text-amber-500' : 'text-sb-text-muted'} />
      <span className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${isLight ? 'bg-sb-border' : 'bg-breco-500'}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isLight ? 'left-0.5' : 'left-[18px]'}`}
        />
      </span>
      <Moon size={16} className={!isLight ? 'text-blue-400' : 'text-sb-text-muted'} />
    </button>
  );
}

const traficoRoutes = ['/viajes', '/gastos-viaje', '/viajes-del-dia', '/aeropuerto', '/programa', '/trafico/reportes'];
const monitoreoRoutes = ['/monitoreo'];
const facturacionRoutes = ['/facturacion'];
const cobranzaRoutes = ['/cobranza'];

export function Sidebar() {
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('breco-sidebar-collapsed') === '1');

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('breco-sidebar-collapsed', c ? '0' : '1');
      return !c;
    });
  }

  const puedeCatalogos = hasPermission('Catalogos', 'ver');
  const puedeViajes = hasPermission('Viajes', 'ver');
  const puedeFacturacion = hasPermission('Facturacion', 'ver');
  const puedePrograma = hasPermission('Programa', 'ver');
  const puedeMonitoreo = hasPermission('Monitoreo', 'ver');
  const puedeCobranza = hasPermission('Cobranza', 'ver');
  const puedeReportes = hasPermission('Reportes', 'ver');
  const puedeConfiguracion = hasPermission('Configuracion', 'ver');

  const traficoLinks = [
    puedeViajes && { to: '/viajes', label: 'Asignacion de Viajes', icon: Route },
    puedeViajes && { to: '/gastos-viaje', label: 'Gastos de Viaje', icon: Wallet },
    puedeViajes && { to: '/viajes-del-dia', label: 'Viajes del Dia', icon: ListChecks },
    puedeViajes && { to: '/aeropuerto', label: 'Pantalla Aeropuerto', icon: PlaneTakeoff },
    puedePrograma && { to: '/programa', label: 'Programa Diario', icon: CalendarClock },
    puedeViajes && { to: '/trafico/reportes', label: 'Reportes', icon: PieChart },
  ].filter(Boolean) as { to: string; label: string; icon: LucideIcon }[];

  const monitoreoLinks: { to: string; label: string; icon: LucideIcon }[] = puedeMonitoreo
    ? [
        { to: '/monitoreo', label: 'Centro de Control', icon: Radar },
        { to: '/monitoreo/viajes', label: 'Monitoreo de Viajes', icon: Navigation },
        { to: '/monitoreo/mapa', label: 'Mapa GPS', icon: Map },
        { to: '/monitoreo/bitacora', label: 'Bitacora de Seguimiento', icon: ClipboardList },
        { to: '/monitoreo/incidencias', label: 'Incidencias', icon: AlertTriangle },
        { to: '/monitoreo/alertas', label: 'Alertas', icon: BellRing },
        { to: '/monitoreo/comunicacion', label: 'Comunicacion', icon: MessageSquare },
        { to: '/monitoreo/reportes', label: 'Reportes de Monitoreo', icon: FileBarChart },
      ]
    : [];

  const facturacionLinks: { to: string; label: string; icon: LucideIcon }[] = puedeFacturacion
    ? [
        { to: '/facturacion', label: 'Facturacion Diaria', icon: Receipt },
        { to: '/facturacion/por-viaje', label: 'Por Viaje', icon: Route },
        { to: '/facturacion/por-concepto', label: 'Por Concepto', icon: FileText },
      ]
    : [];

  const cobranzaLinks: { to: string; label: string; icon: LucideIcon }[] = puedeCobranza
    ? [
        { to: '/cobranza/complementos-pago', label: 'Complementos de Pago', icon: HandCoins },
        { to: '/cobranza/notas-credito', label: 'Notas de Credito', icon: FileMinus },
        { to: '/cobranza/estados-cuenta', label: 'Estados de Cuenta', icon: ScrollText },
      ]
    : [];

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col border-r border-sb-border bg-sb-bg transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className={`flex items-center gap-3 border-b border-sb-border px-5 py-5 ${collapsed ? 'justify-center px-3' : ''}`}>
        {empresa.value.logoDataUrl ? (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sb-bg-active">
            <img src={empresa.value.logoDataUrl} alt={empresa.value.nombre} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-breco-500 text-base font-black italic text-white shadow-md shadow-breco-glow">
            B
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold tracking-tight text-sb-text">
              <BrandName nombre={empresa.value.nombre} />
            </div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-breco-500">Trafico ERP</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-none px-3 py-4">
        <NavGroup>
          <NavRow to="/" end label="Resumen" icon={LayoutDashboard} collapsed={collapsed} />
        </NavGroup>

        {puedeCatalogos && (
          <NavGroup>
            <NavRow to="/catalogos" label="Catalogos" icon={Boxes} collapsed={collapsed} />
            <NavRow to="/parque-vehicular" label="Parque Vehicular" icon={Truck} collapsed={collapsed} />
          </NavGroup>
        )}

        <NavCollapsibleGroup
          label="Trafico"
          icon={Route}
          routes={traficoRoutes}
          links={traficoLinks}
          collapsed={collapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Monitoreo"
          icon={Radar}
          routes={monitoreoRoutes}
          links={monitoreoLinks}
          collapsed={collapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Facturacion"
          icon={Receipt}
          routes={facturacionRoutes}
          links={facturacionLinks}
          collapsed={collapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Cobranza"
          icon={HandCoins}
          routes={cobranzaRoutes}
          links={cobranzaLinks}
          collapsed={collapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        {puedeReportes && (
          <NavGroup>
            <NavRow to="/reportes" label="Reportes" icon={FileSpreadsheet} collapsed={collapsed} />
            <NavRow to="/reportes-operativos" label="Reportes Operativos" icon={BarChart3} collapsed={collapsed} />
          </NavGroup>
        )}
      </nav>

      <div className="space-y-2 border-t border-sb-border px-3 py-3">
        {puedeConfiguracion && <NavRow to="/configuracion" label="Configuracion" icon={Settings} collapsed={collapsed} />}
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sb-border bg-sb-bg-active px-3 py-2 text-xs font-medium text-sb-text-muted hover:text-sb-text"
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          {!collapsed && 'Colapsar menu'}
        </button>
        <ThemeToggle collapsed={collapsed} />
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg bg-sb-bg-active px-3 py-2.5 text-xs text-sb-text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Datos compartidos en tiempo real
          </div>
        )}
      </div>
    </aside>
  );
}
