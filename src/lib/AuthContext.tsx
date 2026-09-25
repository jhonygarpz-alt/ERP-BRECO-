import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import type { Modulo, PermisoModulo } from '../types';

type EstadoSesion = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'autenticado' | 'super-admin';

interface AuthContextValue {
  estado: EstadoSesion;
  usuarioActual: ReturnType<typeof useData>['usuarios']['items'][number] | null;
  rolActual: ReturnType<typeof useData>['roles']['items'][number] | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (modulo: Modulo, accion: keyof PermisoModulo, pantallaId?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios, roles } = useData();
  const [userId, setUserId] = useState<string | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user.id ?? null);
        setCargandoSesion(false);
      })
      .catch((err) => {
        // Si Supabase Auth no responde (red inestable, servicio caido un
        // instante, etc.) sin este catch la pantalla se queda en
        // "Cargando..." para siempre porque setCargandoSesion(false) nunca
        // se llama. Mejor mostrar el login y dejar que el usuario reintente.
        console.error('No se pudo obtener la sesion:', err);
        setCargandoSesion(false);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setCargandoSesion(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const usuarioActual = usuarios.items.find((u) => u.id === userId) ?? null;
  const rolActual = roles.items.find((r) => r.id === usuarioActual?.rolId) ?? null;

  let estado: EstadoSesion;
  if (cargandoSesion || (userId && usuarios.loading)) {
    estado = 'cargando';
  } else if (!userId) {
    estado = 'sin-sesion';
  } else if (!usuarioActual) {
    estado = 'sin-perfil';
  } else if (usuarioActual.esSuperAdmin) {
    estado = 'super-admin';
  } else {
    estado = 'autenticado';
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      return { ok: false, error: 'Email o contrasena incorrectos.' };
    }
    return { ok: true };
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function hasPermission(modulo: Modulo, accion: keyof PermisoModulo, pantallaId?: string) {
    const permisoPantalla = pantallaId ? rolActual?.permisosPantalla?.[pantallaId] : undefined;
    if (permisoPantalla) return permisoPantalla[accion];
    return rolActual?.permisos?.[modulo]?.[accion] ?? false;
  }

  return (
    <AuthContext.Provider value={{ estado, usuarioActual, rolActual, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
