import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  PackageSearch,
  IdCard,
  Route,
  Receipt,
  CalendarClock,
  ChevronDown,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { BrandName } from '../ui/BrandName';

const catalogLinks = [
  { to: '/catalogos/clientes', label: 'Clientes', icon: Users, gradient: ['#2dd4bf', '#0d9488'] },
  { to: '/catalogos/unidades', label: 'Unidades', icon: Truck, gradient: ['#fb7185', '#dc2626'] },
  { to: '/catalogos/cajas', label: 'Cajas', icon: PackageSearch, gradient: ['#fbbf24', '#d97706'] },
  { to: '/catalogos/operadores', label: 'Operadores', icon: IdCard, gradient: ['#c084fc', '#7e22ce'] },
];

function IconBadge({ icon: Icon, gradient }: { icon: LucideIcon; gradient: [string, string] }) {
  return (
    <div
      className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
      style={{ background: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-white/0 to-black/10" />
      <Icon size={19} strokeWidth={2.1} className="relative text-white drop-shadow-sm" />
    </div>
  );
}

function NavRow({
  to,
  end,
  label,
  icon,
  gradient,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
  gradient: [string, string];
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3.5 rounded-2xl border px-3 py-2.5 text-[15px] transition ${
          isActive
            ? 'border-breco-500/50 bg-breco-500/10 font-semibold text-white shadow-[0_0_0_1px_rgba(225,29,46,0.25),0_0_20px_rgba(225,29,46,0.25)]'
            : 'border-transparent font-medium text-ink-300 hover:bg-bg-700/70 hover:text-ink-100'
        }`
      }
    >
      <IconBadge icon={icon} gradient={gradient} />
      {label}
    </NavLink>
  );
}

function NavGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export function Sidebar() {
  const location = useLocation();
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const [catalogsOpen, setCatalogsOpen] = useState(location.pathname.startsWith('/catalogos'));

  const puedeCatalogos = hasPermission('Catalogos', 'ver');
  const puedeViajes = hasPermission('Viajes', 'ver');
  const puedeFacturacion = hasPermission('Facturacion', 'ver');
  const puedePrograma = hasPermission('Programa', 'ver');
  const puedeConfiguracion = hasPermission('Configuracion', 'ver');

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-line-800 bg-bg-900">
      <div className="flex items-center gap-3 border-b border-line-800 px-5 py-5">
        {empresa.value.logoDataUrl ? (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg-800">
            <img src={empresa.value.logoDataUrl} alt={empresa.value.nombre} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-breco-500 text-lg font-black italic text-white shadow-lg shadow-breco-glow">
            B
          </div>
        )}
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] tracking-tight text-ink-100">
            <BrandName nombre={empresa.value.nombre} />
          </div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-breco-500">
            Trafico ERP
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-none px-3 py-4">
        <NavGroup>
          <NavRow to="/" end label="Resumen" icon={LayoutDashboard} gradient={['#60a5fa', '#2563eb']} />
        </NavGroup>

        {puedeCatalogos && (
          <NavGroup>
            <button
              onClick={() => setCatalogsOpen((v) => !v)}
              className={`flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-[15px] transition ${
                location.pathname.startsWith('/catalogos')
                  ? 'font-semibold text-ink-100'
                  : 'font-medium text-ink-300 hover:bg-bg-700/70 hover:text-ink-100'
              }`}
            >
              <IconBadge icon={Boxes} gradient={['#a78bfa', '#6d28d9']} />
              <span className="flex-1 text-left">Catalogos</span>
              <ChevronDown
                size={16}
                className={`text-ink-500 transition-transform ${catalogsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {catalogsOpen && (
              <div className="relative ml-5 space-y-1.5 border-l border-line-700 py-1 pl-4">
                {catalogLinks.map((item) => (
                  <div key={item.to} className="relative">
                    <span className="absolute -left-[18px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-line-600" />
                    <NavRow to={item.to} label={item.label} icon={item.icon} gradient={item.gradient as [string, string]} />
                  </div>
                ))}
              </div>
            )}
          </NavGroup>
        )}

        {(puedeViajes || puedeFacturacion || puedePrograma) && (
          <NavGroup>
            {puedeViajes && (
              <NavRow to="/viajes" label="Asignacion de Viajes" icon={Route} gradient={['#2dd4bf', '#0891b2']} />
            )}
            {puedeFacturacion && (
              <NavRow to="/facturacion" label="Facturacion Diaria" icon={Receipt} gradient={['#fbbf24', '#b45309']} />
            )}
            {puedePrograma && (
              <NavRow to="/programa" label="Programa Diario" icon={CalendarClock} gradient={['#38bdf8', '#1d4ed8']} />
            )}
          </NavGroup>
        )}
      </nav>

      <div className="space-y-2 border-t border-line-800 px-3 py-3">
        {puedeConfiguracion && (
          <NavRow to="/configuracion" label="Configuracion" icon={Settings} gradient={['#94a3b8', '#475569']} />
        )}
        <div className="flex items-center gap-2 rounded-lg bg-bg-800 px-3 py-2.5 text-xs text-ink-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Datos guardados localmente en este navegador
        </div>
      </div>
    </aside>
  );
}
