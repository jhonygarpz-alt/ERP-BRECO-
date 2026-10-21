import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Almacen } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<Almacen, 'id'> = { codigo: '', nombre: '', activo: true };

export function AlmacenesPage() {
  const { almacenes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');
  const puedeEliminar = hasPermission('Almacen', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Almacen | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      almacenes.items.filter(
        (a) => a.nombre.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [almacenes.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = almacenes.items.map((a) => parseInt(a.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(3, '0');
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(a: Almacen) {
    setEditing(a);
    setForm(a);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('Falta el nombre del almacen.');
      return;
    }
    setError('');
    if (editing) {
      almacenes.update(editing.id, form);
    } else {
      almacenes.add({ id: uid('alm'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(a: Almacen) {
    if (confirm(`Eliminar el almacen "${a.nombre}"?`)) almacenes.remove(a.id);
  }

  const columns: Column<Almacen>[] = [
    { header: 'Codigo', render: (a) => <span className="font-mono text-xs font-semibold text-ink-100">{a.codigo}</span> },
    { header: 'Almacen', render: (a) => a.nombre },
    { header: 'Activo', render: (a) => <StatusBadge status={a.activo ? 'Si' : 'No'} tone={a.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Catalogo de Almacenes"
        subtitle="Ubicaciones fisicas donde se resguarda inventario."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar almacen..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(a) => a.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay almacenes registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Almacen' : 'Agregando Almacen'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[140px]">
                <Field label="Codigo">
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
            </div>

            <Field label="Almacen">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
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
