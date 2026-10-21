import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Articulo } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyForm: Omit<Articulo, 'id'> = { codigo: '', descripcion: '', unidadMedida: 'Pieza', precioUnitario: 0, activo: true };

export function ArticulosPage() {
  const { articulos } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');
  const puedeEliminar = hasPermission('Almacen', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Articulo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      articulos.items.filter(
        (a) =>
          a.descripcion.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [articulos.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(a: Articulo) {
    setEditing(a);
    setForm(a);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.descripcion.trim()) {
      setError('Falta el codigo o la descripcion.');
      return;
    }
    setError('');
    if (editing) {
      articulos.update(editing.id, form);
    } else {
      articulos.add({ id: uid('art'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(a: Articulo) {
    if (confirm(`Eliminar el articulo "${a.descripcion}"?`)) articulos.remove(a.id);
  }

  const columns: Column<Articulo>[] = [
    { header: 'Codigo', render: (a) => <span className="font-mono text-xs font-semibold text-ink-100">{a.codigo}</span> },
    { header: 'Descripcion', render: (a) => a.descripcion },
    { header: 'Unidad Medida', render: (a) => a.unidadMedida },
    { header: 'Precio Unitario', render: (a) => money(a.precioUnitario), className: 'text-right' },
    { header: 'Activo', render: (a) => <StatusBadge status={a.activo ? 'Si' : 'No'} tone={a.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Catalogo de Articulos"
        subtitle="Insumos y refacciones que se mueven por almacen."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar articulo..."
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
        emptyMessage="No hay articulos registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Articulo' : 'Agregando Articulo'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Codigo">
                <Input required autoFocus value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </Field>
              <Field label="Unidad de Medida">
                <Input value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} />
              </Field>
            </div>

            <Field label="Descripcion">
              <Input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>

            <div className="flex items-end justify-between gap-4">
              <div className="max-w-[180px] flex-1">
                <Field label="Precio Unitario">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioUnitario}
                    onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-300">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
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
