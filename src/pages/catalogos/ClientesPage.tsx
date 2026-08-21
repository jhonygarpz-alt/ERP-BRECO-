import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Cliente } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<Cliente, 'id'> = {
  nombre: '',
  rfc: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  estatus: 'activo',
};

export function ClientesPage() {
  const { clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      clientes.items.filter((c) =>
        `${c.nombre} ${c.rfc} ${c.contacto}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [clientes.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm(c);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      clientes.update(editing.id, form);
    } else {
      clientes.add({ id: uid('cli'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: Cliente) {
    if (confirm(`Eliminar al cliente "${c.nombre}"?`)) clientes.remove(c.id);
  }

  const columns: Column<Cliente>[] = [
    {
      header: 'Cliente',
      render: (c) => (
        <div>
          <div className="font-medium text-ink-100">{c.nombre}</div>
          <div className="text-xs text-ink-600">{c.rfc}</div>
        </div>
      ),
    },
    { header: 'Contacto', render: (c) => c.contacto },
    {
      header: 'Telefono / Email',
      render: (c) => (
        <div>
          <div>{c.telefono}</div>
          <div className="text-xs text-ink-600">{c.email}</div>
        </div>
      ),
    },
    { header: 'Direccion', render: (c) => <span className="text-xs">{c.direccion}</span> },
    { header: 'Estatus', render: (c) => <StatusBadge status={c.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Catalogo de clientes que solicitan servicios de transporte."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, RFC o contacto..."
        addLabel="Nuevo cliente"
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
          title={editing ? 'Editar cliente' : 'Nuevo cliente'}
          subtitle="Informacion general del cliente"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Razon social">
              <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="RFC">
              <Input required value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} />
            </Field>
            <Field label="Contacto">
              <Input required value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input required value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as Cliente['estatus'] })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Direccion">
                <Input
                  required
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Registrar cliente'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
