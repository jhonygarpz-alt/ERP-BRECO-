import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Modulo, PermisoModulo, Rol } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';

const modulos: Modulo[] = ['Catalogos', 'Viajes', 'Facturacion', 'Programa', 'Reportes', 'Configuracion'];
const acciones: { key: keyof PermisoModulo; label: string }[] = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
];

function permisosVacios(): Record<Modulo, PermisoModulo> {
  return modulos.reduce(
    (acc, m) => ({ ...acc, [m]: { ver: false, crear: false, editar: false, eliminar: false } }),
    {} as Record<Modulo, PermisoModulo>,
  );
}

export function RolesSection() {
  const { roles } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Configuracion', 'crear');
  const puedeEditar = hasPermission('Configuracion', 'editar');
  const puedeEliminar = hasPermission('Configuracion', 'eliminar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);

  const emptyForm: Omit<Rol, 'id'> = { nombre: '', descripcion: '', permisos: permisosVacios() };
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: Rol) {
    setEditing(r);
    setForm(r);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      roles.update(editing.id, form);
    } else {
      roles.add({ id: uid('rol'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(r: Rol) {
    if (confirm(`Eliminar el rol "${r.nombre}"? Los usuarios con este rol quedaran sin rol asignado.`)) {
      roles.remove(r.id);
    }
  }

  function toggle(modulo: Modulo, accion: keyof PermisoModulo) {
    setForm((f) => ({
      ...f,
      permisos: {
        ...f.permisos,
        [modulo]: { ...f.permisos[modulo], [accion]: !f.permisos[modulo][accion] },
      },
    }));
  }

  const columns: Column<Rol>[] = [
    { header: 'Rol', render: (r) => <span className="font-medium text-ink-100">{r.nombre}</span> },
    { header: 'Descripcion', render: (r) => <span className="text-xs">{r.descripcion}</span> },
    {
      header: 'Modulos con acceso',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {modulos
            .filter((m) => r.permisos[m]?.ver)
            .map((m) => (
              <span key={m} className="rounded-full border border-line-700 bg-bg-900 px-2 py-0.5 text-[11px] text-ink-400">
                {m}
              </span>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles y permisos"
        subtitle="Que puede ver, crear, editar o eliminar cada rol en cada modulo."
        addLabel="Nuevo rol"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={roles.items}
        keyFn={(r) => r.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? `Editar rol: ${editing.nombre}` : 'Nuevo rol'}
          subtitle="Define el nombre y los permisos por modulo"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre del rol">
                <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </Field>
              <Field label="Descripcion">
                <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </Field>
            </div>

            <div className="overflow-hidden rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-3 py-2 font-medium">Modulo</th>
                    {acciones.map((a) => (
                      <th key={a.key} className="px-3 py-2 text-center font-medium">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modulos.map((m) => (
                    <tr key={m} className="border-b border-line-800/70 last:border-0">
                      <td className="px-3 py-2 text-ink-300">{m}</td>
                      {acciones.map((a) => (
                        <td key={a.key} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={form.permisos[m]?.[a.key] ?? false}
                            onChange={() => toggle(m, a.key)}
                            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Crear rol'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
