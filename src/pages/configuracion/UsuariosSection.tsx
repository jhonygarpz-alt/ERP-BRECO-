import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabaseAuthAlta } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import type { Estatus, Usuario } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

export function UsuariosSection() {
  const { usuarios, roles } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Configuracion', 'crear');
  const puedeEditar = hasPermission('Configuracion', 'editar');
  const puedeEliminar = hasPermission('Configuracion', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

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
    setPasswordTemporal('');
    setError('');
    setModalOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm(u);
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      usuarios.update(editing.id, form);
      setModalOpen(false);
      return;
    }

    setError('');
    setCreando(true);
    try {
      const { data, error: errAuth } = await supabaseAuthAlta.auth.signUp({
        email: form.email.trim(),
        password: passwordTemporal,
      });
      if (errAuth) {
        setError(mensajeDeError(errAuth));
        return;
      }
      const nuevoId = data.user?.id;
      if (!nuevoId) {
        setError('Supabase no devolvio el usuario creado. Intenta de nuevo.');
        return;
      }
      await usuarios.add({ id: nuevoId, ...form });
      setModalOpen(false);
      alert(
        data.session
          ? `Usuario creado. Ya puede iniciar sesion con ${form.email.trim()} y la contrasena que capturaste.`
          : `Usuario creado. Supabase le va a pedir confirmar ${form.email.trim()} por correo antes de poder iniciar sesion.`,
      );
    } finally {
      setCreando(false);
    }
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
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(u) => u.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          subtitle="Acceso y rol dentro del sistema"
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!editing && (
              <div className="rounded-xl border border-line-700 bg-bg-900 p-3 text-xs text-ink-400 sm:col-span-2">
                Se crea la cuenta de acceso directo (correo + contrasena temporal) y su perfil en el sistema al mismo
                tiempo. Comparte esa contrasena con la persona para que inicie sesion y la cambie despues.
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label="Nombre completo">
                <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </Field>
            </div>
            <Field label="Email">
              <Input
                type="email"
                required
                disabled={!!editing}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            {!editing && (
              <div className="sm:col-span-2">
                <Field label="Contrasena temporal">
                  <Input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                    value={passwordTemporal}
                    onChange={(e) => setPasswordTemporal(e.target.value)}
                  />
                </Field>
              </div>
            )}
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

            {error && <p className="text-sm text-breco-500 sm:col-span-2">{error}</p>}

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit" disabled={creando}>
                {creando ? 'Creando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
