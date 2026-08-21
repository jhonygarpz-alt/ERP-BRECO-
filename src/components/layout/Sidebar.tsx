import { useState } from 'react';
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
} from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';

const catalogLinks = [
  { to: '/catalogos/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogos/unidades', label: 'Unidades', icon: Truck },
  { to: '/catalogos/cajas', label: 'Cajas', icon: PackageSearch },
  { to: '/catalogos/operadores', label: 'Operadores', icon: IdCard },
];

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-breco-500/15 text-white'
      : 'text-ink-500 hover:bg-bg-700 hover:text-ink-100'
  }`;

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
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-line-800 bg-bg-900">
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
          <div className="truncate text-sm font-bold tracking-wide text-ink-100">{empresa.value.nombre}</div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-breco-500">
            Trafico ERP
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none px-3 py-4">
        <NavLink to="/" end className={navItemClass}>
          <LayoutDashboard size={18} />
          Resumen
        </NavLink>

        {puedeCatalogos && (
          <>
            <button
              onClick={() => setCatalogsOpen((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                location.pathname.startsWith('/catalogos')
                  ? 'text-ink-100'
                  : 'text-ink-500 hover:bg-bg-700 hover:text-ink-100'
              }`}
            >
              <Boxes size={18} />
              <span className="flex-1 text-left">Catalogos</span>
              <ChevronDown
                size={15}
                className={`transition-transform ${catalogsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {catalogsOpen && (
              <div className="ml-4 space-y-1 border-l border-line-800 pl-3">
                {catalogLinks.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navItemClass}>
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </>
        )}

        {(puedeViajes || puedeFacturacion || puedePrograma) && (
          <div className="pt-2">
            {puedeViajes && (
              <NavLink to="/viajes" className={navItemClass}>
                <Route size={18} />
                Asignacion de Viajes
              </NavLink>
            )}
            {puedeFacturacion && (
              <NavLink to="/facturacion" className={navItemClass}>
                <Receipt size={18} />
                Facturacion Diaria
              </NavLink>
            )}
            {puedePrograma && (
              <NavLink to="/programa" className={navItemClass}>
                <CalendarClock size={18} />
                Programa Diario
              </NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="space-y-2 border-t border-line-800 px-3 py-3">
        {puedeConfiguracion && (
          <NavLink to="/configuracion" className={navItemClass}>
            <Settings size={18} />
            Configuracion
          </NavLink>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-bg-800 px-3 py-2.5 text-xs text-ink-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Datos guardados localmente en este navegador
        </div>
      </div>
    </aside>
  );
}
