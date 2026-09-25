import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export function RequireAuth() {
  const { estado, logout } = useAuth();
  const location = useLocation();

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

  if (estado === 'suspendida') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-950 px-4 text-center">
        <p className="max-w-sm text-sm text-ink-300">
          El servicio de tu empresa esta suspendido por un pago pendiente. Contacta a tu administrador para
          reactivarlo.
        </p>
        <button onClick={() => logout()} className="text-xs font-medium text-breco-500 hover:underline">
          Cerrar sesion
        </button>
      </div>
    );
  }

  if (estado === 'sin-licencia') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-950 px-4 text-center">
        <p className="max-w-sm text-sm text-ink-300">
          Tu empresa ya alcanzo el numero de licencias contratadas conectadas al mismo tiempo. Cierra sesion en otro
          dispositivo o pide a tu administrador que amplie las licencias contratadas.
        </p>
        <button onClick={() => logout()} className="text-xs font-medium text-breco-500 hover:underline">
          Cerrar sesion
        </button>
      </div>
    );
  }

  // Un super admin no pertenece a ninguna empresa; su unica vista es el
  // panel de Superadmin, nunca el ERP normal de una empresa.
  if (estado === 'super-admin' && !location.pathname.startsWith('/superadmin')) {
    return <Navigate to="/superadmin" replace />;
  }
  if (estado === 'autenticado' && location.pathname.startsWith('/superadmin')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
