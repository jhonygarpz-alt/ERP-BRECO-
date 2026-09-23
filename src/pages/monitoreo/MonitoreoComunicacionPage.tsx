import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { ComboBoxCodigo } from '../../components/ui/ComboBoxCodigo';
import { Field, GhostButton, inputClass } from '../../components/ui/form';
import { viajeActivo } from '../../lib/monitoreoViajes';

export function MonitoreoComunicacionPage() {
  const { viajes, clientes, mensajesViaje } = useData();
  const { usuarioActual } = useAuth();
  const [viajeId, setViajeId] = useState('');
  const [texto, setTexto] = useState('');

  const viajesActivos = useMemo(() => viajes.items.filter(viajeActivo), [viajes.items]);
  const viajeSeleccionado = viajes.items.find((v) => v.id === viajeId);

  function nombreCliente(clienteId?: string) {
    return clientes.items.find((c) => c.id === clienteId)?.nombre ?? '';
  }

  const mensajes = useMemo(
    () =>
      mensajesViaje.items
        .filter((m) => m.viajeId === viajeId)
        .sort((a, b) => (a.creadoEn ?? '').localeCompare(b.creadoEn ?? '')),
    [mensajesViaje.items, viajeId],
  );

  const recientes = useMemo(
    () =>
      mensajesViaje.items
        .slice()
        .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''))
        .slice(0, 8),
    [mensajesViaje.items],
  );

  function enviar() {
    const valor = texto.trim();
    if (!valor || !viajeId) return;
    mensajesViaje.add({ id: uid('msg'), viajeId, autor: usuarioActual?.nombre || 'Usuario', mensaje: valor });
    setTexto('');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Comunicacion</h1>
        <p className="mt-1 text-sm text-ink-500">Mensajes de seguimiento por viaje entre trafico y operacion.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Mensajes recientes</h2>
          <div className="space-y-2">
            {recientes.length === 0 && <p className="text-sm text-ink-600">Sin mensajes todavia.</p>}
            {recientes.map((m) => {
              const v = viajes.items.find((x) => x.id === m.viajeId);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViajeId(m.viajeId)}
                  className="block w-full rounded-lg border border-line-800 bg-bg-900 p-2.5 text-left transition hover:border-breco-500/40"
                >
                  <div className="flex items-center justify-between text-xs text-ink-600">
                    <span className="font-semibold text-ink-200">{v?.folio ?? 'N/D'}</span>
                    <span>{m.creadoEn ? new Date(m.creadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-400">
                    <span className="font-medium text-ink-300">{m.autor}:</span> {m.mensaje}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4 lg:col-span-2">
          <Field label="Viaje">
            <ComboBoxCodigo
              items={viajesActivos}
              valor={viajeSeleccionado?.folio ?? ''}
              obtenerCodigo={(v) => v.folio}
              obtenerEtiqueta={(v) => nombreCliente(v.clienteId)}
              onSeleccionar={(v) => setViajeId(v.id)}
              onLimpiar={() => setViajeId('')}
              placeholder="Selecciona un viaje activo..."
            />
          </Field>

          {viajeId ? (
            <>
              <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl border border-line-800 bg-bg-900 p-4">
                {mensajes.length === 0 && <p className="text-sm text-ink-600">Sin mensajes en este viaje todavia.</p>}
                {mensajes.map((m) => (
                  <div key={m.id} className="rounded-lg bg-bg-800 p-3">
                    <div className="flex items-center justify-between text-xs text-ink-600">
                      <span className="font-medium text-ink-200">{m.autor}</span>
                      <span>{m.creadoEn ? new Date(m.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-100">{m.mensaje}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className={`${inputClass} flex-1`}
                />
                <GhostButton type="button" onClick={enviar}>
                  <Send size={14} /> Enviar
                </GhostButton>
              </div>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-ink-600">Selecciona un viaje para ver o enviar mensajes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
