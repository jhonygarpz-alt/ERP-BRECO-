import { useEffect, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

const WHATSAPP_NUMERO = '527204765054';

function construirMensaje(nombre: string, empresa: string, telefono: string, problema: string) {
  return [
    `Hola, soy ${nombre}, de la empresa ${empresa}.`,
    `Telefono de contacto: ${telefono}.`,
    '',
    problema,
    '',
    '— Enviado desde Soporte Flota Segura (ERP)',
  ].join('\n');
}

export function SoporteWidget() {
  const [open, setOpen] = useState(false);
  const [bubbleCerrada, setBubbleCerrada] = useState(false);
  const [hover, setHover] = useState(false);
  const [autoShow, setAutoShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAutoShow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const [enviado, setEnviado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [problema, setProblema] = useState('');

  const listoParaEnviar = nombre.trim() && empresa.trim() && telefono.trim() && problema.trim();

  function abrirPanel() {
    setOpen(true);
    setBubbleCerrada(true);
  }

  function enviarWhatsApp() {
    if (!listoParaEnviar) return;
    const mensaje = construirMensaje(nombre.trim(), empresa.trim(), telefono.trim(), problema.trim());
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
    setEnviado(true);
  }

  function cerrarPanel() {
    setOpen(false);
    setEnviado(false);
    setNombre('');
    setEmpresa('');
    setTelefono('');
    setProblema('');
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] overflow-hidden rounded-2xl border border-line-800 bg-white shadow-2xl">
          <div className="relative bg-gradient-to-br from-[#0a1a3d] via-[#0d2358] to-[#0a3a7a] px-4 pt-4 pb-14">
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
                className="h-16 w-16 flex-shrink-0 animate-[soporte-flotar_3.4s_ease-in-out_infinite] rounded-full border-2 border-white/30 object-cover"
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">Flota Segura</p>
                <p className="text-lg font-bold leading-tight text-white">Hola 👋</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/70">Completa los datos para brindarte una mejor atencion.</p>
          </div>

          <div className="-mt-10 space-y-3 rounded-t-2xl bg-white p-4">
            {enviado ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="rounded-full bg-emerald-100 p-3">
                  <Send size={22} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Se abrio WhatsApp con tu mensaje</p>
                <p className="text-xs text-slate-500">Nuestro equipo te respondera a la brevedad.</p>
                <button
                  type="button"
                  onClick={cerrarPanel}
                  className="mt-2 rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
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
                  disabled={!listoParaEnviar}
                  onClick={enviarWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0a3a7a] py-2.5 text-sm font-semibold text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={15} /> Iniciar Chat
                </button>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Nuestro equipo te respondera a la brevedad.</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En linea
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500">
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
              <p className="text-sm">Estoy aqui para ayudarte. ¿En que podemos apoyarte hoy?</p>
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
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[#0a1a3d] bg-emerald-500" />
              </span>
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
