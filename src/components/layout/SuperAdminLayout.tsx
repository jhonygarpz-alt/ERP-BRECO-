import { Outlet } from 'react-router-dom';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export function SuperAdminLayout() {
  const { usuarioActual, logout } = useAuth();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-950">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-line-800 bg-bg-900 px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-breco-500 text-white shadow-lg shadow-breco-glow">
            <ShieldCheck size={18} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-100">Panel de plataforma</div>
            <div className="text-xs text-ink-500">{usuarioActual?.nombre}</div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-400 hover:bg-bg-800 hover:text-breco-500"
        >
          <LogOut size={15} />
          Cerrar sesion
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
