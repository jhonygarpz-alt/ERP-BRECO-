import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { EstatusViaje, Viaje } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea } from '../components/ui/form';
import { StatusBadge } from '../components/ui/Badge';

const estatuses: EstatusViaje[] = ['Programado', 'En transito', 'Entregado', 'Cancelado'];

function nextFolio(viajes: Viaje[]) {
  const max = viajes.reduce((acc, v) => {
    const n = Number(v.folio.split('-')[1] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `V-${String(max + 1).padStart(4, '0')}`;
}

export function ViajesPage() {
  const { viajes, clientes, unidades, cajas, operadores } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Viaje | null>(null);

  const emptyForm: Omit<Viaje, 'id'> = {
    folio: nextFolio(viajes.items),
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: clientes.items[0]?.id ?? '',
    unidadId: unidades.items[0]?.id ?? '',
    cajaId: cajas.items[0]?.id ?? '',
    operadorId: operadores.items[0]?.id ?? '',
    origen: '',
    destino: '',
    horaSalida: '08:00',
    horaLlegadaEstimada: '',
    estatus: 'Programado',
    observaciones: '',
  };

  const [form, setForm] = useState(emptyForm);

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const cajaNombre = (id: string) => cajas.items.find((c) => c.id === id)?.economico ?? 'N/D';
  const operadorNombre = (id: string) => operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';

  const filtered = useMemo(
    () =>
      viajes.items.filter((v) =>
        `${v.folio} ${clienteNombre(v.clienteId)} ${v.origen} ${v.destino}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, search, clientes.items],
  );

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, folio: nextFolio(viajes.items) });
    setModalOpen(true);
  }

  function openEdit(v: Viaje) {
    setEditing(v);
    setForm(v);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      viajes.update(editing.id, form);
    } else {
      viajes.add({ id: uid('via'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(v: Viaje) {
    if (confirm(`Eliminar el viaje "${v.folio}"?`)) viajes.remove(v.id);
  }

  const columns: Column<Viaje>[] = [
    {
      header: 'Folio / Fecha',
      render: (v) => (
        <div>
          <div className="font-medium text-ink-100">{v.folio}</div>
          <div className="text-xs text-ink-600">
            {v.fecha} {v.horaSalida}
          </div>
        </div>
      ),
    },
    { header: 'Cliente', render: (v) => clienteNombre(v.clienteId) },
    { header: 'Ruta', render: (v) => `${v.origen} -> ${v.destino}` },
    {
      header: 'Unidad / Caja / Operador',
      render: (v) => (
        <div className="text-xs">
          {unidadNombre(v.unidadId)} &middot; {cajaNombre(v.cajaId)}
          <br />
          {operadorNombre(v.operadorId)}
        </div>
      ),
    },
    { header: 'Estatus', render: (v) => <StatusBadge status={v.estatus} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Asignacion de Viajes"
        subtitle="Asigna cliente, unidad, caja y operador a cada viaje."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio, cliente o ruta..."
        addLabel="Asignar viaje"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(v) => v.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? `Editar viaje ${editing.folio}` : 'Asignar nuevo viaje'}
          subtitle="Define cliente, recursos y ruta del viaje"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Folio">
              <Input required value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </Field>

            <Field label="Cliente">
              <Select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                {clientes.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus">
              <Select
                value={form.estatus}
                onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusViaje })}
              >
                {estatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Unidad">
              <Select value={form.unidadId} onChange={(e) => setForm({ ...form, unidadId: e.target.value })}>
                {unidades.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.economico} ({u.estatus})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Caja">
              <Select value={form.cajaId} onChange={(e) => setForm({ ...form, cajaId: e.target.value })}>
                {cajas.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.economico} - {c.tipo}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Operador">
                <Select value={form.operadorId} onChange={(e) => setForm({ ...form, operadorId: e.target.value })}>
                  {operadores.items.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre} ({o.estatus})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Origen">
              <Input required value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} />
            </Field>
            <Field label="Destino">
              <Input required value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
            </Field>
            <Field label="Hora de salida">
              <Input
                type="time"
                required
                value={form.horaSalida}
                onChange={(e) => setForm({ ...form, horaSalida: e.target.value })}
              />
            </Field>
            <Field label="Hora estimada de llegada">
              <Input
                type="time"
                value={form.horaLlegadaEstimada}
                onChange={(e) => setForm({ ...form, horaLlegadaEstimada: e.target.value })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Observaciones">
                <Textarea
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Asignar viaje'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
