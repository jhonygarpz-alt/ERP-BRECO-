import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { USO_CFDI_SAT } from '../../lib/catalogosSat';
import { porcentajeDeTexto } from '../../lib/facturacion';
import { calcularTotalesNotaCredito, facturasPendientesDePago, nextFolioCobranza } from '../../lib/cobranza';
import { TIMBRADO_VACIO } from '../../lib/timbrado';
import type { NotaCredito, NotaCreditoLinea } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyLineaForm = { concepto: '', unidadMedida: 'SERVICIO', importe: 0, traslada: '' };

function construirNotaCredito(notas: NotaCredito[]): Omit<NotaCredito, 'id'> {
  return {
    folio: nextFolioCobranza(notas, 'NC-'),
    fecha: hoyISO(),
    timbrado: TIMBRADO_VACIO,
    sucursal: 'MA',
    clienteId: '',
    facturaIds: [],
    formaPago: '',
    metodoPago: 'PUE',
    usoCfdi: 'G02',
    moneda: 'PESOS',
    tipoCambio: 1,
    lineas: [],
    observaciones: '',
    subtotal: 0,
    total: 0,
    estatus: 'Activa',
  };
}

export function NotaCreditoFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: NotaCredito | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<NotaCredito, 'id'>) => void;
}) {
  const { clientes, facturas, pagosCliente, notasCredito } = useData();
  const [form, setForm] = useState<Omit<NotaCredito, 'id'>>(editing ? { ...editing } : construirNotaCredito(notasCredito.items));
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [lineaForm, setLineaForm] = useState(emptyLineaForm);
  const [error, setError] = useState('');

  const clienteSeleccionado = clientes.items.find((c) => c.id === form.clienteId);

  const facturasPendientes = useMemo(
    () =>
      form.clienteId
        ? facturasPendientesDePago(
            facturas.items,
            pagosCliente.items,
            notasCredito.items.filter((n) => n.id !== editing?.id),
            form.clienteId,
          )
        : [],
    [facturas.items, pagosCliente.items, notasCredito.items, form.clienteId, editing?.id],
  );

  const totales = calcularTotalesNotaCredito(form.lineas);

  function seleccionarCliente(id: string) {
    setForm((f) => ({ ...f, clienteId: id, facturaIds: [] }));
  }

  function toggleFactura(facturaId: string) {
    setForm((f) => ({
      ...f,
      facturaIds: f.facturaIds.includes(facturaId) ? f.facturaIds.filter((id) => id !== facturaId) : [...f.facturaIds, facturaId],
    }));
  }

  function agregarLinea() {
    if (!lineaForm.concepto.trim() || lineaForm.importe <= 0) return;
    const nueva: NotaCreditoLinea = {
      id: uid('ncl'),
      concepto: lineaForm.concepto,
      unidadMedida: lineaForm.unidadMedida,
      importe: lineaForm.importe,
      traslada: lineaForm.traslada,
      importeIva: lineaForm.importe * porcentajeDeTexto(lineaForm.traslada),
    };
    setForm((f) => ({ ...f, lineas: [...f.lineas, nueva] }));
    setLineaForm(emptyLineaForm);
  }

  function eliminarLinea(id: string) {
    setForm((f) => ({ ...f, lineas: f.lineas.filter((l) => l.id !== id) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clienteId) {
      setError('Selecciona el cliente al que se le hara la nota de credito.');
      return;
    }
    if (form.lineas.length === 0) {
      setError('Agrega al menos un concepto a la nota de credito.');
      return;
    }
    setError('');
    const t = calcularTotalesNotaCredito(form.lineas);
    onGuardar({ ...form, subtotal: t.subtotal, total: t.total });
  }

  return (
    <Modal
      title={soloLectura ? `Consultar nota de credito ${form.folio}` : editing ? `Editar nota de credito ${form.folio}` : 'Agregando Nota de Credito'}
      onClose={onClose}
      wide="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Folio">
              <Input readOnly value={form.folio} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Sucursal">
              <Input value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as NotaCredito['estatus'] })}>
                <option value="Activa">Activa</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
            </Field>
          </div>

          <Field label="Cliente">
            <div className="flex items-center gap-2">
              <Input readOnly value={clienteSeleccionado ? `${clienteSeleccionado.numeroCliente} - ${clienteSeleccionado.nombre}` : ''} placeholder="Sin cliente seleccionado" />
              <ToolbarButton type="button" onClick={() => setClientePickerOpen(true)}>
                ...
              </ToolbarButton>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Forma de Pago">
              <Input value={form.formaPago} onChange={(e) => setForm({ ...form, formaPago: e.target.value })} placeholder="Por definir" />
            </Field>
            <Field label="Metodo de Pago">
              <Select value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                <option value="PUE">PUE - Pago en una sola exhibicion</option>
                <option value="PPD">PPD - Pago en parcialidades o diferido</option>
              </Select>
            </Field>
            <Field label="Uso del CFDI">
              <Select value={form.usoCfdi} onChange={(e) => setForm({ ...form, usoCfdi: e.target.value })}>
                {USO_CFDI_SAT.map((u) => (
                  <option key={u.clave} value={u.clave}>
                    {u.clave} - {u.descripcion}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda">
              <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                <option value="PESOS">PESOS</option>
                <option value="DOLARES">DOLARES</option>
              </Select>
            </Field>
          </div>

          {form.moneda === 'DOLARES' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Tipo de Cambio">
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.tipoCambio}
                  onChange={(e) => setForm({ ...form, tipoCambio: Number(e.target.value) || 1 })}
                />
              </Field>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Facturas a relacionar {clienteSeleccionado ? `de ${clienteSeleccionado.nombre}` : '(selecciona un cliente)'}
            </h3>
            <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
              {!clienteSeleccionado ? (
                <p className="p-4 text-center text-sm text-ink-600">Selecciona un cliente para ver sus facturas con saldo.</p>
              ) : facturasPendientes.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-600">Este cliente no tiene facturas con saldo pendiente.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasPendientes.map(({ factura: f, saldo }) => (
                      <tr
                        key={f.id}
                        onClick={() => toggleFactura(f.id)}
                        className="cursor-pointer border-t border-line-800/70 hover:bg-bg-800"
                      >
                        <td className="px-3 py-2">
                          <input type="checkbox" readOnly checked={form.facturaIds.includes(f.id)} className="h-4 w-4 accent-breco-500" />
                        </td>
                        <td className="px-3 py-2 font-semibold text-ink-100">{f.folio}</td>
                        <td className="px-3 py-2 text-ink-300">{f.fecha}</td>
                        <td className="px-3 py-2 text-right text-ink-300">{money(f.importe)}</td>
                        <td className="px-3 py-2 text-right text-ink-300">{money(saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">Concepto Nota Credito</h3>
            <div className="rounded-xl border border-line-800 p-3">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <Field label="Concepto">
                  <Input
                    className="w-56"
                    value={lineaForm.concepto}
                    onChange={(e) => setLineaForm({ ...lineaForm, concepto: e.target.value })}
                    placeholder="Descripcion del concepto"
                  />
                </Field>
                <Field label="Unidad Medida">
                  <Input
                    className="w-32"
                    value={lineaForm.unidadMedida}
                    onChange={(e) => setLineaForm({ ...lineaForm, unidadMedida: e.target.value })}
                  />
                </Field>
                <Field label="Importe">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-32"
                    value={lineaForm.importe}
                    onChange={(e) => setLineaForm({ ...lineaForm, importe: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Traslada IVA">
                  <Input
                    className="w-24"
                    value={lineaForm.traslada}
                    onChange={(e) => setLineaForm({ ...lineaForm, traslada: e.target.value })}
                    placeholder="16%"
                  />
                </Field>
                <GhostButton type="button" onClick={agregarLinea}>
                  <Plus size={14} /> Agregar
                </GhostButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-line-800">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-bg-700/50 uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-2 py-2">Concepto</th>
                      <th className="px-2 py-2">Unidad Medida</th>
                      <th className="px-2 py-2">Importe</th>
                      <th className="px-2 py-2">Traslada IVA</th>
                      <th className="px-2 py-2">Importe IVA</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-6 text-center text-ink-600">
                          Sin conceptos agregados.
                        </td>
                      </tr>
                    )}
                    {form.lineas.map((l) => (
                      <tr key={l.id} className="border-t border-line-800/70 text-ink-300">
                        <td className="px-2 py-1.5">{l.concepto}</td>
                        <td className="px-2 py-1.5">{l.unidadMedida}</td>
                        <td className="px-2 py-1.5">{money(l.importe)}</td>
                        <td className="px-2 py-1.5">{l.traslada || '-'}</td>
                        <td className="px-2 py-1.5">{money(l.importeIva)}</td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => eliminarLinea(l.id)} className="text-ink-600 hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Observaciones">
              <Textarea rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </Field>
            <div className="space-y-2 rounded-xl border border-line-800 p-4">
              <div className="flex justify-between text-sm text-ink-400">
                <span>Subtotal</span>
                <span>{money(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-400">
                <span>IVA</span>
                <span>{money(totales.totalIva)}</span>
              </div>
              <div className="flex justify-between border-t border-line-800 pt-2 text-base font-semibold text-ink-100">
                <span>Total</span>
                <span>{money(totales.total)}</span>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose}>
            {soloLectura ? 'Cerrar' : 'Cancelar'}
          </GhostButton>
          {!soloLectura && <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Aceptar'}</PrimaryButton>}
        </div>
      </form>

      {clientePickerOpen && (
        <ListaSeleccionModal
          title="Buscar cliente"
          items={clientes.items}
          filtro={(c, t) => !t || c.nombre.toLowerCase().includes(t) || c.numeroCliente.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{c.numeroCliente}</td>
              <td className="px-3 py-2 text-ink-200">{c.nombre}</td>
            </>
          )}
          onSelect={(c) => {
            seleccionarCliente(c.id);
            setClientePickerOpen(false);
          }}
          onClose={() => setClientePickerOpen(false)}
        />
      )}
    </Modal>
  );
}
