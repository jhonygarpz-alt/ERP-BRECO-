import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { Estatus, Usuario } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

export function UsuariosSection() {
  const { usuarios, roles } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);

  const emptyForm: Omit<Usuario, 'id'> = {
    nombre: '',
    email: '',
    telefono: '',
    rolId: roles.items[0]?.id ?? '',
    estatus: 'activo',
  };
  const [form, setForm] = useState(emptyForm);

  const rolNombre = (id: string) => roles.items.find((r) => r.id === id)?.nombre ?? 'N/D';

  const filtered = useMemo(
    () =>
      usuarios.items.filter((u) => `${u.nombre} ${u.email}`.toLowerCase().includes(search.toLowerCase())),
    [usuarios.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm(u);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      usuarios.update(editing.id, form);
    } else {
      usuarios.add({ id: uid('usr'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(u: Usuario) {
    if (confirm(`Eliminar al usuario "${u.nombre}"?`)) usuarios.remove(u.id);
  }

  const columns: Column<Usuario>[] = [
    { header: 'Nombre', render: (u) => <span className="font-medium text-ink-100">{u.nombre}</span> },
    { header: 'Email', render: (u) => u.email },
    { header: 'Telefono', render: (u) => u.telefono },
    { header: 'Rol', render: (u) => rolNombre(u.rolId) },
    { header: 'Estatus', render: (u) => <StatusBadge status={u.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Personas con acceso al sistema y su rol asignado."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o email..."
        addLabel="Nuevo usuario"
        onAdd={openNew}
      />

      <CrudTable columns={columns} rows={filtered} keyFn={(u) => u.id} onEdit={openEdit} onDelete={handleDelete} />

      {modalOpen && (
        <Modal
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          subtitle="Acceso y rol dentro del sistema"
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nombre completo">
                <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </Field>
            </div>
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <Field label="Rol">
              <Select value={form.rolId} onChange={(e) => setForm({ ...form, rolId: e.target.value })}>
                {roles.items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as Estatus })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </Field>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Crear usuario'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
