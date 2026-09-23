import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Mecanico } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<Mecanico, 'id'> = { numero: '', nombre: '', tipo: 'Mecanico', activo: true };

export function MecanicosPage() {
  const { mecanicos } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');
  const puedeEditar = hasPermission('Mantenimiento', 'editar');
  const puedeEliminar = hasPermission('Mantenimiento', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mecanico | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () => mecanicos.items.filter((m) => m.nombre.toLowerCase().includes(search.toLowerCase()) || m.numero.toLowerCase().includes(search.toLowerCase())),
    [mecanicos.items, search],
  );

  function siguienteNumero(): string {
    const numeros = mecanicos.items.map((m) => parseInt(m.numero, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, numero: siguienteNumero() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(m: Mecanico) {
    setEditing(m);
    setForm(m);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('Falta el nombre.');
      return;
    }
    setError('');
    if (editing) {
      mecanicos.update(editing.id, form);
    } else {
      mecanicos.add({ id: uid('mec'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(m: Mecanico) {
    if (confirm(`Eliminar a "${m.nombre}"?`)) mecanicos.remove(m.id);
  }

  const columns: Column<Mecanico>[] = [
    { header: 'Numero', render: (m) => m.numero },
    { header: 'Nombre', render: (m) => m.nombre },
    { header: 'Tipo', render: (m) => <StatusBadge status={m.tipo} tone={m.tipo === 'Mecanico' ? 'blue' : 'purple'} /> },
    { header: 'Activo', render: (m) => <StatusBadge status={m.activo ? 'Si' : 'No'} tone={m.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Mecanicos y Ayudantes"
        subtitle="Roster interno de quien realiza las reparaciones en Ordenes de Servicio."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar mecanico..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(m) => m.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay mecanicos registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Mecanico' : 'Agregando Mecanico'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[140px]">
                <Field label="Numero">
                  <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
            </div>

            <Field label="Nombre">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>

            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Mecanico['tipo'] })}>
                <option value="Mecanico">Mecanico</option>
                <option value="Ayudante">Ayudante</option>
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
