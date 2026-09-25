import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import type { Empresa, Modulo, PermisoModulo } from '../types';

type EstadoSesion =
  | 'cargando'
  | 'sin-sesion'
  | 'sin-perfil'
  | 'autenticado'
  | 'super-admin'
  | 'suspendida'
  | 'sin-licencia';

interface AuthContextValue {
  estado: EstadoSesion;
  usuarioActual: ReturnType<typeof useData>['usuarios']['items'][number] | null;
  rolActual: ReturnType<typeof useData>['roles']['items'][number] | null;
  empresaActual: Empresa | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (modulo: Modulo, accion: keyof PermisoModulo, pantallaId?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios, roles, empresas } = useData();
  const [userId, setUserId] = useState<string | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  // undefined = todavia no se sabe (o no aplica); true = hay cupo; false =
  // se alcanzo el limite de licencias contratadas y esta sesion quedo fuera.
  const [licenciaOk, setLicenciaOk] = useState<boolean | undefined>(undefined);

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
  const empresaActual = empresas.items.find((e) => e.id === usuarioActual?.empresaId) ?? null;

  // Cuenta las licencias contratadas (cuantos usuarios pueden tener sesion
  // abierta al mismo tiempo): al conectarse, y cada minuto mientras sigue
  // conectado, se "registra" via RPC (que aplica el limite del lado del
  // servidor); si ya no hay cupo, se cierra la sesion recien iniciada.
  useEffect(() => {
    if (!userId || !usuarioActual || usuarioActual.esSuperAdmin) {
      setLicenciaOk(undefined);
      return;
    }
    let cancelado = false;

    async function registrar() {
      const { data, error } = await supabase.rpc('registrar_sesion');
      if (cancelado) return;
      if (error) {
        // Un error de red/RPC no debe dejar a todos fuera del sistema.
        console.error('No se pudo registrar la sesion:', error);
        setLicenciaOk(true);
        return;
      }
      setLicenciaOk(Boolean((data as { ok?: boolean } | null)?.ok));
    }

    registrar();
    const intervalo = setInterval(registrar, 60_000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [userId, usuarioActual?.id, usuarioActual?.esSuperAdmin]);

  let estado: EstadoSesion;
  if (cargandoSesion || (userId && (usuarios.loading || empresas.loading))) {
    estado = 'cargando';
  } else if (!userId) {
    estado = 'sin-sesion';
  } else if (!usuarioActual) {
    estado = 'sin-perfil';
  } else if (usuarioActual.esSuperAdmin) {
    estado = 'super-admin';
  } else if (empresaActual?.estatus === 'suspendida') {
    estado = 'suspendida';
  } else if (licenciaOk === false) {
    estado = 'sin-licencia';
  } else if (licenciaOk === undefined) {
    estado = 'cargando';
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
    try {
      await supabase.rpc('liberar_sesion');
    } catch (err) {
      console.error('No se pudo liberar la sesion:', err);
    }
    await supabase.auth.signOut();
  }

  /** Si el modulo no esta contratado por la empresa, no hay permiso posible
   * -- sin importar lo que diga el rol. Un arreglo vacio en
   * modulosContratados significa "sin restriccion" (todos), para que las
   * empresas ya existentes sigan viendo todo igual. "Configuracion" siempre
   * esta disponible para que el administrador pueda gestionar su cuenta. */
  function moduloContratado(modulo: Modulo) {
    const lista = empresaActual?.modulosContratados;
    if (!lista || lista.length === 0) return true;
    return modulo === 'Configuracion' || lista.includes(modulo);
  }

  function hasPermission(modulo: Modulo, accion: keyof PermisoModulo, pantallaId?: string) {
    if (!moduloContratado(modulo)) return false;
    const permisoPantalla = pantallaId ? rolActual?.permisosPantalla?.[pantallaId] : undefined;
    if (permisoPantalla) return permisoPantalla[accion];
    return rolActual?.permisos?.[modulo]?.[accion] ?? false;
  }

  return (
    <AuthContext.Provider value={{ estado, usuarioActual, rolActual, empresaActual, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
