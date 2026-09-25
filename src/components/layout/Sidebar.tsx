import { useEffect, useState, type ReactNode } from 'react';
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
  Landmark,
  FileClock,
  GitCompareArrows,
  Wrench,
  ClipboardCheck,
  Warehouse,
  FileSearch,
  ShoppingCart,
  PackagePlus,
  ShoppingBasket,
  PackageSearch,
  X,
  MinusCircle,
  Orbit,
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
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-nav font-medium transition ${collapsed ? 'justify-center px-0' : ''} ${
          isActive
            ? 'bg-breco-500 text-white shadow-md shadow-breco-glow'
            : 'text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text'
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
  links: { to: string; label: string; icon: LucideIcon; end?: boolean }[];
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
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-nav font-medium transition ${collapsed ? 'justify-center px-0' : ''} ${
          routes.some((r) => location.pathname.startsWith(r))
            ? 'text-sb-text'
            : 'text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text'
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
              <NavRow to={item.to} end={item.end ?? item.to === routes[0]} label={item.label} icon={item.icon} />
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

const traficoRoutes = [
  '/viajes',
  '/gastos-viaje',
  '/gastos-viaje/detallado',
  '/descuentos-operador',
  '/viajes-del-dia',
  '/aeropuerto',
  '/programa',
  '/trafico/reportes',
];
const monitoreoRoutes = ['/monitoreo'];
const facturacionRoutes = ['/facturacion'];
const cobranzaRoutes = ['/cobranza'];
const bancoRoutes = ['/banco'];
const mantenimientoRoutes = ['/mantenimiento'];
const almacenRoutes = ['/almacen'];

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('breco-sidebar-collapsed') === '1');

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('breco-sidebar-collapsed', c ? '0' : '1');
      return !c;
    });
  }

  // En movil el menu es un panel deslizable: se cierra solo al navegar.
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // El colapsado a solo-iconos es una preferencia de escritorio; en el panel
  // deslizable de movil siempre se muestran las etiquetas completas.
  const effectiveCollapsed = collapsed && !mobileOpen;

  const puedeCatalogos = hasPermission('Catalogos', 'ver');
  const puedeFlota = hasPermission('Flota', 'ver');
  const puedeFacturacion = hasPermission('Facturacion', 'ver');
  const puedeMonitoreo = hasPermission('Monitoreo', 'ver');
  const puedeCobranza = hasPermission('Cobranza', 'ver');
  const puedeBanco = hasPermission('Banco', 'ver');
  const puedeMantenimiento = hasPermission('Mantenimiento', 'ver');
  const puedeAlmacen = hasPermission('Almacen', 'ver');
  const puedeReportes = hasPermission('Reportes', 'ver');
  const puedeConfiguracion = hasPermission('Configuracion', 'ver');

  // Permiso fino por pantalla (Rol.permisosPantalla): si el rol no tiene un
  // override para esta ruta, hereda el permiso del modulo -- por eso cada
  // link de abajo pasa su propia ruta como pantallaId ademas del modulo.
  const puedeVer = (modulo: Parameters<typeof hasPermission>[0], ruta: string) => hasPermission(modulo, 'ver', ruta);

  const traficoLinks = [
    puedeVer('Viajes', '/viajes') && { to: '/viajes', label: 'Asignacion de Viajes', icon: Route },
    puedeVer('Viajes', '/gastos-viaje') && { to: '/gastos-viaje', label: 'Gastos de Viaje', icon: Wallet, end: true },
    puedeVer('Viajes', '/descuentos-operador') && { to: '/descuentos-operador', label: 'Descuentos a Operador', icon: MinusCircle },
    puedeVer('Viajes', '/gastos-viaje/detallado') && { to: '/gastos-viaje/detallado', label: 'Detallado de Gastos por Viaje', icon: BarChart3 },
    puedeVer('Viajes', '/viajes-del-dia') && { to: '/viajes-del-dia', label: 'Viajes del Dia', icon: ListChecks },
    puedeVer('Viajes', '/aeropuerto') && { to: '/aeropuerto', label: 'Pantalla Aeropuerto', icon: PlaneTakeoff },
    puedeVer('Programa', '/programa') && { to: '/programa', label: 'Programa Diario', icon: CalendarClock },
    puedeVer('Viajes', '/trafico/reportes') && { to: '/trafico/reportes', label: 'Reportes', icon: PieChart },
  ].filter(Boolean) as { to: string; label: string; icon: LucideIcon; end?: boolean }[];

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
      ].filter((l) => puedeVer('Monitoreo', l.to))
    : [];

  const facturacionLinks: { to: string; label: string; icon: LucideIcon }[] = puedeFacturacion
    ? [
        { to: '/facturacion', label: 'Facturacion Diaria', icon: Receipt },
        { to: '/facturacion/por-viaje', label: 'Por Viaje', icon: Route },
        { to: '/facturacion/por-concepto', label: 'Por Concepto', icon: FileText },
      ].filter((l) => puedeVer('Facturacion', l.to))
    : [];

  const cobranzaLinks: { to: string; label: string; icon: LucideIcon }[] = puedeCobranza
    ? [
        { to: '/cobranza/complementos-pago', label: 'Complementos de Pago', icon: HandCoins },
        { to: '/cobranza/notas-credito', label: 'Notas de Credito', icon: FileMinus },
        { to: '/cobranza/estados-cuenta', label: 'Estados de Cuenta', icon: ScrollText },
      ].filter((l) => puedeVer('Cobranza', l.to))
    : [];

  const bancoLinks: { to: string; label: string; icon: LucideIcon }[] = puedeBanco
    ? [
        { to: '/banco/movimientos', label: 'Movimientos Bancarios', icon: Landmark },
        { to: '/banco/cuentas-por-pagar', label: 'Cuentas por Pagar', icon: FileClock },
        { to: '/banco/conciliaciones', label: 'Conciliaciones', icon: GitCompareArrows },
        { to: '/banco/reportes', label: 'Reportes', icon: PieChart },
      ].filter((l) => puedeVer('Banco', l.to))
    : [];

  const mantenimientoLinks: { to: string; label: string; icon: LucideIcon }[] = puedeMantenimiento
    ? [
        { to: '/mantenimiento/catalogos', label: 'Catalogos', icon: Boxes },
        { to: '/mantenimiento/reportes-falla', label: 'Reportes de Fallas', icon: AlertTriangle },
        { to: '/mantenimiento/ordenes-servicio', label: 'Ordenes de Servicios', icon: Wrench },
        { to: '/mantenimiento/servicios-programados', label: 'Servicios Programados', icon: CalendarClock },
        { to: '/mantenimiento/checklist', label: 'Checklist Fisicomecanico Rapido', icon: ClipboardCheck },
      ].filter((l) => puedeVer('Mantenimiento', l.to))
    : [];

  const almacenLinks: { to: string; label: string; icon: LucideIcon }[] = puedeAlmacen
    ? [
        { to: '/almacen/catalogos', label: 'Catalogos', icon: Boxes },
        { to: '/almacen/cotizaciones', label: 'Cotizaciones', icon: FileSearch },
        { to: '/almacen/requisiciones', label: 'Requisiciones', icon: ShoppingCart },
        { to: '/almacen/ordenes-compra', label: 'Ordenes de Compra', icon: PackagePlus },
        { to: '/almacen/compras', label: 'Compras', icon: ShoppingBasket },
        { to: '/almacen/movimientos', label: 'Movimientos de Almacen', icon: Warehouse },
        { to: '/almacen/inventario', label: 'Inventario de Almacen', icon: PackageSearch },
      ].filter((l) => puedeVer('Almacen', l.to))
    : [];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={`font-heading fixed inset-y-0 left-0 z-40 flex h-full w-72 flex-shrink-0 flex-col border-r border-sb-border bg-sb-bg transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          collapsed ? 'md:w-20' : 'md:w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center gap-3 border-b border-sb-border px-5 py-4 ${collapsed ? 'md:justify-center md:px-3' : ''}`}>
        {empresa.value.logoDataUrl ? (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sb-bg-active">
            <img src={empresa.value.logoDataUrl} alt={empresa.value.nombre} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-breco-500 text-xl font-black italic text-white shadow-md shadow-breco-glow">
            B
          </div>
        )}
        <div className={`min-w-0 flex-1 leading-tight ${collapsed ? 'md:hidden' : ''}`}>
          <div className="truncate text-[15px] font-semibold tracking-tight text-sb-text">
            <BrandName nombre={empresa.value.nombre} />
          </div>
          <div className="text-[11px] font-medium tracking-widest text-breco-500 uppercase">Trafico ERP</div>
        </div>
        <button
          onClick={onCloseMobile}
          title="Cerrar menu"
          className="rounded-lg p-1.5 text-sb-text-muted hover:bg-sb-bg-active hover:text-sb-text md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-none px-3 py-4">
        <NavGroup>
          <NavRow to="/" end label="Resumen" icon={LayoutDashboard} collapsed={effectiveCollapsed} />
        </NavGroup>

        {puedeCatalogos && (puedeVer('Catalogos', '/catalogos') || puedeVer('Catalogos', '/parque-vehicular')) && (
          <NavGroup>
            {puedeVer('Catalogos', '/catalogos') && (
              <NavRow to="/catalogos" label="Catalogos" icon={Boxes} collapsed={effectiveCollapsed} />
            )}
            {puedeVer('Catalogos', '/parque-vehicular') && (
              <NavRow to="/parque-vehicular" label="Parque Vehicular" icon={Truck} collapsed={effectiveCollapsed} />
            )}
          </NavGroup>
        )}

        {puedeFlota && puedeVer('Flota', '/flota-360') && (
          <NavGroup>
            <NavRow to="/flota-360" label="Flota Digital 360" icon={Orbit} collapsed={effectiveCollapsed} />
          </NavGroup>
        )}

        <NavCollapsibleGroup
          label="Trafico"
          icon={Route}
          routes={traficoRoutes}
          links={traficoLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Monitoreo"
          icon={Radar}
          routes={monitoreoRoutes}
          links={monitoreoLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Facturacion"
          icon={Receipt}
          routes={facturacionRoutes}
          links={facturacionLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Cobranza"
          icon={HandCoins}
          routes={cobranzaRoutes}
          links={cobranzaLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Banco"
          icon={Landmark}
          routes={bancoRoutes}
          links={bancoLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Mantenimiento"
          icon={Wrench}
          routes={mantenimientoRoutes}
          links={mantenimientoLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        <NavCollapsibleGroup
          label="Almacen"
          icon={Warehouse}
          routes={almacenRoutes}
          links={almacenLinks}
          collapsed={effectiveCollapsed}
          onExpandCollapsed={() => setCollapsed(false)}
        />

        {puedeReportes && (puedeVer('Reportes', '/reportes') || puedeVer('Reportes', '/reportes-operativos')) && (
          <NavGroup>
            {puedeVer('Reportes', '/reportes') && (
              <NavRow to="/reportes" label="Reportes" icon={FileSpreadsheet} collapsed={effectiveCollapsed} />
            )}
            {puedeVer('Reportes', '/reportes-operativos') && (
              <NavRow to="/reportes-operativos" label="Reportes Operativos" icon={BarChart3} collapsed={effectiveCollapsed} />
            )}
          </NavGroup>
        )}
      </nav>

      <div className="space-y-2 border-t border-sb-border px-3 py-3">
        {puedeConfiguracion && <NavRow to="/configuracion" label="Configuracion" icon={Settings} collapsed={effectiveCollapsed} />}
        <button
          onClick={toggleCollapsed}
          className="hidden w-full items-center justify-center gap-2 rounded-xl border border-sb-border bg-sb-bg-active px-3 py-2 text-xs font-medium text-sb-text-muted hover:text-sb-text md:flex"
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
    </>
  );
}
