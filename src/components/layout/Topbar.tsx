import { Link } from 'react-router-dom';
import { Bell, Search, Settings } from 'lucide-react';
import { useData } from '../../lib/DataContext';

export function Topbar() {
  const { empresa } = useData();
  const today = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-line-800 bg-bg-900/80 px-6 backdrop-blur">
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
        <input
          placeholder="Buscar clientes, unidades, viajes..."
          className="w-full rounded-lg border border-line-700 bg-bg-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 outline-none transition focus:border-breco-500 focus:ring-2 focus:ring-breco-glow"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden pr-2 text-sm text-ink-500 md:inline">{today}</span>
        <Link
          to="/configuracion"
          title="Configuracion"
          className="rounded-lg p-2 text-ink-500 transition hover:bg-bg-800 hover:text-ink-100"
        >
          <Settings size={18} />
        </Link>
        <button className="relative rounded-lg p-2 text-ink-500 transition hover:bg-bg-800 hover:text-ink-100">
          <Bell size={18} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-breco-500 text-[10px] font-semibold text-white">
            3
          </span>
        </button>
        <div className="flex items-center gap-2.5 border-l border-line-800 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-700 text-sm font-semibold text-ink-100">
            AT
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium text-ink-100">Area de Trafico</div>
            <div className="text-xs text-ink-500">{empresa.value.nombre}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
