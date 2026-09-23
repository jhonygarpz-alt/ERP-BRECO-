import { useMemo, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { calcularTotalesArticulos } from '../../lib/almacen';
import type { Requisicion } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { RequisicionFormModal } from '../../components/almacen/RequisicionFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function RequisicionesPage() {
  const { requisiciones, proveedores } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Requisicion | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function proveedorTexto(id?: string) {
    return id ? proveedores.items.find((p) => p.id === id)?.nombre ?? 'N/D' : 'Sin proveedor';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return requisiciones.items
      .filter((r) => r.fecha >= desde && r.fecha <= hasta)
      .filter((r) => !termino || r.folio.toLowerCase().includes(termino) || proveedorTexto(r.proveedorId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [requisiciones.items, desde, hasta, busqueda, proveedores.items]);

  const seleccionado = requisiciones.items.find((r) => r.id === seleccionadoId) ?? null;

  function openNew() {
    setEditing(null);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function abrirConsultar() {
    if (!seleccionado) return;
    setEditing(seleccionado);
    setSoloLectura(true);
    setModalOpen(true);
  }
  function abrirEditar() {
    if (!seleccionado) return;
    setEditing(seleccionado);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function cancelar() {
    if (!seleccionado) return;
    if (confirm(`Cancelar la requisicion "${seleccionado.folio}"?`)) requisiciones.update(seleccionado.id, { estatus: 'Cancelada' });
  }
  function guardar(datos: Requisicion) {
    const yaExiste = requisiciones.items.some((r) => r.id === datos.id);
    if (yaExiste) requisiciones.update(datos.id, datos);
    else requisiciones.add(datos);
    setModalOpen(false);
  }
  function imprimir() {
    if (!seleccionado) return;
    window.open(`#/almacen/requisiciones/imprimir/${seleccionado.id}`, '_blank');
  }

  const columns: Column<Requisicion>[] = [
    { header: 'Folio', render: (r) => <span className="font-mono text-xs font-semibold text-ink-100">{r.folio}</span> },
    { header: 'Fecha', render: (r) => r.fecha },
    { header: 'Proveedor', render: (r) => proveedorTexto(r.proveedorId) },
    { header: 'Total', render: (r) => money(calcularTotalesArticulos(r.lineas).total), className: 'text-right' },
    { header: 'Estatus', render: (r) => <StatusBadge status={r.estatus} tone={r.estatus === 'Cancelada' ? 'red' : r.estatus === 'Aplicada' ? 'green' : 'amber'} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Requisiciones</h1>
        <p className="mt-1 text-sm text-ink-500">Peticion interna de compra; puede o no derivar en una Orden de Compra.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `Requisicion ${seleccionado.folio}` : 'Selecciona una requisicion de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.estatus !== 'Abierta'} onClick={abrirEditar}>
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado} onClick={imprimir}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.estatus !== 'Abierta'} onClick={cancelar}>
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
            placeholder="Folio o proveedor..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(r) => r.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin requisiciones en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(r) => setSeleccionadoId((actual) => (actual === r.id ? null : r.id))}
      />

      {modalOpen && <RequisicionFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />}
    </div>
  );
}
