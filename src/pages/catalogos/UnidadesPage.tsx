import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { EstatusUnidad, TipoUnidad, Unidad } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const tipos: TipoUnidad[] = ['Tractocamion', 'Rabon', 'Torton', 'Camioneta'];
const estatuses: EstatusUnidad[] = ['Disponible', 'En viaje', 'Taller', 'Fuera de servicio'];

const emptyForm: Omit<Unidad, 'id'> = {
  economico: '',
  placas: '',
  tipo: 'Tractocamion',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  estatus: 'Disponible',
};

export function UnidadesPage() {
  const { unidades } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unidad | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      unidades.items.filter((u) =>
        `${u.economico} ${u.placas} ${u.marca} ${u.modelo}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [unidades.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u: Unidad) {
    setEditing(u);
    setForm(u);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      unidades.update(editing.id, form);
    } else {
      unidades.add({ id: uid('uni'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(u: Unidad) {
    if (confirm(`Eliminar la unidad "${u.economico}"?`)) unidades.remove(u.id);
  }

  const columns: Column<Unidad>[] = [
    { header: 'Economico', render: (u) => <span className="font-medium text-ink-100">{u.economico}</span> },
    { header: 'Placas', render: (u) => u.placas },
    { header: 'Tipo', render: (u) => u.tipo },
    { header: 'Marca / Modelo', render: (u) => `${u.marca} ${u.modelo} (${u.anio})` },
    { header: 'Estatus', render: (u) => <StatusBadge status={u.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Unidades"
        subtitle="Tractocamiones y unidades de la flota."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por economico, placas o marca..."
        addLabel="Nueva unidad"
        onAdd={openNew}
      />

      <CrudTable columns={columns} rows={filtered} keyFn={(u) => u.id} onEdit={openEdit} onDelete={handleDelete} />

      {modalOpen && (
        <Modal
          title={editing ? 'Editar unidad' : 'Nueva unidad'}
          subtitle="Datos de la unidad tractora"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Numero economico">
              <Input required value={form.economico} onChange={(e) => setForm({ ...form, economico: e.target.value })} />
            </Field>
            <Field label="Placas">
              <Input required value={form.placas} onChange={(e) => setForm({ ...form, placas: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoUnidad })}>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus">
              <Select
                value={form.estatus}
                onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusUnidad })}
              >
                {estatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Marca">
              <Input required value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            </Field>
            <Field label="Modelo">
              <Input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </Field>
            <Field label="Anio">
              <Input
                type="number"
                required
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
              />
            </Field>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Registrar unidad'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
