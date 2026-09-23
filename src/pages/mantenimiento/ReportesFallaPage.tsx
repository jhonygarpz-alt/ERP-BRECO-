import { useMemo, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import type { ReporteFalla } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { ReporteFallaFormModal } from '../../components/mantenimiento/ReporteFallaFormModal';

export function ReportesFallaPage() {
  const { reportesFalla, unidades } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');
  const puedeEditar = hasPermission('Mantenimiento', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReporteFalla | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function unidadTexto(id: string) {
    const u = unidades.items.find((uu) => uu.id === id);
    return u ? `${u.economico} - ${u.placas}` : 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return reportesFalla.items
      .filter((r) => r.fecha >= desde && r.fecha <= hasta)
      .filter((r) => !termino || r.folio.toLowerCase().includes(termino) || unidadTexto(r.unidadId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [reportesFalla.items, desde, hasta, busqueda, unidades.items]);

  const seleccionado = reportesFalla.items.find((r) => r.id === seleccionadoId) ?? null;

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
    if (confirm(`Cancelar el reporte "${seleccionado.folio}"?`)) reportesFalla.update(seleccionado.id, { estatus: 'Cancelado' });
  }

  function guardar(datos: ReporteFalla) {
    const yaExiste = reportesFalla.items.some((r) => r.id === datos.id);
    if (yaExiste) {
      reportesFalla.update(datos.id, datos);
    } else {
      reportesFalla.add(datos);
    }
    setModalOpen(false);
  }

  const columns: Column<ReporteFalla>[] = [
    { header: 'Folio', render: (r) => <span className="font-mono text-xs font-semibold text-ink-100">{r.folio}</span> },
    { header: 'Fecha', render: (r) => r.fecha },
    { header: 'Unidad', render: (r) => unidadTexto(r.unidadId) },
    { header: 'Descripcion', render: (r) => <span className="line-clamp-1 max-w-xs">{r.descripcion}</span> },
    { header: 'Estatus', render: (r) => <StatusBadge status={r.estatus} tone={r.estatus === 'Abierto' ? 'amber' : r.estatus === 'Atendido' ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Reportes de Fallas</h1>
        <p className="mt-1 text-sm text-ink-500">Registra una nueva falla para dar seguimiento al mantenimiento de la unidad.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `Reporte ${seleccionado.folio}` : 'Selecciona un reporte de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar} onClick={abrirEditar}>
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.estatus === 'Cancelado'} onClick={cancelar}>
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
        keyFn={(r) => r.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin reportes de falla en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(r) => setSeleccionadoId((actual) => (actual === r.id ? null : r.id))}
      />

      {modalOpen && (
        <ReporteFallaFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
