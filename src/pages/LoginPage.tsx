import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, Truck } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { mensajeDeError } from '../lib/errors';
import { Field, Input, PrimaryButton } from '../components/ui/form';
import { BrandName } from '../components/ui/BrandName';

interface EmpresaLoginBranding {
  nombre: string;
  logoDataUrl: string;
}

export function LoginPage() {
  const { estado, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');
  const [empresaLogin, setEmpresaLogin] = useState<EmpresaLoginBranding | null>(null);

  // Antes de iniciar sesion no hay forma de saber (via RLS normal) a que
  // empresa pertenece este usuario, asi que se consulta con una funcion
  // publica minima (solo regresa nombre + logo) mientras escribe su email,
  // para personalizar el logo/nombre en esta pantalla por empresa.
  useEffect(() => {
    const correo = email.trim();
    if (!correo.includes('@')) {
      setEmpresaLogin(null);
      return;
    }
    let cancelado = false;
    const timeout = setTimeout(async () => {
      const { data } = await supabase.rpc('empresa_por_email', { p_email: correo });
      if (cancelado) return;
      const fila = Array.isArray(data) ? data[0] : null;
      setEmpresaLogin(fila ? { nombre: fila.nombre, logoDataUrl: fila.logo_data_url ?? '' } : null);
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [email]);

  if (estado === 'autenticado' || estado === 'sin-perfil' || estado === 'super-admin') return <Navigate to="/" replace />;

  async function handleOlvidoPassword() {
    if (!email.trim()) {
      setMensajeRecuperar('Escribe tu email arriba y dale clic de nuevo.');
      return;
    }
    setRecuperando(true);
    setMensajeRecuperar('');
    const redirectTo = `${window.location.origin}${window.location.pathname}#/restablecer-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setRecuperando(false);
    setMensajeRecuperar(err ? mensajeDeError(err) : 'Si ese correo tiene cuenta, te llegara un link para restablecer tu contrasena.');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const result = await login(email, password);
    setEnviando(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo iniciar sesion.');
      return;
    }
    navigate('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {empresaLogin?.logoDataUrl ? (
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-bg-800">
              <img src={empresaLogin.logoDataUrl} alt={empresaLogin.nombre} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-breco-500 text-white shadow-lg shadow-breco-glow">
              <Truck size={26} />
            </div>
          )}
          <div className="text-center">
            <div className="text-lg tracking-wide text-ink-100">
              {empresaLogin ? <BrandName nombre={empresaLogin.nombre} /> : 'Sistema de Trafico'}
            </div>
            <div className="text-xs font-medium uppercase tracking-widest text-breco-500">Trafico ERP</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-line-800 bg-bg-800 p-6 shadow-2xl shadow-black/40"
        >
          <div>
            <h1 className="text-base font-semibold text-ink-100">Iniciar sesion</h1>
            <p className="mt-1 text-sm text-ink-500">Ingresa con tu usuario del sistema.</p>
          </div>

          <Field label="Email">
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@brecotransportes.com"
            />
          </Field>
          <Field label="Contrasena">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleOlvidoPassword}
              disabled={recuperando}
              className="text-xs font-medium text-breco-500 hover:underline disabled:opacity-50"
            >
              {recuperando ? 'Enviando...' : 'Olvidaste tu contrasena?'}
            </button>
          </div>
          {mensajeRecuperar && <p className="text-xs text-ink-500">{mensajeRecuperar}</p>}

          {error && <p className="text-sm text-breco-500">{error}</p>}

          <PrimaryButton type="submit" className="w-full" disabled={enviando}>
            <LogIn size={16} />
            {enviando ? 'Entrando...' : 'Entrar'}
          </PrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs text-ink-600">
          {empresaLogin ? `Acceso interno de ${empresaLogin.nombre}.` : 'Acceso interno.'} Contacta a un administrador si no tienes cuenta.
        </p>
      </div>
    </div>
  );
}
