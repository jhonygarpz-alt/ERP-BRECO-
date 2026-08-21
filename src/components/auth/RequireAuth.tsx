import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export function RequireAuth() {
  const { usuarioActual } = useAuth();
  if (!usuarioActual) return <Navigate to="/login" replace />;
  return <Outlet />;
}
