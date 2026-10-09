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
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-bg-900">
      <img src={empresaLogin.logoDataUrl} alt={empresaLogin.nombre} className="h-full w-full object-contain" />
    </div>
  ) : (
    <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-16 w-auto" />
  );

  return (
    <div className="min-h-screen bg-bg-950 lg:flex">
      {/* Panel izquierdo (60%): vitrina de marca -- se oculta en pantallas chicas, el login nunca depende de el. */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[60%]">
        <img src="/login/truck-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Overlay aun mas claro -- el atardecer y el trailer se distinguen bien, solo un tinte azul marino leve. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05070f]/48 via-[#0a1530]/32 to-[#0a1530]/14" />
        {/* Vineta inferior aparte, solo para que las tarjetas y el avatar tengan contraste sin oscurecer el resto de la foto. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#03050c]/75 to-transparent" />
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

          {/* Mascota + telemetria: una sola composicion tipo "presentando el dashboard", no elementos sueltos.
              El avatar se levanta un poco (pb-4) para que no quede pegado al borde inferior. */}
          <div className="relative flex items-end gap-6">
            <div className="relative shrink-0 pb-4">
              <div className="absolute bottom-2 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full bg-black/45 blur-lg" />
              <img src="/login/mascot.png" alt="" className="relative h-48 w-auto object-contain object-bottom xl:h-56" />
            </div>

            <div className="flex flex-1 flex-col gap-2.5 pb-2 sm:flex-row">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-300">
                      <Truck size={12} />
                    </span>
                    Unidad 01
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> EN RUTA
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-white/55">Guadalajara &rarr; Monterrey</p>
              </div>
              <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-300">
                      <MapPin size={12} />
                    </span>
                    Rastreo satelital
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    GPS ACTIVO
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-white/55">85 km/h &middot; ETA 2h 45m</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho (40%): fondo oscuro continuo con el panel izquierdo (nunca un bloque blanco
          que corte el diseno en dos) -- degradado navy sutil, lineas tecnicas y puntos discretos.
          overflow-y-auto (no overflow-hidden) para que en pantallas bajas la tarjeta nunca quede
          cortada; los adornos de fondo van en su propio wrapper aparte. */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#060910] via-[#0a0f1c] to-[#0d1526]">
        {/* Veta de luz sutil en el borde que divide ambos paneles, para suavizar el corte. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black/30 to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Lineas tecnicas diagonales, muy discretas. */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'repeating-linear-gradient(115deg, var(--color-breco-500) 0px, var(--color-breco-500) 1px, transparent 1px, transparent 120px)',
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
              backgroundSize: '26px 26px',
            }}
          />
          <div
            className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/75 via-[#0a1530]/80 to-[#060910]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <img src="/login/securefleet-logo.png" alt="SecureFleet" className="h-10 w-auto drop-shadow-lg" />
            <p className="text-sm font-semibold text-white">Control total para tu empresa de transporte</p>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 py-8 lg:px-12 lg:py-10 xl:px-16">
          <div className="flex w-full max-w-xl flex-1 flex-col justify-center lg:min-h-[min(50vh,34rem)]">
            <form
              onSubmit={handleSubmit}
              className="relative flex w-full flex-1 flex-col justify-center space-y-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1120]/75 p-8 shadow-[0_25px_70px_-20px_rgba(2,6,20,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_1px_0_0_rgba(255,255,255,0.12)_inset] backdrop-blur-2xl sm:p-10"
            >
              {/* Resplandores internos tipo "cristal" -- debajo del contenido (z negativo), por encima del fondo de la tarjeta. */}
              <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-48 bg-gradient-to-b from-[color-mix(in_srgb,var(--color-breco-500)_35%,transparent)] to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -bottom-24 -z-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="flex flex-col items-center text-center">
                <div className="flex flex-col items-center gap-2">
                  {logoChico}
                  {empresaLogin && (
                    <div>
                      <div className="text-lg tracking-wide text-white [&>span:last-child]:text-white/55">
                        <BrandName nombre={empresaLogin.nombre} />
                      </div>
                      <div className="text-xs font-medium tracking-widest text-breco-400 uppercase">Trafico ERP</div>
                    </div>
                  )}
                </div>
                <h1 className="mt-4 text-3xl font-bold text-white">Bienvenido</h1>
                <p className="mt-1.5 text-sm text-white/55">
                  Ingresa tus credenciales para acceder a tu cuenta{empresaLogin ? '' : ' de SecureFleet'}.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-cyan-200/70 uppercase">Usuario o correo electronico</span>
                  <div className="relative">
                    <Mail size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-white/35" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-4 pr-4 pl-11 text-base text-white outline-none placeholder:text-white/30 focus:border-breco-500 focus:bg-white/[0.09] focus:shadow-[0_0_0_2px_var(--color-breco-500),0_0_22px_4px_color-mix(in_srgb,var(--color-breco-500)_55%,transparent),0_0_40px_10px_color-mix(in_srgb,var(--color-breco-500)_25%,transparent)] focus:outline-none transition-all"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-cyan-200/70 uppercase">Contrasena</span>
                  <div className="relative">
                    <Lock size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-white/35" />
                    <input
                      type={verPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contrasena"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-4 pr-11 pl-11 text-base text-white outline-none placeholder:text-white/30 focus:border-breco-500 focus:bg-white/[0.09] focus:shadow-[0_0_0_2px_var(--color-breco-500),0_0_22px_4px_color-mix(in_srgb,var(--color-breco-500)_55%,transparent),0_0_40px_10px_color-mix(in_srgb,var(--color-breco-500)_25%,transparent)] focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-white/35 hover:text-white/75"
                      aria-label={verPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleOlvidoPassword}
                  disabled={recuperando}
                  className="text-sm font-medium text-breco-400 hover:text-breco-300 hover:underline disabled:opacity-50"
                >
                  {recuperando ? 'Enviando...' : 'Olvidaste tu contrasena?'}
                </button>
              </div>
              {mensajeRecuperar && <p className="text-xs text-white/50">{mensajeRecuperar}</p>}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-breco-500 to-breco-700 py-4 text-base font-semibold text-white shadow-xl shadow-breco-glow transition-all hover:from-breco-600 hover:to-breco-700 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={18} />
                {enviando ? 'Entrando...' : 'Iniciar sesion'}
              </button>

              <p className="text-center text-xs text-white/35">
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
