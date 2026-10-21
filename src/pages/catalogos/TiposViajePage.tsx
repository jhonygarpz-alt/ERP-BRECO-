import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { TipoViaje } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<TipoViaje, 'id'> = {
  codigo: '',
  tipoViaje: '',
  activo: true,
};

export function TiposViajePage() {
  const { tiposViaje } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoViaje | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      tiposViaje.items.filter(
        (t) => t.tipoViaje.toLowerCase().includes(search.toLowerCase()) || t.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [tiposViaje.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = tiposViaje.items.map((t) => parseInt(t.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const tipoViaje = form.tipoViaje.trim();
    const otros = tiposViaje.items.filter((t) => t.id !== editing?.id);
    if (codigo && otros.some((t) => t.codigo.trim() === codigo)) {
      return `Ya existe un tipo de viaje con el codigo "${codigo}".`;
    }
    if (tipoViaje && otros.some((t) => t.tipoViaje.toLowerCase() === tipoViaje.toLowerCase())) {
      return `Ya existe un tipo de viaje llamado "${tipoViaje}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(t: TipoViaje) {
    setEditing(t);
    setForm(t);
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
      tiposViaje.update(editing.id, form);
    } else {
      tiposViaje.add({ id: uid('tpv'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(t: TipoViaje) {
    if (confirm(`Eliminar el tipo de viaje "${t.tipoViaje}"?`)) tiposViaje.remove(t.id);
  }

  const columns: Column<TipoViaje>[] = [
    { header: 'Codigo', render: (t) => t.codigo },
    { header: 'Tipo de Viaje', render: (t) => t.tipoViaje },
    {
      header: 'Activo',
      render: (t) => <StatusBadge status={t.activo ? 'Si' : 'No'} tone={t.activo ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tipos de Viaje"
        subtitle="Tipos disponibles para los viajes (ej. Local, Nacional)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar tipo de viaje..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(t) => t.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay tipos de viaje registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Tipo de Viaje' : 'Agregando Tipo de Viaje'} onClose={() => setModalOpen(false)}>
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

            <Field label="Tipo de Viaje">
              <Input required autoFocus value={form.tipoViaje} onChange={(e) => setForm({ ...form, tipoViaje: e.target.value })} />
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
