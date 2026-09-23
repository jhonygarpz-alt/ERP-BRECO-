import { useMemo, useState } from 'react';
import { Eye, Plus, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import type { ChecklistFisicomecanico } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { ChecklistFisicomecanicoFormModal } from '../../components/mantenimiento/ChecklistFisicomecanicoFormModal';

export function ChecklistFisicomecanicoPage() {
  const { checklistsFisicomecanicos, unidades } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistFisicomecanico | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function unidadTexto(id: string) {
    const u = unidades.items.find((uu) => uu.id === id);
    return u ? `${u.economico} - ${u.placas}` : 'N/D';
  }

  function resultadoResumen(c: ChecklistFisicomecanico) {
    const malos = c.items.filter((i) => i.resultado === 'Malo').length;
    const regulares = c.items.filter((i) => i.resultado === 'Regular').length;
    if (malos > 0) return { texto: `${malos} malo(s)`, tone: 'red' as const };
    if (regulares > 0) return { texto: `${regulares} regular(es)`, tone: 'amber' as const };
    return { texto: 'Todo bien', tone: 'green' as const };
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return checklistsFisicomecanicos.items
      .filter((c) => c.fecha >= desde && c.fecha <= hasta)
      .filter((c) => !termino || c.folio.toLowerCase().includes(termino) || unidadTexto(c.unidadId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [checklistsFisicomecanicos.items, desde, hasta, busqueda, unidades.items]);

  const seleccionado = checklistsFisicomecanicos.items.find((c) => c.id === seleccionadoId) ?? null;

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

  function guardar(datos: Omit<ChecklistFisicomecanico, 'id'>) {
    if (editing) {
      checklistsFisicomecanicos.update(editing.id, datos);
    } else {
      checklistsFisicomecanicos.add({ id: uid('chk'), ...datos });
    }
    setModalOpen(false);
  }

  const columns: Column<ChecklistFisicomecanico>[] = [
    { header: 'Folio', render: (c) => <span className="font-mono text-xs font-semibold text-ink-100">{c.folio}</span> },
    { header: 'Fecha', render: (c) => c.fecha },
    { header: 'Unidad', render: (c) => unidadTexto(c.unidadId) },
    {
      header: 'Resultado',
      render: (c) => {
        const r = resultadoResumen(c);
        return <StatusBadge status={r.texto} tone={r.tone} />;
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Checklist Fisicomecanico Rapido</h1>
        <p className="mt-1 text-sm text-ink-500">Inspeccion visual rapida de una unidad (llantas, frenos, luces, niveles, etc.).</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `Checklist ${seleccionado.folio}` : 'Selecciona un checklist de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Nuevo Checklist
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
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
        keyFn={(c) => c.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin checklists registrados en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(c) => setSeleccionadoId((actual) => (actual === c.id ? null : c.id))}
      />

      {modalOpen && (
        <ChecklistFisicomecanicoFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
