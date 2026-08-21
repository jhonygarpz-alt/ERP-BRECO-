import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
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
  operadorAsignadoId: '',
  clienteAsignadoId: '',
};

export function UnidadesPage() {
  const { unidades, operadores, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unidad | null>(null);
  const [form, setForm] = useState(emptyForm);

  const operadorNombre = (id?: string) => operadores.items.find((o) => o.id === id)?.nombre ?? '—';
  const clienteNombre = (id?: string) => clientes.items.find((c) => c.id === id)?.nombre ?? '—';

  const filtered = useMemo(
    () =>
      unidades.items.filter((u) =>
        `${u.economico} ${u.placas} ${u.marca} ${u.modelo} ${operadorNombre(u.operadorAsignadoId)} ${clienteNombre(u.clienteAsignadoId)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.items, search, operadores.items, clientes.items],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u: Unidad) {
    setEditing(u);
    setForm({ operadorAsignadoId: '', clienteAsignadoId: '', ...u });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      operadorAsignadoId: form.operadorAsignadoId || undefined,
      clienteAsignadoId: form.clienteAsignadoId || undefined,
    };
    if (editing) {
      unidades.update(editing.id, payload);
    } else {
      unidades.add({ id: uid('uni'), ...payload });
    }
    setModalOpen(false);
  }

  function handleDelete(u: Unidad) {
    if (confirm(`Eliminar la unidad "${u.economico}"?`)) unidades.remove(u.id);
  }

  const columns: Column<Unidad>[] = [
    { header: 'Economico', render: (u) => <span className="font-medium text-ink-100">{u.economico}</span> },
    {
      header: 'Placas / Marca',
      render: (u) => (
        <span className="text-xs">
          {u.placas || '—'} &middot; {u.marca || '—'} {u.modelo} {u.anio ? `(${u.anio})` : ''}
        </span>
      ),
    },
    { header: 'Operador asignado', render: (u) => operadorNombre(u.operadorAsignadoId) },
    { header: 'Cliente asignado', render: (u) => clienteNombre(u.clienteAsignadoId) },
    { header: 'Estatus', render: (u) => <StatusBadge status={u.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Unidades"
        subtitle="Tractocamiones y unidades de la flota, con su asignacion actual."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por economico, operador o cliente..."
        addLabel="Nueva unidad"
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
          title={editing ? 'Editar unidad' : 'Nueva unidad'}
          subtitle="Datos de la unidad y su asignacion actual"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Numero economico">
              <Input required value={form.economico} onChange={(e) => setForm({ ...form, economico: e.target.value })} />
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
            <Field label="Placas">
              <Input
                placeholder="Pendiente"
                value={form.placas}
                onChange={(e) => setForm({ ...form, placas: e.target.value })}
              />
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
              <Input
                placeholder="Pendiente"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </Field>
            <Field label="Modelo">
              <Input
                placeholder="Pendiente"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </Field>
            <Field label="Anio">
              <Input
                type="number"
                value={form.anio || ''}
                onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
              />
            </Field>

            <Field label="Operador asignado">
              <Select
                value={form.operadorAsignadoId ?? ''}
                onChange={(e) => setForm({ ...form, operadorAsignadoId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {operadores.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cliente asignado">
              <Select
                value={form.clienteAsignadoId ?? ''}
                onChange={(e) => setForm({ ...form, clienteAsignadoId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {clientes.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
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
