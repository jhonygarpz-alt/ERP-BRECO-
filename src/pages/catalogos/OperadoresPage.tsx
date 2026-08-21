import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { EstatusOperador, Operador } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const estatuses: EstatusOperador[] = ['Disponible', 'En viaje', 'Descanso', 'Baja'];

const emptyForm: Omit<Operador, 'id'> = {
  nombre: '',
  licencia: '',
  tipoLicencia: 'Federal Tipo E',
  telefono: '',
  vigenciaLicencia: '',
  estatus: 'Disponible',
};

export function OperadoresPage() {
  const { operadores } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Operador | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      operadores.items.filter((o) => `${o.nombre} ${o.licencia}`.toLowerCase().includes(search.toLowerCase())),
    [operadores.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(o: Operador) {
    setEditing(o);
    setForm(o);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      operadores.update(editing.id, form);
    } else {
      operadores.add({ id: uid('op'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(o: Operador) {
    if (confirm(`Eliminar al operador "${o.nombre}"?`)) operadores.remove(o.id);
  }

  const columns: Column<Operador>[] = [
    { header: 'Nombre', render: (o) => <span className="font-medium text-ink-100">{o.nombre}</span> },
    { header: 'Licencia', render: (o) => `${o.licencia} (${o.tipoLicencia})` },
    { header: 'Telefono', render: (o) => o.telefono },
    { header: 'Vigencia licencia', render: (o) => o.vigenciaLicencia },
    { header: 'Estatus', render: (o) => <StatusBadge status={o.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Operadores"
        subtitle="Choferes disponibles para asignacion de viajes."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o licencia..."
        addLabel="Nuevo operador"
        onAdd={openNew}
      />

      <CrudTable columns={columns} rows={filtered} keyFn={(o) => o.id} onEdit={openEdit} onDelete={handleDelete} />

      {modalOpen && (
        <Modal
          title={editing ? 'Editar operador' : 'Nuevo operador'}
          subtitle="Datos del operador / chofer"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input required value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <Field label="Numero de licencia">
              <Input required value={form.licencia} onChange={(e) => setForm({ ...form, licencia: e.target.value })} />
            </Field>
            <Field label="Tipo de licencia">
              <Input
                required
                value={form.tipoLicencia}
                onChange={(e) => setForm({ ...form, tipoLicencia: e.target.value })}
              />
            </Field>
            <Field label="Vigencia de licencia">
              <Input
                type="date"
                required
                value={form.vigenciaLicencia}
                onChange={(e) => setForm({ ...form, vigenciaLicencia: e.target.value })}
              />
            </Field>
            <Field label="Estatus">
              <Select
                value={form.estatus}
                onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusOperador })}
              >
                {estatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Registrar operador'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
