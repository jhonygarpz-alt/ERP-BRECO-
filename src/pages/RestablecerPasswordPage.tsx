import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mensajeDeError } from '../lib/errors';
import { Field, Input, PrimaryButton } from '../components/ui/form';
import { BrandName } from '../components/ui/BrandName';
import { useData } from '../lib/DataContext';

type Estado = 'validando' | 'listo' | 'invalido' | 'guardando' | 'hecho';

/**
 * Pagina publica a la que llega el link de "restablecer contrasena" de
 * Supabase. main.tsx reescribe el hash crudo de Supabase
 * (#access_token=...&type=recovery) a esta ruta (#/restablecer-password?
 * access_token=...) para que conviva con HashRouter; aqui se usa ese token
 * para abrir la sesion de recuperacion y dejar que la persona ponga una
 * contrasena nueva.
 */
export function RestablecerPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { empresa } = useData();
  const [estado, setEstado] = useState<Estado>('validando');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) {
      setEstado('invalido');
      return;
    }
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: err }) => {
      setEstado(err ? 'invalido' : 'listo');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setError('');
    setEstado('guardando');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(mensajeDeError(err));
      setEstado('listo');
      return;
    }
    setEstado('hecho');
    setTimeout(() => navigate('/'), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {empresa.value.logoDataUrl ? (
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-bg-800">
              <img src={empresa.value.logoDataUrl} alt={empresa.value.nombre} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-breco-500 text-2xl font-black italic text-white shadow-lg shadow-breco-glow">
              B
            </div>
          )}
          <div className="text-center">
            <div className="text-lg tracking-wide text-ink-100">
              <BrandName nombre={empresa.value.nombre} />
            </div>
            <div className="text-xs font-medium uppercase tracking-widest text-breco-500">Trafico ERP</div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-line-800 bg-bg-800 p-6 shadow-2xl shadow-black/40">
          <div>
            <h1 className="text-base font-semibold text-ink-100">Restablecer contrasena</h1>
            <p className="mt-1 text-sm text-ink-500">Define una contrasena nueva para tu cuenta.</p>
          </div>

          {estado === 'validando' && <p className="text-sm text-ink-500">Validando el link...</p>}

          {estado === 'invalido' && (
            <p className="text-sm text-breco-500">
              Este link ya no es valido o ya expiro. Pide uno nuevo desde el panel de Supabase o con "Olvidaste tu
              contrasena" en la pantalla de inicio de sesion.
            </p>
          )}

          {estado === 'hecho' && <p className="text-sm text-emerald-400">Contrasena actualizada. Entrando...</p>}

          {(estado === 'listo' || estado === 'guardando') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nueva contrasena">
                <Input
                  type="password"
                  required
                  autoFocus
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirmar contrasena">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {error && <p className="text-sm text-breco-500">{error}</p>}

              <PrimaryButton type="submit" className="w-full" disabled={estado === 'guardando'}>
                <KeyRound size={16} />
                {estado === 'guardando' ? 'Guardando...' : 'Guardar contrasena'}
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
