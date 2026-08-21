import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useData } from '../lib/DataContext';
import { Field, Input, PrimaryButton } from '../components/ui/form';

export function LoginPage() {
  const { usuarioActual, login } = useAuth();
  const { empresa } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (usuarioActual) return <Navigate to="/" replace />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
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
            <div className="text-lg font-bold tracking-wide text-ink-100">{empresa.value.nombre}</div>
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

          {error && <p className="text-sm text-breco-500">{error}</p>}

          <PrimaryButton type="submit" className="w-full">
            <LogIn size={16} />
            Entrar
          </PrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs text-ink-600">
          Acceso interno de BRECO Transportes. Contacta a un administrador si no tienes cuenta.
        </p>
      </div>
    </div>
  );
}
