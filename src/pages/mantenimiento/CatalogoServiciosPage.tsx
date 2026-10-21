import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { CatalogoServicio } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<CatalogoServicio, 'id'> = { codigo: '', descripcion: '', tiempoEstandarHoras: 0, activo: true };

export function CatalogoServiciosPage() {
  const { catalogoServicios } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');
  const puedeEditar = hasPermission('Mantenimiento', 'editar');
  const puedeEliminar = hasPermission('Mantenimiento', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogoServicio | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      catalogoServicios.items.filter(
        (c) => c.descripcion.toLowerCase().includes(search.toLowerCase()) || c.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [catalogoServicios.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = catalogoServicios.items.map((c) => parseInt(c.codigo.replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n));
    return `SRV-${String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(3, '0')}`;
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const otros = catalogoServicios.items.filter((c) => c.id !== editing?.id);
    if (codigo && otros.some((c) => c.codigo.trim() === codigo)) return `Ya existe un servicio con el codigo "${codigo}".`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: CatalogoServicio) {
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
      catalogoServicios.update(editing.id, form);
    } else {
      catalogoServicios.add({ id: uid('srv'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: CatalogoServicio) {
    if (confirm(`Eliminar el servicio "${c.descripcion}"?`)) catalogoServicios.remove(c.id);
  }

  const columns: Column<CatalogoServicio>[] = [
    { header: 'Codigo', render: (c) => <span className="font-mono text-xs text-breco-400">{c.codigo}</span> },
    { header: 'Descripcion', render: (c) => c.descripcion },
    { header: 'Tiempo Estandar (hrs)', render: (c) => c.tiempoEstandarHoras },
    { header: 'Activo', render: (c) => <StatusBadge status={c.activo ? 'Si' : 'No'} tone={c.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Catalogo de Servicios"
        subtitle="Servicios que se pueden agregar a una Orden de Servicio (ej. Cambio de aceite, Balanceo, Alineacion)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar servicio..."
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
        emptyMessage="No hay servicios registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Servicio' : 'Agregando Servicio'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[160px]">
                <Field label="Codigo">
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
            </div>

            <Field label="Descripcion">
              <Input required autoFocus value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>

            <Field label="Tiempo Estandar (horas)">
              <Input
                type="number"
                min="0"
                step="0.25"
                value={form.tiempoEstandarHoras}
                onChange={(e) => setForm({ ...form, tiempoEstandarHoras: Number(e.target.value) || 0 })}
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
