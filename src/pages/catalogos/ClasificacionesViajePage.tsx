import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { ClasificacionViaje } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<ClasificacionViaje, 'id'> = {
  codigo: '',
  clasificacion: '',
  activo: true,
};

export function ClasificacionesViajePage() {
  const { clasificacionesViaje } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClasificacionViaje | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      clasificacionesViaje.items.filter(
        (c) =>
          c.clasificacion.toLowerCase().includes(search.toLowerCase()) ||
          c.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [clasificacionesViaje.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = clasificacionesViaje.items
      .map((c) => parseInt(c.codigo, 10))
      .filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const clasificacion = form.clasificacion.trim();
    const otros = clasificacionesViaje.items.filter((c) => c.id !== editing?.id);
    if (codigo && otros.some((c) => c.codigo.trim() === codigo)) {
      return `Ya existe una clasificacion con el codigo "${codigo}".`;
    }
    if (clasificacion && otros.some((c) => c.clasificacion.toLowerCase() === clasificacion.toLowerCase())) {
      return `Ya existe una clasificacion llamada "${clasificacion}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: ClasificacionViaje) {
    setEditing(c);
    setForm(c);
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
      clasificacionesViaje.update(editing.id, form);
    } else {
      clasificacionesViaje.add({ id: uid('clv'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: ClasificacionViaje) {
    if (confirm(`Eliminar la clasificacion "${c.clasificacion}"?`)) clasificacionesViaje.remove(c.id);
  }

  const columns: Column<ClasificacionViaje>[] = [
    { header: 'Codigo', render: (c) => c.codigo },
    { header: 'Clasificacion', render: (c) => c.clasificacion },
    {
      header: 'Activo',
      render: (c) => <StatusBadge status={c.activo ? 'Si' : 'No'} tone={c.activo ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clasificaciones de Viaje"
        subtitle="Clasificaciones disponibles para los viajes (ej. Sencillo, Full)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar clasificacion..."
        addLabel="Agregar"
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
        emptyMessage="No hay clasificaciones registradas."
      />

      {modalOpen && (
        <Modal
          title={editing ? 'Editando Clasificacion de Viaje' : 'Agregando Clasificacion de Viaje'}
          onClose={() => setModalOpen(false)}
        >
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

            <Field label="Clasificacion">
              <Input
                required
                autoFocus
                value={form.clasificacion}
                onChange={(e) => setForm({ ...form, clasificacion: e.target.value })}
              />
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
