import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, SquarePen, X } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { MensajeTicketSoporte } from '../../types';

const TICKET_ACTIVO_KEY = 'breco-soporte-ticket-activo';
const vistosKey = (ticketId: string) => `breco-soporte-vistos-${ticketId}`;

function leerTicketActivoId(): string | null {
  try {
    return localStorage.getItem(TICKET_ACTIVO_KEY);
  } catch {
    return null;
  }
}
function guardarTicketActivoId(id: string | null) {
  try {
    if (id) localStorage.setItem(TICKET_ACTIVO_KEY, id);
    else localStorage.removeItem(TICKET_ACTIVO_KEY);
  } catch {
    // localStorage puede fallar en modo privado; no es critico para el widget.
  }
}
function leerVistos(ticketId: string): number {
  try {
    return Number(localStorage.getItem(vistosKey(ticketId))) || 0;
  } catch {
    return 0;
  }
}
function marcarVistos(ticketId: string, cantidad: number) {
  try {
    localStorage.setItem(vistosKey(ticketId), String(cantidad));
  } catch {
    // ver arriba.
  }
}

export function SoporteWidget() {
  const { ticketsSoporte } = useData();
  const [open, setOpen] = useState(false);
  const [bubbleCerrada, setBubbleCerrada] = useState(false);
  const [hover, setHover] = useState(false);
  const [autoShow, setAutoShow] = useState(false);
  const [ticketActivoId, setTicketActivoId] = useState<string | null>(() => leerTicketActivoId());
  const [noLeidos, setNoLeidos] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [problema, setProblema] = useState('');
  const [respuesta, setRespuesta] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setAutoShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const ticketActivo = useMemo(
    () => ticketsSoporte.items.find((t) => t.id === ticketActivoId) ?? null,
    [ticketsSoporte.items, ticketActivoId],
  );

  useEffect(() => {
    if (!ticketActivo) return;
    const vistos = leerVistos(ticketActivo.id);
    if (open) {
      marcarVistos(ticketActivo.id, ticketActivo.mensajes.length);
      setNoLeidos(0);
    } else {
      setNoLeidos(Math.max(0, ticketActivo.mensajes.length - vistos));
    }
  }, [ticketActivo, open]);

  const listoParaEnviar = nombre.trim() && empresa.trim() && telefono.trim() && problema.trim();

  function abrirPanel() {
    setOpen(true);
    setBubbleCerrada(true);
  }

  async function enviarTicket() {
    if (!listoParaEnviar) return;
    setEnviando(true);
    const id = uid('tkt');
    const primerMensaje: MensajeTicketSoporte = {
      id: uid('msg'),
      autor: 'cliente',
      texto: problema.trim(),
      fecha: new Date().toISOString(),
    };
    await ticketsSoporte.add({
      id,
      nombre: nombre.trim(),
      empresaTexto: empresa.trim(),
      telefono: telefono.trim(),
      mensajes: [primerMensaje],
      estatus: 'Nuevo',
    });
    setTicketActivoId(id);
    guardarTicketActivoId(id);
    marcarVistos(id, 1);
    setEnviando(false);
  }

  async function enviarRespuesta() {
    if (!ticketActivo || !respuesta.trim()) return;
    setEnviando(true);
    const nuevoMensaje: MensajeTicketSoporte = {
      id: uid('msg'),
      autor: 'cliente',
      texto: respuesta.trim(),
      fecha: new Date().toISOString(),
    };
    const mensajes = [...ticketActivo.mensajes, nuevoMensaje];
    await ticketsSoporte.update(ticketActivo.id, { mensajes, estatus: 'Nuevo' });
    marcarVistos(ticketActivo.id, mensajes.length);
    setRespuesta('');
    setEnviando(false);
  }

  function nuevaConsulta() {
    setTicketActivoId(null);
    guardarTicketActivoId(null);
    setNombre('');
    setEmpresa('');
    setTelefono('');
    setProblema('');
    setRespuesta('');
  }

  function cerrarPanel() {
    setOpen(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[340px] flex-col overflow-hidden rounded-2xl border border-line-800 bg-white shadow-2xl">
          <div className="relative flex-shrink-0 bg-gradient-to-br from-[#0a1a3d] via-[#0d2358] to-[#0a3a7a] px-4 pt-4 pb-4">
            <button
              type="button"
              onClick={cerrarPanel}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/soporte/avatar-face.png"
                alt="Soporte Flota Segura"
                className="h-12 w-12 flex-shrink-0 animate-[soporte-flotar_3.4s_ease-in-out_infinite] rounded-full border-2 border-white/30 object-cover"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Flota Segura</p>
                <p className="truncate text-base font-bold leading-tight text-white">
                  {ticketActivo ? 'Soporte en linea' : 'Hola 👋'}
                </p>
              </div>
            </div>
            {ticketActivo && (
              <button
                type="button"
                onClick={nuevaConsulta}
                className="mt-2 flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-white"
              >
                <SquarePen size={12} /> Nueva consulta
              </button>
            )}
          </div>

          {ticketActivo ? (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
                {ticketActivo.mensajes.map((m) => (
                  <div key={m.id} className={`flex ${m.autor === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.autor === 'cliente'
                          ? 'rounded-br-sm bg-[#0a3a7a] text-white'
                          : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {m.autor === 'soporte' && <p className="mb-0.5 text-[10px] font-bold text-emerald-600">Soporte Flota Segura</p>}
                      <p className="whitespace-pre-wrap">{m.texto}</p>
                    </div>
                  </div>
                ))}
                {ticketActivo.estatus === 'Nuevo' && (
                  <p className="text-center text-[11px] text-slate-400">Nuestro equipo te respondera a la brevedad.</p>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3">
                <input
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') enviarRespuesta();
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a]"
                />
                <button
                  type="button"
                  disabled={!respuesta.trim() || enviando}
                  onClick={enviarRespuesta}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#0d9488] to-[#0a3a7a] text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-xs text-slate-500">Completa los datos para brindarte una mejor atencion.</p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Nombre de usuario *</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Escribe tu nombre"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Nombre de la empresa *</span>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Escribe el nombre de tu empresa"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Numero de telefono *</span>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Escribe tu numero de telefono"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Describe tu problema *</span>
                <textarea
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Cuentanos brevemente en que podemos ayudarte..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0a3a7a]"
                />
              </label>
              <button
                type="button"
                disabled={!listoParaEnviar || enviando}
                onClick={enviarTicket}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0a3a7a] py-2.5 text-sm font-semibold text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={15} /> {enviando ? 'Enviando...' : 'Iniciar Chat'}
              </button>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>Nuestro equipo te respondera a la brevedad.</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En linea
                </span>
              </div>
            </div>
          )}
          <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500">
            Juntos mantenemos tu flota en movimiento 🚚
          </div>
        </div>
      )}

      {!open && (
        <div className="relative flex flex-col items-end">
          {!bubbleCerrada && (hover || autoShow) && (
            <div className="mb-2 mr-1 w-64 rounded-2xl rounded-br-sm border border-line-800 bg-white p-3 text-slate-800 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBubbleCerrada(true);
                }}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
              <p className="text-sm font-bold">¡Hola! 👋</p>
              <p className="text-sm">
                {ticketActivo
                  ? noLeidos > 0
                    ? 'Tienes una respuesta nueva de soporte.'
                    : 'Continua tu conversacion con soporte.'
                  : 'Estoy aqui para ayudarte. ¿En que podemos apoyarte hoy?'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={abrirPanel}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="flex animate-[soporte-flotar_3s_ease-in-out_infinite] items-center gap-2 rounded-full bg-[#0a1a3d] py-1.5 pl-1.5 pr-4 shadow-2xl transition-transform hover:scale-105"
          >
            <span className="relative">
              <img
                src="/soporte/avatar-face.png"
                alt="Chat en linea"
                className="h-11 w-11 animate-[soporte-saludo_6s_ease-in-out_infinite] rounded-full border-2 border-white/40 object-cover"
              />
              {noLeidos > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0a1a3d] bg-red-500 text-[9px] font-bold text-white">
                  {noLeidos}
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[#0a1a3d] bg-emerald-500" />
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <MessageCircle size={15} /> Chat en linea
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
