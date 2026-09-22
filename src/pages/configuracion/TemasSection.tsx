import { Check, Moon, Sun } from 'lucide-react';
import { useTheme, type Accent } from '../../lib/ThemeContext';

const ACENTOS: { key: Accent; nombre: string; color: string }[] = [
  { key: 'blue', nombre: 'Azul', color: '#0071e3' },
  { key: 'red', nombre: 'Rojo', color: '#e11d2e' },
  { key: 'green', nombre: 'Verde', color: '#059669' },
  { key: 'purple', nombre: 'Morado', color: '#7c3aed' },
];

export function TemasSection() {
  const { theme, toggleTheme, accent, setAccent } = useTheme();

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-100">Apariencia</h2>
        <p className="mt-1 text-sm text-ink-500">Elige el modo de color de todo el sistema.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 transition ${
              theme === 'light' ? 'border-breco-500 bg-breco-500/5' : 'border-line-800 bg-bg-800 hover:border-line-700'
            }`}
          >
            <Sun size={22} className={theme === 'light' ? 'text-breco-500' : 'text-ink-500'} />
            <span className="text-sm font-medium text-ink-100">Claro</span>
          </button>
          <button
            type="button"
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 transition ${
              theme === 'dark' ? 'border-breco-500 bg-breco-500/5' : 'border-line-800 bg-bg-800 hover:border-line-700'
            }`}
          >
            <Moon size={22} className={theme === 'dark' ? 'text-breco-500' : 'text-ink-500'} />
            <span className="text-sm font-medium text-ink-100">Oscuro</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink-100">Color de acento</h2>
        <p className="mt-1 text-sm text-ink-500">
          Se usa en botones, enlaces activos y elementos destacados en todo el sistema.
        </p>
        <div className="mt-4 flex flex-wrap gap-5">
          {ACENTOS.map((a) => (
            <button key={a.key} type="button" onClick={() => setAccent(a.key)} title={a.nombre} className="flex flex-col items-center gap-2">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-bg-900 transition"
                style={{ backgroundColor: a.color, ['--tw-ring-color' as string]: accent === a.key ? a.color : 'transparent' }}
              >
                {accent === a.key && <Check size={18} className="text-white" strokeWidth={3} />}
              </span>
              <span className="text-xs text-ink-400">{a.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
