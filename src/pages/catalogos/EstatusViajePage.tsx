import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { EstatusViajeCustom } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge, TONE_DOT, TONES, type Tone } from '../../components/ui/Badge';

const COLORES_DISPONIBLES = Object.keys(TONES) as Tone[];

const emptyForm: Omit<EstatusViajeCustom, 'id'> = {
  nombre: '',
  color: 'blue',
  activo: true,
  esCarga: false,
  esDescarga: false,
  esTerminoDescarga: false,
};

export function EstatusViajePage() {
  const { estatusViajes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear') || hasPermission('Viajes', 'editar');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EstatusViajeCustom | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () => estatusViajes.items.filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase())),
    [estatusViajes.items, search],
  );

  function buscarDuplicado(): string | null {
    const nombre = form.nombre.trim();
    const otros = estatusViajes.items.filter((e) => e.id !== editing?.id);
    if (nombre && otros.some((e) => e.nombre.toLowerCase() === nombre.toLowerCase())) {
      return `Ya existe un estatus llamado "${nombre}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(e: EstatusViajeCustom) {
    setEditing(e);
    setForm(e);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duplicado = buscarDuplicado();
    if (duplicado) {
      setError(duplicado);
      return;
    }
    setError('');
    if (editing) {
      estatusViajes.update(editing.id, form);
    } else {
      estatusViajes.add({ id: uid('est'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(e: EstatusViajeCustom) {
    if (confirm(`Eliminar el estatus "${e.nombre}"?`)) estatusViajes.remove(e.id);
  }

  const columns: Column<EstatusViajeCustom>[] = [
    {
      header: 'Estatus',
      render: (e) => <StatusBadge status={e.nombre} tone={e.color as Tone} />,
    },
    {
      header: 'Se usa en',
      render: (e) => (
        <span className="text-xs text-ink-500">
          {[e.esCarga && 'Carga', e.esDescarga && 'Descarga', e.esTerminoDescarga && 'Termino Descarga'].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      header: 'Activo',
      render: (e) => <StatusBadge status={e.activo ? 'Si' : 'No'} tone={e.activo ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Estatus de Viaje"
        subtitle="Estatus disponibles para los viajes, cada uno con su color."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar estatus..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(e) => e.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEditar}
        emptyMessage="No hay estatus registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando estatus' : 'Agregando estatus'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Estatus">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>

            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-500">Color</span>
              <div className="flex flex-wrap items-center gap-2">
                {COLORES_DISPONIBLES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-7 w-7 rounded-full ${TONE_DOT[c]} ${
                      form.color === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Activo
            </label>

            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-500">Se usa en</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input type="checkbox" checked={form.esCarga} onChange={(e) => setForm({ ...form, esCarga: e.target.checked })} />
                  Carga
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input type="checkbox" checked={form.esDescarga} onChange={(e) => setForm({ ...form, esDescarga: e.target.checked })} />
                  Descarga
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.esTerminoDescarga}
                    onChange={(e) => setForm({ ...form, esTerminoDescarga: e.target.checked })}
                  />
                  Término Descarga
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">Aceptar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
