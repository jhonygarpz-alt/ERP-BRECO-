import { useEffect, useMemo, useState } from 'react';
import { CircleSlash, MessageSquareText, RotateCcw, Send } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { debeAutoCerrarse } from '../../lib/soporte';
import type { MensajeTicketSoporte, TicketSoporte } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { StatusBadge } from '../../components/ui/Badge';
import { ToolbarButton } from '../../components/ui/form';

const FILTROS = ['Todos', 'Nuevo', 'Atendido', 'Cerrado'] as const;

function tonoEstatus(estatus: TicketSoporte['estatus']) {
  return estatus === 'Nuevo' ? 'amber' : estatus === 'Atendido' ? 'green' : 'gray';
}

export function SoporteTecnicoSection() {
  const { ticketsSoporte, empresas } = useData();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);

  function empresaNombre(t: TicketSoporte) {
    const real = empresas.items.find((e) => e.id === t.empresaId)?.nombre;
    return real || t.empresaTexto || 'N/D';
  }

  function ultimoMensaje(t: TicketSoporte) {
    return t.mensajes[t.mensajes.length - 1]?.texto ?? '';
  }

  const filtrados = useMemo(() => {
    return ticketsSoporte.items
      .filter((t) => filtro === 'Todos' || t.estatus === filtro)
      .slice()
      .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
  }, [ticketsSoporte.items, filtro]);

  const nuevos = ticketsSoporte.items.filter((t) => t.estatus === 'Nuevo').length;
  const seleccionado = ticketsSoporte.items.find((t) => t.id === seleccionadoId) ?? null;

  // Cierre automatico: si el cliente no contesta 5 minutos despues de que
  // soporte respondio, el chat se cierra solo (revisa mientras esta pantalla
  // este abierta, igual que el widget del cliente).
  useEffect(() => {
    const t = setInterval(() => {
      ticketsSoporte.items.filter(debeAutoCerrarse).forEach((tk) => ticketsSoporte.update(tk.id, { estatus: 'Cerrado' }));
    }, 30_000);
    return () => clearInterval(t);
  }, [ticketsSoporte]);

  function finalizarChat() {
    if (!seleccionado) return;
    ticketsSoporte.update(seleccionado.id, { estatus: 'Cerrado' });
  }

  function reabrirChat() {
    if (!seleccionado) return;
    ticketsSoporte.update(seleccionado.id, { estatus: 'Atendido' });
  }

  async function enviarRespuesta() {
    if (!seleccionado || !respuesta.trim()) return;
    setEnviando(true);
    const nuevoMensaje: MensajeTicketSoporte = {
      id: uid('msg'),
      autor: 'soporte',
      texto: respuesta.trim(),
      fecha: new Date().toISOString(),
    };
    await ticketsSoporte.update(seleccionado.id, {
      mensajes: [...seleccionado.mensajes, nuevoMensaje],
      estatus: 'Atendido',
    });
    setRespuesta('');
    setEnviando(false);
  }

  const columns: Column<TicketSoporte>[] = [
    {
      header: 'Fecha',
      render: (t) => <span className="text-xs text-ink-500">{t.creadoEn ? new Date(t.creadoEn).toLocaleString('es-MX') : 'N/D'}</span>,
    },
    { header: 'Empresa', render: (t) => <span className="font-medium text-ink-100">{empresaNombre(t)}</span> },
    { header: 'Nombre', render: (t) => t.nombre },
    { header: 'Telefono', render: (t) => t.telefono || 'N/D' },
    { header: 'Ultimo mensaje', render: (t) => <span className="line-clamp-1 max-w-sm">{ultimoMensaje(t)}</span> },
    { header: 'Estatus', render: (t) => <StatusBadge status={t.estatus} tone={tonoEstatus(t.estatus)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Soporte Tecnico"
        subtitle="Conversaciones iniciadas desde el widget de soporte del ERP por usuarios de cualquier empresa."
        extra={
          <div className="flex items-center gap-1 rounded-lg border border-line-800 bg-bg-900 p-1">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === f ? 'bg-breco-500 text-white' : 'text-ink-500 hover:text-ink-100'
                }`}
              >
                {f === 'Nuevo' && nuevos > 0 ? `Nuevos (${nuevos})` : f}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrudTable
            columns={columns}
            rows={filtrados}
            keyFn={(t) => t.id}
            onEdit={() => {}}
            onDelete={() => {}}
            canEdit={false}
            canDelete={false}
            emptyMessage="No hay mensajes de soporte con este filtro."
            selectedKey={seleccionadoId}
            onRowClick={(t) => setSeleccionadoId((actual) => (actual === t.id ? null : t.id))}
          />
        </div>

        <div className="flex h-[560px] flex-col rounded-2xl border border-line-800 bg-bg-800">
          {seleccionado ? (
            <>
              <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-line-800 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-100">{empresaNombre(seleccionado)}</p>
                  <p className="text-xs text-ink-500">
                    {seleccionado.nombre} · {seleccionado.telefono || 'N/D'}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <StatusBadge status={seleccionado.estatus} tone={tonoEstatus(seleccionado.estatus)} />
                  {seleccionado.estatus === 'Cerrado' ? (
                    <ToolbarButton type="button" onClick={reabrirChat} className="px-2 py-1 text-xs">
                      <RotateCcw size={13} /> Reabrir
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton type="button" onClick={finalizarChat} className="px-2 py-1 text-xs">
                      <CircleSlash size={13} /> Finalizar chat
                    </ToolbarButton>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {seleccionado.mensajes.map((m) => (
                  <div key={m.id} className={`flex ${m.autor === 'soporte' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.autor === 'soporte'
                          ? 'rounded-br-sm bg-breco-500 text-white'
                          : 'rounded-bl-sm border border-line-700 bg-bg-900 text-ink-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.texto}</p>
                      <p className={`mt-1 text-[10px] ${m.autor === 'soporte' ? 'text-white/70' : 'text-ink-500'}`}>
                        {new Date(m.fecha).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {seleccionado.estatus === 'Cerrado' ? (
                <div className="flex-shrink-0 border-t border-line-800 p-3 text-center text-xs text-ink-500">
                  Esta conversacion esta finalizada. Usa "Reabrir" para seguir escribiendo.
                </div>
              ) : (
                <div className="flex flex-shrink-0 items-center gap-2 border-t border-line-800 p-3">
                  <input
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') enviarRespuesta();
                    }}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 rounded-lg border border-line-700 bg-bg-900 px-3 py-2 text-sm text-ink-100 outline-none focus:border-breco-500"
                  />
                  <button
                    type="button"
                    disabled={!respuesta.trim() || enviando}
                    onClick={enviarRespuesta}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-breco-500 text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-ink-500">
              <MessageSquareText size={28} />
              <p className="text-sm">Selecciona una conversacion de la tabla para ver el detalle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
