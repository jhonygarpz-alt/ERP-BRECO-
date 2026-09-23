import { useMemo, useState } from 'react';
import { Ban, Eye, Plus, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import type { NotaCredito } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { NotaCreditoFormModal } from '../../components/cobranza/NotaCreditoFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function CobranzaNotasCreditoPage() {
  const { notasCredito, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Cobranza', 'crear');
  const puedeEditar = hasPermission('Cobranza', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotaCredito | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  function nombreCliente(id: string) {
    return clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return notasCredito.items
      .filter((n) => n.fecha >= desde && n.fecha <= hasta)
      .filter((n) => !termino || n.folio.toLowerCase().includes(termino) || nombreCliente(n.clienteId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [notasCredito.items, desde, hasta, busqueda, clientes.items]);

  const seleccionada = notasCredito.items.find((n) => n.id === seleccionadaId) ?? null;

  function openNew() {
    setEditing(null);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function abrirConsultar() {
    if (!seleccionada) return;
    setEditing(seleccionada);
    setSoloLectura(true);
    setModalOpen(true);
  }

  function cancelar() {
    if (!seleccionada) return;
    if (confirm(`Cancelar la nota de credito "${seleccionada.folio}"? Las facturas que afecto volveran a tener ese saldo pendiente.`)) {
      notasCredito.update(seleccionada.id, { estatus: 'Cancelada' });
    }
  }

  function guardar(datos: Omit<NotaCredito, 'id'>) {
    if (editing) {
      notasCredito.update(editing.id, datos);
    } else {
      notasCredito.add({ id: uid('nc'), ...datos });
    }
    setModalOpen(false);
  }

  function imprimir() {
    if (!seleccionada) return;
    window.open(`#/cobranza/notas-credito/imprimir/${seleccionada.id}`, '_blank');
  }

  const columns: Column<NotaCredito>[] = [
    { header: 'Documento', render: (n) => <span className="font-mono text-xs font-semibold text-ink-100">{n.folio}</span> },
    { header: 'Fecha', render: (n) => n.fecha },
    { header: 'Cliente', render: (n) => nombreCliente(n.clienteId) },
    { header: 'Total', render: (n) => <span className="font-semibold text-ink-100">{money(n.total)}</span>, className: 'text-right' },
    { header: 'Estatus', render: (n) => <StatusBadge status={n.estatus} tone={n.estatus === 'Cancelada' ? 'red' : 'green'} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Notas de Credito</h1>
        <p className="mt-1 text-sm text-ink-500">Reduce el saldo de una o mas facturas de un cliente.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionada ? `Nota ${seleccionada.folio}` : 'Selecciona una nota de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionada} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada} onClick={imprimir}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada || !puedeEditar || seleccionada?.estatus === 'Cancelada'} onClick={cancelar}>
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Desde
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Hasta
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </label>
        <div className="relative flex-1">
          <label className="mb-1 block text-xs text-ink-500">Buscar</label>
          <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-ink-600" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Folio o cliente..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(n) => n.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin notas de credito en el rango seleccionado."
        selectedKey={seleccionadaId}
        onRowClick={(n) => setSeleccionadaId((actual) => (actual === n.id ? null : n.id))}
      />

      {modalOpen && (
        <NotaCreditoFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
