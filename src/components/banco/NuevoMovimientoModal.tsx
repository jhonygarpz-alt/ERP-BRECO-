import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import type { MovimientoBancario, TipoMovimientoBancario } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea } from '../ui/form';

const CONCEPTOS_MOVIMIENTO = [
  'DEPOSITO CLIENTE',
  'PAGO PROVEEDOR',
  'TRANSFERENCIA',
  'PAGO NOMINA',
  'PAGO CASETAS',
  'PAGO COMBUSTIBLE',
  'PAGO SEGUROS',
  'TRASPASO ENTRE CUENTAS',
  'COMISION BANCARIA',
  'OTRO',
];

function construirMovimiento(cuentaBancariaId: string): Omit<MovimientoBancario, 'id'> {
  return {
    cuentaBancariaId,
    fecha: hoyISO(),
    tipo: 'Ingreso',
    concepto: '',
    beneficiario: '',
    importe: 0,
    referencia: '',
    observaciones: '',
    origen: 'Manual',
    conciliado: false,
    estatus: 'Activo',
  };
}

export function NuevoMovimientoModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: MovimientoBancario | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<MovimientoBancario, 'id'>) => void;
}) {
  const { cuentasBancarias } = useData();
  const cuentasActivas = cuentasBancarias.items.filter((c) => c.activa);
  const [form, setForm] = useState<Omit<MovimientoBancario, 'id'>>(
    editing ? { ...editing } : construirMovimiento(cuentasActivas[0]?.id ?? ''),
  );
  const [error, setError] = useState('');

  const editableOrigenManual = !editing || editing.origen === 'Manual';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cuentaBancariaId) {
      setError('Selecciona la cuenta bancaria.');
      return;
    }
    if (!form.concepto) {
      setError('Selecciona el concepto del movimiento.');
      return;
    }
    if (form.importe <= 0) {
      setError('El importe debe ser mayor a 0.');
      return;
    }
    setError('');
    onGuardar(form);
  }

  return (
    <Modal title={soloLectura ? 'Consultar movimiento' : editing ? 'Editar movimiento' : 'Nuevo Movimiento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        {!editableOrigenManual && (
          <p className="rounded-lg bg-blue-400/10 px-3 py-2 text-xs text-blue-400">
            Este movimiento lo genero automaticamente el sistema ({editing?.origen === 'ComplementoPago' ? 'Complemento de Pago' : 'Pago a Proveedor'}
            ) y solo puede consultarse aqui.
          </p>
        )}

        <fieldset disabled={soloLectura || !editableOrigenManual} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: 'Ingreso' as TipoMovimientoBancario })}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                form.tipo === 'Ingreso'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-line-700 text-ink-500 hover:border-line-600'
              }`}
            >
              ↓ Ingreso
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: 'Egreso' as TipoMovimientoBancario })}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                form.tipo === 'Egreso'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-line-700 text-ink-500 hover:border-line-600'
              }`}
            >
              ↑ Egreso
            </button>
          </div>

          <Field label="Cuenta Bancaria">
            <Select value={form.cuentaBancariaId} onChange={(e) => setForm({ ...form, cuentaBancariaId: e.target.value })}>
              <option value="">Selecciona una cuenta...</option>
              {cuentasActivas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.banco} - {c.numero}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha">
            <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>

          <Field label="Concepto">
            <Select value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })}>
              <option value="">Selecciona un concepto...</option>
              {CONCEPTOS_MOVIMIENTO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Beneficiario / Origen">
            <Input value={form.beneficiario} onChange={(e) => setForm({ ...form, beneficiario: e.target.value })} placeholder="Buscar o escribir..." />
          </Field>

          <Field label="Importe">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.importe}
              onChange={(e) => setForm({ ...form, importe: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Referencia / Folio">
            <Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Ej. TRF123456, CH-00123" />
          </Field>

          <Field label="Observaciones">
            <Textarea rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </Field>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose}>
            {soloLectura ? 'Cerrar' : 'Cancelar'}
          </GhostButton>
          {!soloLectura && editableOrigenManual && (
            <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Guardar Movimiento'}</PrimaryButton>
          )}
        </div>
      </form>
    </Modal>
  );
}
