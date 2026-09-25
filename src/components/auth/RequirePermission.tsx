import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import type { Modulo } from '../../types';

/** Ademas del permiso de modulo, revisa si el rol tiene un override fino
 * (Rol.permisosPantalla) para la ruta exacta que se esta pidiendo -- asi un
 * link oculto en el Sidebar por permiso de pantalla tambien queda bloqueado
 * si se entra a su URL directamente. */
export function RequirePermission({ modulo }: { modulo: Modulo }) {
  const { hasPermission } = useAuth();
  const location = useLocation();
  if (!hasPermission(modulo, 'ver', location.pathname)) return <Navigate to="/" replace />;
  return <Outlet />;
}
