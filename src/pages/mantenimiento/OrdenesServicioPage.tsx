import { useMemo, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { totalManoObra } from '../../lib/mantenimiento';
import type { OrdenServicio } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { OrdenServicioFormModal } from '../../components/mantenimiento/OrdenServicioFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function OrdenesServicioPage() {
  const { ordenesServicio, unidades } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');
  const puedeEditar = hasPermission('Mantenimiento', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenServicio | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function unidadTexto(id: string) {
    const u = unidades.items.find((uu) => uu.id === id);
    return u ? `${u.economico} - ${u.placas}` : 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return ordenesServicio.items
      .filter((o) => o.fecha >= desde && o.fecha <= hasta)
      .filter((o) => !termino || o.folio.toLowerCase().includes(termino) || unidadTexto(o.unidadId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [ordenesServicio.items, desde, hasta, busqueda, unidades.items]);

  const seleccionada = ordenesServicio.items.find((o) => o.id === seleccionadoId) ?? null;

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
    if (confirm(`Cancelar la orden "${seleccionada.folio}"?`)) ordenesServicio.update(seleccionada.id, { estatus: 'Cancelada' });
  }

  function guardar(datos: OrdenServicio) {
    const yaExiste = ordenesServicio.items.some((o) => o.id === datos.id);
    if (yaExiste) {
      ordenesServicio.update(datos.id, datos);
    } else {
      ordenesServicio.add(datos);
    }
    setModalOpen(false);
  }

  const toneEstatus = (estatus: OrdenServicio['estatus']) =>
    estatus === 'Concluida' ? 'green' : estatus === 'Cancelada' ? 'red' : estatus === 'En Proceso' ? 'blue' : 'amber';

  const columns: Column<OrdenServicio>[] = [
    { header: 'Folio', render: (o) => <span className="font-mono text-xs font-semibold text-ink-100">{o.folio}</span> },
    { header: 'Fecha', render: (o) => o.fecha },
    { header: 'Unidad', render: (o) => unidadTexto(o.unidadId) },
    { header: 'Tipo', render: (o) => o.tipo },
    { header: 'Tipo de Servicio', render: (o) => o.tipoServicio },
    { header: 'Mano de Obra', render: (o) => money(totalManoObra(o.lineas)), className: 'text-right' },
    { header: 'Estatus', render: (o) => <StatusBadge status={o.estatus} tone={toneEstatus(o.estatus)} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Ordenes de Servicio</h1>
        <p className="mt-1 text-sm text-ink-500">Registra una nueva orden de servicio para el mantenimiento de la unidad.</p>
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
        <ToolbarButton type="button" disabled={!seleccionada || !puedeEditar} onClick={abrirEditar}>
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
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
            placeholder="Folio o unidad..."
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
        emptyMessage="Sin ordenes de servicio en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(o) => setSeleccionadoId((actual) => (actual === o.id ? null : o.id))}
      />

      {modalOpen && (
        <OrdenServicioFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
