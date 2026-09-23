import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { IncidenciaViaje } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { ComboBoxCodigo } from '../../components/ui/ComboBoxCodigo';
import { Field, GhostButton, PrimaryButton, Select, Textarea } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const TIPOS_INCIDENCIA = ['Falla mecanica', 'Accidente', 'Retraso de carga/descarga', 'Clima', 'Seguridad', 'Otro'];

const emptyForm: Omit<IncidenciaViaje, 'id'> = {
  viajeId: '',
  tipo: 'Falla mecanica',
  descripcion: '',
  severidad: 'Media',
  estatus: 'Abierta',
};

export function MonitoreoIncidenciasPage() {
  const { incidenciasViaje, viajes, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Monitoreo', 'crear');
  const puedeEditar = hasPermission('Monitoreo', 'editar');
  const puedeEliminar = hasPermission('Monitoreo', 'eliminar');

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncidenciaViaje | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const viajeSeleccionado = viajes.items.find((v) => v.id === form.viajeId);

  function nombreCliente(clienteId?: string) {
    return clientes.items.find((c) => c.id === clienteId)?.nombre ?? '';
  }

  const filtered = useMemo(() => {
    const termino = search.toLowerCase();
    return incidenciasViaje.items
      .filter((i) => {
        if (!termino) return true;
        const v = viajes.items.find((x) => x.id === i.viajeId);
        return (
          (v?.folio ?? '').toLowerCase().includes(termino) ||
          i.tipo.toLowerCase().includes(termino) ||
          i.descripcion.toLowerCase().includes(termino)
        );
      })
      .slice()
      .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
  }, [incidenciasViaje.items, viajes.items, search]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(i: IncidenciaViaje) {
    setEditing(i);
    setForm({ ...i });
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.viajeId) {
      setError('Selecciona el viaje afectado.');
      return;
    }
    if (!form.descripcion.trim()) {
      setError('Describe la incidencia.');
      return;
    }
    setError('');
    if (editing) {
      incidenciasViaje.update(editing.id, form);
    } else {
      incidenciasViaje.add({ id: uid('inc'), ...form });
    }
    setModalOpen(false);
  }

  function resolver(i: IncidenciaViaje) {
    incidenciasViaje.update(i.id, { estatus: 'Resuelta', resueltoEn: new Date().toISOString() });
  }

  function handleDelete(i: IncidenciaViaje) {
    if (confirm(`Eliminar la incidencia "${i.tipo}"?`)) incidenciasViaje.remove(i.id);
  }

  const columns: Column<IncidenciaViaje>[] = [
    {
      header: 'Viaje',
      render: (i) => {
        const v = viajes.items.find((x) => x.id === i.viajeId);
        return (
          <div>
            <div className="font-semibold text-ink-100">{v?.folio ?? 'N/D'}</div>
            <div className="text-xs text-ink-600">{nombreCliente(v?.clienteId)}</div>
          </div>
        );
      },
    },
    { header: 'Tipo', render: (i) => i.tipo },
    { header: 'Descripcion', render: (i) => i.descripcion },
    {
      header: 'Severidad',
      render: (i) => <StatusBadge status={i.severidad} tone={i.severidad === 'Alta' ? 'red' : i.severidad === 'Media' ? 'amber' : 'gray'} />,
    },
    {
      header: 'Estatus',
      render: (i) => <StatusBadge status={i.estatus} tone={i.estatus === 'Abierta' ? 'red' : 'green'} />,
    },
    {
      header: 'Reportada',
      render: (i) => (i.creadoEn ? new Date(i.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '-'),
    },
    {
      header: '',
      render: (i) =>
        i.estatus === 'Abierta' &&
        puedeEditar && (
          <button
            type="button"
            onClick={() => resolver(i)}
            title="Marcar como resuelta"
            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
          >
            <CheckCircle2 size={13} /> Resolver
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Incidencias"
        subtitle="Eventos reportados sobre un viaje: fallas, accidentes, retrasos de carga, clima, seguridad."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por viaje, tipo o descripcion..."
        addLabel="Reportar incidencia"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(i) => i.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin incidencias reportadas."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editar incidencia' : 'Reportar incidencia'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

            <Field label="Viaje">
              <ComboBoxCodigo
                items={viajes.items}
                valor={viajeSeleccionado?.folio ?? ''}
                obtenerCodigo={(v) => v.folio}
                obtenerEtiqueta={(v) => nombreCliente(v.clienteId)}
                onSeleccionar={(v) => setForm((f) => ({ ...f, viajeId: v.id }))}
                onLimpiar={() => setForm((f) => ({ ...f, viajeId: '' }))}
                placeholder="Folio del viaje"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo">
                <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {TIPOS_INCIDENCIA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Severidad">
                <Select value={form.severidad} onChange={(e) => setForm({ ...form, severidad: e.target.value as IncidenciaViaje['severidad'] })}>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </Select>
              </Field>
            </div>

            <Field label="Descripcion">
              <Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>

            {editing && (
              <Field label="Estatus">
                <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as IncidenciaViaje['estatus'] })}>
                  <option value="Abierta">Abierta</option>
                  <option value="Resuelta">Resuelta</option>
                </Select>
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Reportar'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
