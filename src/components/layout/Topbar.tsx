import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search, Settings } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { useAlertas } from '../../lib/alertas';

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function Topbar() {
  const { empresa } = useData();
  const { usuarioActual, rolActual, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const alertas = useAlertas();
  const [alertasOpen, setAlertasOpen] = useState(false);
  const today = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function handleLogout() {
    logout();
    navigate('/login');
  }

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
        {hasPermission('Configuracion', 'ver') && (
          <Link
            to="/configuracion"
            title="Configuracion"
            className="rounded-lg p-2 text-ink-500 transition hover:bg-bg-800 hover:text-ink-100"
          >
            <Settings size={18} />
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => setAlertasOpen((v) => !v)}
            className="relative rounded-lg p-2 text-ink-500 transition hover:bg-bg-800 hover:text-ink-100"
          >
            <Bell size={18} />
            {alertas.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-breco-500 text-[10px] font-semibold text-white">
                {alertas.length}
              </span>
            )}
          </button>
          {alertasOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAlertasOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-line-700 bg-bg-800 p-2 shadow-2xl shadow-black/40">
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">Alertas</div>
                {alertas.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-ink-600">Sin alertas por el momento.</p>
                ) : (
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {alertas.map((a) => (
                      <div key={a.id} className="rounded-lg px-2 py-2 hover:bg-bg-700/70">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.nivel === 'alto' ? 'bg-red-500' : 'bg-amber-500'}`}
                          />
                          <div>
                            <div className="text-sm text-ink-100">{a.mensaje}</div>
                            <div className="text-xs text-ink-500">{a.detalle}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5 border-l border-line-800 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-700 text-sm font-semibold text-ink-100">
            {usuarioActual ? iniciales(usuarioActual.nombre) : '—'}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium text-ink-100">{usuarioActual?.nombre ?? empresa.value.nombre}</div>
            <div className="text-xs text-ink-500">{rolActual?.nombre ?? ''}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesion"
            className="rounded-lg p-2 text-ink-500 transition hover:bg-bg-800 hover:text-breco-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
