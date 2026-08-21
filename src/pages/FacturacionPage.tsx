import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { uid } from '../lib/storage';
import type { EstatusFactura, Factura } from '../types';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, inputClass } from '../components/ui/form';
import { StatusBadge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Receipt, CheckCircle2, Clock } from 'lucide-react';

const estatuses: EstatusFactura[] = ['Pendiente', 'Facturado', 'Pagado', 'Cancelado'];

function nextFolio(facturas: Factura[]) {
  const max = facturas.reduce((acc, f) => {
    const n = Number(f.folio.split('-')[1] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 1000);
  return `F-${max + 1}`;
}

export function FacturacionPage() {
  const { facturas, viajes, clientes } = useData();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Factura | null>(null);

  const facturasDelDia = useMemo(
    () => facturas.items.filter((f) => f.fecha === fecha),
    [facturas.items, fecha],
  );

  const emptyForm: Omit<Factura, 'id'> = {
    folio: nextFolio(facturas.items),
    fecha,
    viajeId: viajes.items[0]?.id ?? '',
    clienteId: viajes.items[0]?.clienteId ?? clientes.items[0]?.id ?? '',
    importe: 0,
    moneda: 'MXN',
    estatus: 'Pendiente',
    observaciones: '',
  };

  const [form, setForm] = useState(emptyForm);

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const viajeFolio = (id: string) => viajes.items.find((v) => v.id === id)?.folio ?? 'N/D';

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, fecha, folio: nextFolio(facturas.items) });
    setModalOpen(true);
  }

  function openEdit(f: Factura) {
    setEditing(f);
    setForm(f);
    setModalOpen(true);
  }

  function handleViajeChange(viajeId: string) {
    const viaje = viajes.items.find((v) => v.id === viajeId);
    setForm({ ...form, viajeId, clienteId: viaje?.clienteId ?? form.clienteId });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      facturas.update(editing.id, form);
    } else {
      facturas.add({ id: uid('fac'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(f: Factura) {
    if (confirm(`Eliminar la factura "${f.folio}"?`)) facturas.remove(f.id);
  }

  const totalDia = facturasDelDia.reduce((sum, f) => sum + f.importe, 0);
  const pendiente = facturasDelDia.filter((f) => f.estatus === 'Pendiente').reduce((sum, f) => sum + f.importe, 0);
  const pagado = facturasDelDia.filter((f) => f.estatus === 'Pagado').reduce((sum, f) => sum + f.importe, 0);

  const columns: Column<Factura>[] = [
    { header: 'Folio', render: (f) => <span className="font-medium text-ink-100">{f.folio}</span> },
    { header: 'Viaje', render: (f) => viajeFolio(f.viajeId) },
    { header: 'Cliente', render: (f) => clienteNombre(f.clienteId) },
    {
      header: 'Importe',
      render: (f) => f.importe.toLocaleString('es-MX', { style: 'currency', currency: f.moneda }),
    },
    { header: 'Estatus', render: (f) => <StatusBadge status={f.estatus} /> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-100">Facturacion Diaria</h1>
          <p className="mt-1 text-sm text-ink-500">Facturas generadas a partir de los viajes realizados.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputClass} w-44`} />
          <PrimaryButton onClick={openNew}>
            <Plus size={16} />
            Nueva factura
          </PrimaryButton>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total facturado hoy" value={totalDia.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} icon={Receipt} accent="red" />
        <StatCard label="Pendiente de cobro" value={pendiente.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} icon={Clock} accent="amber" />
        <StatCard label="Pagado" value={pagado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} icon={CheckCircle2} accent="green" />
      </div>

      <CrudTable
        columns={columns}
        rows={facturasDelDia}
        keyFn={(f) => f.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No hay facturas para la fecha seleccionada."
      />

      {modalOpen && (
        <Modal
          title={editing ? `Editar factura ${editing.folio}` : 'Nueva factura'}
          subtitle="Generar factura a partir de un viaje"
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
            <Field label="Viaje">
              <Select value={form.viajeId} onChange={(e) => handleViajeChange(e.target.value)}>
                {viajes.items.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.folio} - {v.origen} a {v.destino}
                  </option>
                ))}
              </Select>
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
            <Field label="Importe">
              <Input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: Number(e.target.value) })}
              />
            </Field>
            <Field label="Moneda">
              <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Factura['moneda'] })}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Estatus">
                <Select
                  value={form.estatus}
                  onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusFactura })}
                >
                  {estatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
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
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Generar factura'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
