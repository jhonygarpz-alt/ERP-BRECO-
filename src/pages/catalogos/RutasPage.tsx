import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { Ruta } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<Ruta, 'id'> = {
  codigo: '',
  descripcion: '',
  activo: true,
};

export function RutasPage() {
  const { rutas } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ruta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      rutas.items.filter(
        (r) => r.descripcion.toLowerCase().includes(search.toLowerCase()) || r.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [rutas.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = rutas.items.map((r) => parseInt(r.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const descripcion = form.descripcion.trim();
    const otras = rutas.items.filter((r) => r.id !== editing?.id);
    if (codigo && otras.some((r) => r.codigo.trim() === codigo)) return `Ya existe una ruta con el codigo "${codigo}".`;
    if (descripcion && otras.some((r) => r.descripcion.toLowerCase() === descripcion.toLowerCase())) {
      return `Ya existe una ruta llamada "${descripcion}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: Ruta) {
    setEditing(r);
    setForm(r);
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
      rutas.update(editing.id, form);
    } else {
      rutas.add({ id: uid('rt'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(r: Ruta) {
    if (confirm(`Eliminar la ruta "${r.descripcion}"?`)) rutas.remove(r.id);
  }

  const columns: Column<Ruta>[] = [
    { header: 'Codigo', render: (r) => r.codigo },
    { header: 'Ruta', render: (r) => r.descripcion },
    { header: 'Activo', render: (r) => <StatusBadge status={r.activo ? 'Si' : 'No'} tone={r.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Rutas"
        subtitle="Rutas disponibles para los viajes."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar ruta..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(r) => r.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay rutas registradas."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Ruta' : 'Agregando Ruta'} onClose={() => setModalOpen(false)}>
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

            <Field label="Ruta">
              <Input required autoFocus value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
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
