import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  Fuel,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Route,
  Truck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { mensajeDeError } from '../lib/errors';
import { BrandName } from '../components/ui/BrandName';

interface EmpresaLoginBranding {
  nombre: string;
  logoDataUrl: string;
}

const CARACTERISTICAS = [
  { icono: Route, titulo: 'Control de viajes', subtitulo: 'Operacion en tiempo real' },
  { icono: Fuel, titulo: 'Combustible y casetas', subtitulo: 'Control de gastos' },
  { icono: Wrench, titulo: 'Mantenimiento', subtitulo: 'Servicios y alertas' },
  { icono: FileText, titulo: 'Facturacion y Carta Porte', subtitulo: 'Cumplimiento fiscal' },
  { icono: MapPin, titulo: 'Rastreo satelital y GPS', subtitulo: 'Seguridad para tu flota' },
  { icono: BarChart3, titulo: 'Reportes y analisis', subtitulo: 'Mejores decisiones' },
];

export function LoginPage() {
  const { estado, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');
  const [empresaLogin, setEmpresaLogin] = useState<EmpresaLoginBranding | null>(null);

  // Antes de iniciar sesion no hay forma de saber (via RLS normal) a que
  // empresa pertenece este usuario, asi que se consulta con una funcion
  // publica minima (solo regresa nombre + logo) mientras escribe su email,
  // para personalizar el logo/nombre de la tarjeta de acceso por empresa.
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

  if (
    estado === 'autenticado' ||
    estado === 'sin-perfil' ||
    estado === 'super-admin' ||
    estado === 'suspendida' ||
    estado === 'sin-licencia'
  )
    return <Navigate to="/" replace />;

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
    <div className="min-h-screen bg-bg-950 lg:flex">
      {/* Panel izquierdo: vitrina de marca -- se oculta en pantallas chicas, el login nunca depende de el. */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[55%]">
        <img src="/login/truck-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Overlay mas ligero que antes -- deja apreciar el trailer de fondo en vez de ahogarlo en negro. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05070f]/82 via-[#0a1530]/68 to-[#0a1530]/45" />
        {/* Vineta inferior aparte, solo para que las tarjetas flotantes y el avatar tengan suficiente contraste sin oscurecer el resto de la foto. */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#03050c]/85 to-transparent" />
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: 'radial-gradient(55% 45% at 12% 8%, rgba(56,189,248,0.25), transparent 70%)' }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-16 w-auto self-start drop-shadow-lg xl:h-[4.5rem]" />

          <div className="max-w-xl">
            <h1 className="text-4xl leading-[1.1] font-bold text-white xl:text-5xl">
              Control total
              <br />
              para tu empresa de
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">transporte</span>
            </h1>
            <p className="mt-5 max-w-md text-sm text-white/70 xl:text-base">
              Administra, monitorea y optimiza todos tus procesos operativos y administrativos en un solo sistema.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {CARACTERISTICAS.map((c) => (
                <div key={c.titulo} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                    <c.icono size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{c.titulo}</div>
                    <div className="truncate text-xs text-white/55">{c.subtitulo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-end justify-between gap-4">
            <div className="relative shrink-0">
              <div className="absolute -bottom-2 left-1/2 h-6 w-36 -translate-x-1/2 rounded-full bg-black/50 blur-xl" />
              <img src="/login/mascot.png" alt="" className="relative h-52 w-auto object-contain object-bottom xl:h-60" />
            </div>

            <div className="mb-2 flex flex-col gap-2.5">
              <div className="w-44 rounded-lg border border-white/10 bg-white/[0.06] p-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                    <Truck size={12} className="text-sky-300" /> Unidad 01
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En ruta
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-white/55">GDL &rarr; MTY</p>
              </div>
              <div className="w-44 rounded-lg border border-white/10 bg-white/[0.06] p-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                    <MapPin size={12} className="text-sky-300" /> Rastreo satelital
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">ACTIVO</span>
                </div>
                <p className="mt-1 text-[10px] text-white/55">85 km/h &middot; ETA 2h 45m</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: formulario de acceso -- mas grande, mas centrado y con mas aire. */}
      <div className="flex flex-1 flex-col bg-bg-950 lg:items-center lg:justify-center">
        {/* Resumen visual compacto, solo en movil/tablet (abajo de lg): logo + lema sobre la foto del trailer, antes del formulario. */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden lg:hidden">
          <img src="/login/truck-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/75 via-[#0a1530]/80 to-[var(--color-bg-950)]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-10 w-auto drop-shadow-lg" />
            <p className="text-sm font-semibold text-white">Control total para tu empresa de transporte</p>
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-8 lg:flex-none lg:px-10 lg:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex-col items-center gap-3 lg:flex">
            {empresaLogin?.logoDataUrl ? (
              <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-bg-800">
                <img src={empresaLogin.logoDataUrl} alt={empresaLogin.nombre} className="h-full w-full object-contain" />
              </div>
            ) : (
              <img src="/login/securefleet-logo.png" alt="SecureFleet" className="mx-auto hidden h-12 w-auto lg:block" />
            )}
            {empresaLogin && (
              <div className="text-center">
                <div className="text-lg tracking-wide text-ink-100">
                  <BrandName nombre={empresaLogin.nombre} />
                </div>
                <div className="text-xs font-medium tracking-widest text-breco-500 uppercase">Trafico ERP</div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-line-800 bg-bg-800 p-8 shadow-2xl shadow-black/40 sm:p-10"
          >
            <div>
              <h1 className="text-2xl font-bold text-ink-100">Bienvenido</h1>
              <p className="mt-1.5 text-sm text-ink-500">
                Ingresa tus credenciales para acceder a tu cuenta{empresaLogin ? '' : ' de SecureFleet'}.
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">Usuario o correo electronico</span>
              <div className="relative">
                <Mail size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-600" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl border border-line-700 bg-bg-900 py-3 pr-3 pl-10 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-breco-500 focus:ring-2 focus:ring-breco-500/20"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">Contrasena</span>
              <div className="relative">
                <Lock size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-600" />
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  className="w-full rounded-xl border border-line-700 bg-bg-900 py-3 pr-10 pl-10 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-breco-500 focus:ring-2 focus:ring-breco-500/20"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-600 hover:text-ink-300"
                  aria-label={verPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

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

            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-breco-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-breco-glow transition hover:bg-breco-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn size={17} />
              {enviando ? 'Entrando...' : 'Iniciar sesion'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-600">
            {empresaLogin ? `Acceso interno de ${empresaLogin.nombre}.` : 'Acceso interno.'} Contacta a un administrador si no tienes
            cuenta.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
