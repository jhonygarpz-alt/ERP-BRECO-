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

  const logoChico = empresaLogin?.logoDataUrl ? (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-bg-900">
      <img src={empresaLogin.logoDataUrl} alt={empresaLogin.nombre} className="h-full w-full object-contain" />
    </div>
  ) : (
    <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-11 w-auto" />
  );

  return (
    <div className="min-h-screen bg-bg-950 lg:flex">
      {/* Panel izquierdo (60%): vitrina de marca -- se oculta en pantallas chicas, el login nunca depende de el. */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[60%]">
        <img src="/login/truck-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Overlay claro: se ve mucho mas el trailer que antes, solo un tinte azul marino. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05070f]/62 via-[#0a1530]/45 to-[#0a1530]/25" />
        {/* Vineta inferior aparte, solo para que las tarjetas y el avatar tengan contraste sin oscurecer el resto de la foto. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#03050c]/80 to-transparent" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(60% 50% at 10% 5%, rgba(56,189,248,0.3), transparent 70%)' }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-16 w-auto self-start drop-shadow-lg xl:h-[4.5rem]" />

          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">Plataforma de gestion de flotas</span>
            </div>
            <h1 className="text-5xl leading-[1.05] font-extrabold tracking-tight text-white xl:text-6xl">
              Control total
              <br />
              para tu empresa
              <br />
              de{' '}
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">transporte</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-white/75">
              Administra, monitorea y optimiza todos tus procesos operativos y administrativos en un solo sistema.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {CARACTERISTICAS.map((c) => (
                <div key={c.titulo} className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-300 backdrop-blur-sm">
                    <c.icono size={19} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{c.titulo}</div>
                    <div className="truncate text-xs text-white/55">{c.subtitulo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mascota + telemetria: una sola composicion tipo "presentando el dashboard", no elementos sueltos. */}
          <div className="relative flex items-end gap-5">
            <div className="relative shrink-0">
              <div className="absolute -bottom-1 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full bg-black/50 blur-lg" />
              <img src="/login/mascot.png" alt="" className="relative h-44 w-auto object-contain object-bottom xl:h-52" />
            </div>

            <div className="flex flex-1 flex-col gap-3 pb-2 sm:flex-row">
              <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
                      <Truck size={14} />
                    </span>
                    Unidad 01
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> EN RUTA
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-white/60">Guadalajara &rarr; Monterrey</p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
                </div>
              </div>
              <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
                      <MapPin size={14} />
                    </span>
                    Rastreo satelital
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">GPS ACTIVO</span>
                </div>
                <p className="mt-2.5 text-xs text-white/60">85 km/h &middot; ETA 2h 45m</p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho (40%): fondo con textura propia -- degradados suaves + puntos, nunca gris vacio.
          overflow-y-auto (no overflow-hidden) para que en pantallas bajas la tarjeta nunca quede cortada;
          los adornos de fondo van en su propio wrapper con overflow-hidden aparte. */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-bg-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, var(--color-breco-glow) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)' }}
          />
          <div
            className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-breco-glow), transparent 70%)' }}
          />
        </div>

        {/* Resumen visual compacto, solo en movil/tablet (abajo de lg): logo + lema sobre la foto del trailer, antes del formulario. */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden lg:hidden">
          <img src="/login/truck-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/75 via-[#0a1530]/80 to-[var(--color-bg-950)]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-10 w-auto drop-shadow-lg" />
            <p className="text-sm font-semibold text-white">Control total para tu empresa de transporte</p>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 py-8 lg:px-12 lg:py-10 xl:px-16">
          <div className="flex w-full max-w-xl flex-1 flex-col justify-center lg:min-h-[min(64vh,42rem)]">
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-1 flex-col justify-center space-y-7 rounded-[2rem] border border-line-800 bg-bg-800 p-10 shadow-2xl shadow-black/40 sm:p-12"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                {logoChico}
                {empresaLogin && (
                  <div>
                    <div className="text-lg tracking-wide text-ink-100">
                      <BrandName nombre={empresaLogin.nombre} />
                    </div>
                    <div className="text-xs font-medium tracking-widest text-breco-500 uppercase">Trafico ERP</div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-ink-100">Bienvenido</h1>
                <p className="mt-2 text-sm text-ink-500">
                  Ingresa tus credenciales para acceder a tu cuenta{empresaLogin ? '' : ' de SecureFleet'}.
                </p>
              </div>

              <div className="space-y-5">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">Usuario o correo electronico</span>
                  <div className="relative">
                    <Mail size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-600" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full rounded-xl border border-line-700 bg-bg-900 py-3.5 pr-4 pl-11 text-base text-ink-100 outline-none placeholder:text-ink-600 focus:border-breco-500 focus:shadow-[0_0_0_2px_var(--color-breco-500),0_0_22px_4px_color-mix(in_srgb,var(--color-breco-500)_55%,transparent),0_0_40px_10px_color-mix(in_srgb,var(--color-breco-500)_25%,transparent)] focus:outline-none transition-shadow"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">Contrasena</span>
                  <div className="relative">
                    <Lock size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-600" />
                    <input
                      type={verPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contrasena"
                      className="w-full rounded-xl border border-line-700 bg-bg-900 py-3.5 pr-11 pl-11 text-base text-ink-100 outline-none placeholder:text-ink-600 focus:border-breco-500 focus:shadow-[0_0_0_2px_var(--color-breco-500),0_0_22px_4px_color-mix(in_srgb,var(--color-breco-500)_55%,transparent),0_0_40px_10px_color-mix(in_srgb,var(--color-breco-500)_25%,transparent)] focus:outline-none transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-ink-600 hover:text-ink-300"
                      aria-label={verPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleOlvidoPassword}
                  disabled={recuperando}
                  className="text-sm font-medium text-breco-500 hover:underline disabled:opacity-50"
                >
                  {recuperando ? 'Enviando...' : 'Olvidaste tu contrasena?'}
                </button>
              </div>
              {mensajeRecuperar && <p className="text-xs text-ink-500">{mensajeRecuperar}</p>}

              {error && <p className="text-sm text-breco-500">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-breco-500 py-4 text-base font-semibold text-white shadow-lg shadow-breco-glow transition hover:bg-breco-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={18} />
                {enviando ? 'Entrando...' : 'Iniciar sesion'}
              </button>

              <p className="text-center text-xs text-ink-600">
                {empresaLogin ? `Acceso interno de ${empresaLogin.nombre}.` : 'Acceso interno.'} Contacta a un administrador si no
                tienes cuenta.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
