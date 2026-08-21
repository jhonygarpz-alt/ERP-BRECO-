import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Caja, EstatusCaja, TipoCaja } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const tipos: TipoCaja[] = ['Seca', 'Refrigerada', 'Plataforma', 'Contenedor'];
const estatuses: EstatusCaja[] = ['Disponible', 'En uso', 'Mantenimiento'];

const emptyForm: Omit<Caja, 'id'> = {
  economico: '',
  placas: '',
  tipo: 'Seca',
  capacidad: '',
  estatus: 'Disponible',
};

export function CajasPage() {
  const { cajas } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Caja | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      cajas.items.filter((c) => `${c.economico} ${c.placas} ${c.tipo}`.toLowerCase().includes(search.toLowerCase())),
    [cajas.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Caja) {
    setEditing(c);
    setForm(c);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      cajas.update(editing.id, form);
    } else {
      cajas.add({ id: uid('caj'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: Caja) {
    if (confirm(`Eliminar la caja "${c.economico}"?`)) cajas.remove(c.id);
  }

  const columns: Column<Caja>[] = [
    { header: 'Economico', render: (c) => <span className="font-medium text-ink-100">{c.economico}</span> },
    { header: 'Placas', render: (c) => c.placas },
    { header: 'Tipo', render: (c) => c.tipo },
    { header: 'Capacidad', render: (c) => c.capacidad },
    { header: 'Estatus', render: (c) => <StatusBadge status={c.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Cajas"
        subtitle="Cajas secas, refrigeradas y plataformas disponibles."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por economico, placas o tipo..."
        addLabel="Nueva caja"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(c) => c.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? 'Editar caja' : 'Nueva caja'}
          subtitle="Datos del remolque / caja"
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Numero economico">
              <Input required value={form.economico} onChange={(e) => setForm({ ...form, economico: e.target.value })} />
            </Field>
            <Field label="Placas">
              <Input required value={form.placas} onChange={(e) => setForm({ ...form, placas: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCaja })}>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusCaja })}>
                {estatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Capacidad">
                <Input
                  required
                  placeholder="Ej. 53 pies"
                  value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Registrar caja'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
