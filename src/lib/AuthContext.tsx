import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSingleton } from './storage';
import { useData } from './DataContext';
import type { Modulo, PermisoModulo } from '../types';

interface Sesion {
  usuarioId: string | null;
}

interface AuthContextValue {
  usuarioActual: ReturnType<typeof useData>['usuarios']['items'][number] | null;
  rolActual: ReturnType<typeof useData>['roles']['items'][number] | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  hasPermission: (modulo: Modulo, accion: keyof PermisoModulo) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios, roles } = useData();
  const sesion = useSingleton<Sesion>('sesion', { usuarioId: null });

  const usuarioActual = useMemo(
    () => usuarios.items.find((u) => u.id === sesion.value.usuarioId) ?? null,
    [usuarios.items, sesion.value.usuarioId],
  );

  const rolActual = useMemo(
    () => roles.items.find((r) => r.id === usuarioActual?.rolId) ?? null,
    [roles.items, usuarioActual],
  );

  function login(email: string, password: string) {
    const usuario = usuarios.items.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!usuario || usuario.password !== password) {
      return { ok: false, error: 'Email o contrasena incorrectos.' };
    }
    if (usuario.estatus !== 'activo') {
      return { ok: false, error: 'Este usuario esta inactivo. Contacta a un administrador.' };
    }
    sesion.update({ usuarioId: usuario.id });
    return { ok: true };
  }

  function logout() {
    sesion.update({ usuarioId: null });
  }

  function hasPermission(modulo: Modulo, accion: keyof PermisoModulo) {
    return rolActual?.permisos?.[modulo]?.[accion] ?? false;
  }

  return (
    <AuthContext.Provider value={{ usuarioActual, rolActual, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
