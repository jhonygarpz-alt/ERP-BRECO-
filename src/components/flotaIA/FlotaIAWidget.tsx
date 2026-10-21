import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Send, X } from 'lucide-react';
import { PANTALLAS } from '../../lib/pantallas';
import { preguntarFlotaIA, type MensajeFlotaIA } from '../../lib/flotaIA';

const SALUDO =
  'Hola, soy Flota IA 👋 Puedo explicarte como usar cualquier modulo del sistema, sugerirte el flujo correcto o ensenarte paso a paso. ¿En que te ayudo?';

const SUGERENCIAS = ['¿Como registro un viaje nuevo?', '¿Donde subo el CSD de mi empresa?', '¿Como doy de alta un remolque?'];

interface MensajeUI extends MensajeFlotaIA {
  id: string;
  error?: boolean;
}

function pantallaActualLabel(pathname: string): string | null {
  const encontrada = PANTALLAS.find((p) => p.id === pathname);
  return encontrada ? encontrada.label : null;
}

export function FlotaIAWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeUI[]>([{ id: 'saludo', rol: 'assistant', texto: SALUDO }]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [mensajes, enviando]);

  async function enviar(textoForzado?: string) {
    const contenido = (textoForzado ?? texto).trim();
    if (!contenido || enviando) return;

    const nuevoMensaje: MensajeUI = { id: `u-${Date.now()}`, rol: 'user', texto: contenido };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setTexto('');
    setEnviando(true);

    const resultado = await preguntarFlotaIA(
      historial.map((m) => ({ rol: m.rol, texto: m.texto })),
      pantallaActualLabel(location.pathname),
    );

    if (resultado.respuesta) {
      setMensajes((prev) => [...prev, { id: `a-${Date.now()}`, rol: 'assistant', texto: resultado.respuesta! }]);
    } else {
      setMensajes((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, rol: 'assistant', texto: resultado.error ?? 'Algo fallo, intenta de nuevo.', error: true },
      ]);
    }
    setEnviando(false);
  }

  return (
    <div className="fixed bottom-5 left-5 z-[100] flex flex-col items-start gap-3">
      {open && (
        <div className="flex h-[520px] w-[340px] flex-col overflow-hidden rounded-2xl border border-line-800 bg-white shadow-2xl">
          <div className="relative flex-shrink-0 bg-gradient-to-br from-[#061233] via-[#0b1f52] to-[#0a3a7a] px-4 pt-4 pb-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/10">
                <Sparkles size={22} className="text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Flota IA</p>
                <p className="truncate text-base font-bold leading-tight text-white">Tu asistente del sistema</p>
              </div>
            </div>
          </div>

          <div ref={logRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {mensajes.map((m) => (
              <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.rol === 'user'
                      ? 'rounded-br-sm bg-[#0a3a7a] text-white'
                      : m.error
                        ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-700'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm italic text-slate-400">
                  Flota IA esta escribiendo…
                </div>
              </div>
            )}
          </div>

          {mensajes.length <= 1 && (
            <div className="flex flex-shrink-0 flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-[#0a3a7a] hover:text-[#0a3a7a]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') enviar();
              }}
              placeholder="Escribe tu pregunta..."
              disabled={enviando}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a] disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!texto.trim() || enviando}
              onClick={() => enviar()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-[#0a3a7a] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#061233] via-[#0b1f52] to-[#0a3a7a] py-2 pl-2 pr-4 shadow-2xl transition-transform hover:scale-105"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white/10">
            <Sparkles size={17} className="text-cyan-300" />
          </span>
          <span className="text-sm font-semibold text-white">Flota IA</span>
        </button>
      )}
    </div>
  );
}
