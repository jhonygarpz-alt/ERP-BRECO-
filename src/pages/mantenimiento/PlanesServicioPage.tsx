import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { PlanServicio } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<PlanServicio, 'id'> = {
  codigo: '',
  nombre: '',
  aplicaA: 'Todas',
  intervaloKm: null,
  intervaloMeses: null,
  activo: true,
};

export function PlanesServicioPage() {
  const { planesServicio, gruposUnidad } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Mantenimiento', 'crear');
  const puedeEditar = hasPermission('Mantenimiento', 'editar');
  const puedeEliminar = hasPermission('Mantenimiento', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanServicio | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () => planesServicio.items.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())),
    [planesServicio.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = planesServicio.items.map((p) => parseInt(p.codigo.replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n));
    return `PS-${String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(3, '0')}`;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(p: PlanServicio) {
    setEditing(p);
    setForm(p);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('Falta el nombre del plan.');
      return;
    }
    if (form.intervaloKm === null && form.intervaloMeses === null) {
      setError('Captura al menos un intervalo (por kilometros o por meses).');
      return;
    }
    setError('');
    if (editing) {
      planesServicio.update(editing.id, form);
    } else {
      planesServicio.add({ id: uid('pln'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(p: PlanServicio) {
    if (confirm(`Eliminar el plan "${p.nombre}"?`)) planesServicio.remove(p.id);
  }

  const columns: Column<PlanServicio>[] = [
    { header: 'Codigo', render: (p) => <span className="font-mono text-xs text-breco-400">{p.codigo}</span> },
    { header: 'Nombre', render: (p) => p.nombre },
    { header: 'Aplica a', render: (p) => p.aplicaA },
    { header: 'Intervalo Km', render: (p) => p.intervaloKm ?? '-' },
    { header: 'Intervalo Meses', render: (p) => p.intervaloMeses ?? '-' },
    { header: 'Activo', render: (p) => <StatusBadge status={p.activo ? 'Si' : 'No'} tone={p.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Planes de Servicio"
        subtitle="Intervalos de mantenimiento preventivo (ej. Cambio de aceite cada 10,000 km o 6 meses); los usa Servicios Programados."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar plan..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(p) => p.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay planes de servicio registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Plan de Servicio' : 'Agregando Plan de Servicio'} onClose={() => setModalOpen(false)}>
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

            <Field label="Nombre">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>

            <Field label="Aplica a">
              <Select value={form.aplicaA} onChange={(e) => setForm({ ...form, aplicaA: e.target.value })}>
                <option value="Todas">Todas las unidades</option>
                {gruposUnidad.items.map((g) => (
                  <option key={g.id} value={g.nombre}>
                    {g.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Intervalo (Km)">
                <Input
                  type="number"
                  min="0"
                  value={form.intervaloKm ?? ''}
                  onChange={(e) => setForm({ ...form, intervaloKm: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Ej. 10000"
                />
              </Field>
              <Field label="Intervalo (Meses)">
                <Input
                  type="number"
                  min="0"
                  value={form.intervaloMeses ?? ''}
                  onChange={(e) => setForm({ ...form, intervaloMeses: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Ej. 6"
                />
              </Field>
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
