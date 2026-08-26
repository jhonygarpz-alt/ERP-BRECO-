import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export function RequireAuth() {
  const { estado, logout } = useAuth();

  if (estado === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-950 text-sm text-ink-500">
        Cargando...
      </div>
    );
  }

  if (estado === 'sin-sesion') return <Navigate to="/login" replace />;

  if (estado === 'sin-perfil') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-950 px-4 text-center">
        <p className="max-w-sm text-sm text-ink-300">
          Tu cuenta inicio sesion correctamente, pero todavia no tiene un perfil asignado en el sistema. Pidele a un
          administrador que te agregue en Configuracion &gt; Usuarios.
        </p>
        <button
          onClick={() => logout()}
          className="text-xs font-medium text-breco-500 hover:underline"
        >
          Cerrar sesion
        </button>
      </div>
    );
  }

  return <Outlet />;
}
