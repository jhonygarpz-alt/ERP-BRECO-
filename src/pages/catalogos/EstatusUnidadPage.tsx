import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { EstatusUnidadCustom, TipoEstatusUnidad } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge, TONE_DOT, TONES, type Tone } from '../../components/ui/Badge';

const COLORES_DISPONIBLES = Object.keys(TONES) as Tone[];

const emptyForm: Omit<EstatusUnidadCustom, 'id'> = {
  nombre: '',
  color: 'blue',
  tipoEstatus: 'Disponible',
};

export function EstatusUnidadPage() {
  const { estatusUnidades } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EstatusUnidadCustom | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () => estatusUnidades.items.filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase())),
    [estatusUnidades.items, search],
  );

  function buscarDuplicado(): string | null {
    const nombre = form.nombre.trim();
    const otros = estatusUnidades.items.filter((e) => e.id !== editing?.id);
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

  function openEdit(e: EstatusUnidadCustom) {
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
      estatusUnidades.update(editing.id, form);
    } else {
      estatusUnidades.add({ id: uid('estu'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(e: EstatusUnidadCustom) {
    if (confirm(`Eliminar el estatus "${e.nombre}"?`)) estatusUnidades.remove(e.id);
  }

  const columns: Column<EstatusUnidadCustom>[] = [
    { header: 'Estatus', render: (e) => <StatusBadge status={e.nombre} tone={e.color as Tone} /> },
    { header: 'Tipo Estatus', render: (e) => e.tipoEstatus },
  ];

  return (
    <div>
      <PageHeader
        title="Estatus de Unidades"
        subtitle="Estatus disponibles para las unidades, cada uno con su color."
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
        canDelete={puedeEliminar}
        emptyMessage="No hay estatus registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Estatus de Unidades' : 'Agregando Estatus de Unidades'} onClose={() => setModalOpen(false)}>
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

            <Field label="Tipo Estatus">
              <Select
                value={form.tipoEstatus}
                onChange={(e) => setForm({ ...form, tipoEstatus: e.target.value as TipoEstatusUnidad })}
              >
                <option value="Disponible">Disponible</option>
                <option value="Ocupada">Ocupada</option>
              </Select>
            </Field>

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
