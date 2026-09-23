import { useMemo, useState } from 'react';
import { CheckCheck, MessageSquareText, RotateCcw } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import type { TicketSoporte } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { StatusBadge } from '../../components/ui/Badge';
import { ToolbarButton } from '../../components/ui/form';

const FILTROS = ['Todos', 'Nuevo', 'Atendido'] as const;

export function SoporteTecnicoSection() {
  const { ticketsSoporte, empresas } = useData();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function empresaNombre(t: TicketSoporte) {
    const real = empresas.items.find((e) => e.id === t.empresaId)?.nombre;
    return real || t.empresaTexto || 'N/D';
  }

  const filtrados = useMemo(() => {
    return ticketsSoporte.items
      .filter((t) => filtro === 'Todos' || t.estatus === filtro)
      .slice()
      .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
  }, [ticketsSoporte.items, filtro]);

  const nuevos = ticketsSoporte.items.filter((t) => t.estatus === 'Nuevo').length;
  const seleccionado = ticketsSoporte.items.find((t) => t.id === seleccionadoId) ?? null;

  function alternarEstatus(t: TicketSoporte) {
    ticketsSoporte.update(t.id, { estatus: t.estatus === 'Nuevo' ? 'Atendido' : 'Nuevo' });
  }

  const columns: Column<TicketSoporte>[] = [
    {
      header: 'Fecha',
      render: (t) => <span className="text-xs text-ink-500">{t.creadoEn ? new Date(t.creadoEn).toLocaleString('es-MX') : 'N/D'}</span>,
    },
    { header: 'Empresa', render: (t) => <span className="font-medium text-ink-100">{empresaNombre(t)}</span> },
    { header: 'Nombre', render: (t) => t.nombre },
    { header: 'Telefono', render: (t) => t.telefono || 'N/D' },
    { header: 'Problema', render: (t) => <span className="line-clamp-1 max-w-sm">{t.problema}</span> },
    { header: 'Estatus', render: (t) => <StatusBadge status={t.estatus} tone={t.estatus === 'Nuevo' ? 'amber' : 'green'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Soporte Tecnico"
        subtitle="Mensajes enviados desde el widget de soporte del ERP por usuarios de cualquier empresa."
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

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          {seleccionado ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">Empresa</p>
                  <p className="font-semibold text-ink-100">{empresaNombre(seleccionado)}</p>
                </div>
                <StatusBadge status={seleccionado.estatus} tone={seleccionado.estatus === 'Nuevo' ? 'amber' : 'green'} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Nombre</p>
                <p className="text-sm text-ink-100">{seleccionado.nombre}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Telefono</p>
                <p className="text-sm text-ink-100">{seleccionado.telefono || 'N/D'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Problema</p>
                <p className="whitespace-pre-wrap text-sm text-ink-100">{seleccionado.problema}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Recibido</p>
                <p className="text-sm text-ink-100">
                  {seleccionado.creadoEn ? new Date(seleccionado.creadoEn).toLocaleString('es-MX') : 'N/D'}
                </p>
              </div>
              <ToolbarButton type="button" onClick={() => alternarEstatus(seleccionado)} className="w-full justify-center">
                {seleccionado.estatus === 'Nuevo' ? (
                  <>
                    <CheckCheck size={16} /> Marcar como atendido
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} /> Reabrir
                  </>
                )}
              </ToolbarButton>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-ink-500">
              <MessageSquareText size={28} />
              <p className="text-sm">Selecciona un mensaje de la tabla para ver el detalle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
