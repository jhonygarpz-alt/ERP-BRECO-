import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import type { Modulo } from '../../types';

export function RequirePermission({ modulo }: { modulo: Modulo }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(modulo, 'ver')) return <Navigate to="/" replace />;
  return <Outlet />;
}
