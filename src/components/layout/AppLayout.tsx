import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SoporteWidget } from '../soporte/SoporteWidget';

export function AppLayout() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-950">
      <Sidebar mobileOpen={menuMovilAbierto} onCloseMobile={() => setMenuMovilAbierto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuMovilAbierto(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
      <SoporteWidget />
    </div>
  );
}
