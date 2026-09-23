import { useMemo, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { calcularTotalesArticulos } from '../../lib/almacen';
import type { OrdenCompra } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { OrdenCompraFormModal } from '../../components/almacen/OrdenCompraFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function OrdenesCompraPage() {
  const { ordenesCompra, proveedores } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenCompra | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function proveedorTexto(id: string) {
    return proveedores.items.find((p) => p.id === id)?.nombre ?? 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return ordenesCompra.items
      .filter((o) => o.fecha >= desde && o.fecha <= hasta)
      .filter((o) => !termino || o.folio.toLowerCase().includes(termino) || proveedorTexto(o.proveedorId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [ordenesCompra.items, desde, hasta, busqueda, proveedores.items]);

  const seleccionada = ordenesCompra.items.find((o) => o.id === seleccionadoId) ?? null;

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
  function abrirEditar() {
    if (!seleccionada) return;
    setEditing(seleccionada);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function cancelar() {
    if (!seleccionada) return;
    if (confirm(`Cancelar la orden de compra "${seleccionada.folio}"?`)) ordenesCompra.update(seleccionada.id, { estatus: 'Cancelada' });
  }
  function guardar(datos: OrdenCompra) {
    const yaExiste = ordenesCompra.items.some((o) => o.id === datos.id);
    if (yaExiste) ordenesCompra.update(datos.id, datos);
    else ordenesCompra.add(datos);
    setModalOpen(false);
  }

  const toneEstatus = (estatus: OrdenCompra['estatus']) =>
    estatus === 'Recibida' ? 'green' : estatus === 'Cancelada' ? 'red' : estatus === 'Parcialmente Recibida' ? 'blue' : 'amber';

  const columns: Column<OrdenCompra>[] = [
    { header: 'Folio', render: (o) => <span className="font-mono text-xs font-semibold text-ink-100">{o.folio}</span> },
    { header: 'Fecha', render: (o) => o.fecha },
    { header: 'Proveedor', render: (o) => proveedorTexto(o.proveedorId) },
    { header: 'Total', render: (o) => money(calcularTotalesArticulos(o.lineas).total), className: 'text-right' },
    { header: 'Estatus', render: (o) => <StatusBadge status={o.estatus} tone={toneEstatus(o.estatus)} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Ordenes de Compra</h1>
        <p className="mt-1 text-sm text-ink-500">Autoriza a un proveedor a surtir articulos; puede venir de una Requisicion o crearse directa.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionada ? `Orden ${seleccionada.folio}` : 'Selecciona una orden de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton
          type="button"
          disabled={!seleccionada || !puedeEditar || seleccionada?.estatus === 'Cancelada' || seleccionada?.estatus === 'Recibida'}
          onClick={abrirEditar}
        >
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!seleccionada || !puedeEditar || seleccionada?.estatus === 'Cancelada' || seleccionada?.estatus === 'Recibida'}
          onClick={cancelar}
        >
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
        keyFn={(o) => o.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin ordenes de compra en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(o) => setSeleccionadoId((actual) => (actual === o.id ? null : o.id))}
      />

      {modalOpen && <OrdenCompraFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />}
    </div>
  );
}
