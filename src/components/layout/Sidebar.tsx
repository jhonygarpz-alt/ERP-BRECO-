import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Route,
  Receipt,
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

const traficoRoutes = ['/viajes', '/viajes-del-dia', '/aeropuerto', '/programa', '/entrega-turno', '/trafico/reportes'];

export function Sidebar() {
  const location = useLocation();
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const [traficoOpen, setTraficoOpen] = useState(traficoRoutes.some((r) => location.pathname.startsWith(r)));
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
  const puedeEntregaTurno = hasPermission('EntregaTurno', 'ver');
  const puedeReportes = hasPermission('Reportes', 'ver');
  const puedeConfiguracion = hasPermission('Configuracion', 'ver');

  const traficoLinks = [
    puedeViajes && { to: '/viajes', label: 'Asignacion de Viajes', icon: Route },
    puedeViajes && { to: '/viajes-del-dia', label: 'Viajes del Dia', icon: ListChecks },
    puedeViajes && { to: '/aeropuerto', label: 'Pantalla Aeropuerto', icon: PlaneTakeoff },
    puedePrograma && { to: '/programa', label: 'Programa Diario', icon: CalendarClock },
    puedeEntregaTurno && { to: '/entrega-turno', label: 'Entrega de Turno', icon: ClipboardList },
    puedeViajes && { to: '/trafico/reportes', label: 'Reportes', icon: PieChart },
  ].filter(Boolean) as { to: string; label: string; icon: LucideIcon }[];

  function abrirGrupo(setter: (v: boolean) => void) {
    if (collapsed) setCollapsed(false);
    setter(true);
  }

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
          </NavGroup>
        )}

        {traficoLinks.length > 0 && (
          <NavGroup>
            <button
              onClick={() => (collapsed ? abrirGrupo(setTraficoOpen) : setTraficoOpen((v) => !v))}
              title={collapsed ? 'Trafico' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${collapsed ? 'justify-center px-0' : ''} ${
                traficoRoutes.some((r) => location.pathname.startsWith(r))
                  ? 'font-semibold text-sb-text'
                  : 'font-medium text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text'
              }`}
            >
              <Route size={18} strokeWidth={2} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Trafico</span>
                  <ChevronDown
                    size={16}
                    className={`text-sb-text-muted transition-transform ${traficoOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>
            {!collapsed && traficoOpen && (
              <div className="relative ml-5 space-y-1 border-l border-sb-border py-1 pl-4">
                {traficoLinks.map((item) => (
                  <div key={item.to} className="relative">
                    <span className="absolute -left-[18px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sb-border" />
                    <NavRow to={item.to} label={item.label} icon={item.icon} />
                  </div>
                ))}
              </div>
            )}
          </NavGroup>
        )}

        {puedeFacturacion && (
          <NavGroup>
            <NavRow to="/facturacion" label="Facturacion Diaria" icon={Receipt} collapsed={collapsed} />
          </NavGroup>
        )}

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
