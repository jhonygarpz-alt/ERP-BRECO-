import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { facturasPendientesDePago, nextFolioCobranza } from '../../lib/cobranza';
import { TIMBRADO_VACIO } from '../../lib/timbrado';
import type { AplicacionPago, PagoCliente } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, ToolbarButton } from '../ui/form';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const FORMAS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA'];

export function RegistrarPagoModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: PagoCliente | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<PagoCliente, 'id'>) => void;
}) {
  const { clientes, facturas, pagosCliente, notasCredito, cuentasBancarias, viajes } = useData();
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [clienteId, setClienteId] = useState(editing?.clienteId ?? '');
  const [fechaCobro, setFechaCobro] = useState(editing?.fechaCobro ?? hoyISO());
  const [formaPago, setFormaPago] = useState(editing?.formaPago ?? 'EFECTIVO');
  const [cuentaBancariaId, setCuentaBancariaId] = useState(editing?.cuentaBancariaId ?? '');
  const [importeDepositado, setImporteDepositado] = useState(editing?.importeDepositado ?? 0);
  const [moneda, setMoneda] = useState(editing?.moneda ?? 'PESOS');
  const [tipoCambio, setTipoCambio] = useState(editing?.tipoCambio ?? 1);
  const [referenciaBancaria, setReferenciaBancaria] = useState(editing?.referenciaBancaria ?? '');
  const [concepto, setConcepto] = useState(editing?.concepto ?? 'PAGO/ABONO');
  const [importesPorFactura, setImportesPorFactura] = useState<Record<string, number>>(
    () => Object.fromEntries((editing?.aplicaciones ?? []).map((a) => [a.facturaId, a.importe])),
  );
  const [error, setError] = useState('');

  const clienteSeleccionado = clientes.items.find((c) => c.id === clienteId);

  const pendientes = useMemo(
    () => (clienteId ? facturasPendientesDePago(facturas.items, pagosCliente.items.filter((p) => p.id !== editing?.id), notasCredito.items, clienteId) : []),
    [clienteId, facturas.items, pagosCliente.items, notasCredito.items, editing?.id],
  );

  function folioViaje(facturaId: string) {
    const f = facturas.items.find((x) => x.id === facturaId);
    const v = f?.viajeIds[0] ? viajes.items.find((x) => x.id === f.viajeIds[0]) : undefined;
    return v ? `${v.folio}${v.loadNumber ? ` / ${v.loadNumber}` : ''}` : '-';
  }

  function toggleFactura(facturaId: string, saldo: number) {
    setImportesPorFactura((actual) => {
      const copia = { ...actual };
      if (facturaId in copia) {
        delete copia[facturaId];
      } else {
        copia[facturaId] = saldo;
      }
      return copia;
    });
  }

  function cambiarImporte(facturaId: string, valor: number) {
    setImportesPorFactura((actual) => ({ ...actual, [facturaId]: valor }));
  }

  const importeAPagar = Object.values(importesPorFactura).reduce((acc, v) => acc + (v || 0), 0);
  const saldoTotal = pendientes.reduce((acc, p) => acc + p.saldo, 0);
  const saldoAFavor = Math.max(0, importeDepositado - importeAPagar);
  const compensacion = Math.min(importeDepositado, importeAPagar);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) {
      setError('Selecciona el cliente que realizo el pago.');
      return;
    }
    if (importeDepositado <= 0) {
      setError('Captura el importe depositado.');
      return;
    }
    setError('');
    const aplicaciones: AplicacionPago[] = Object.entries(importesPorFactura)
      .filter(([, importe]) => importe > 0)
      .map(([facturaId, importe]) => ({ facturaId, importe }));
    onGuardar({
      folio: editing?.folio ?? nextFolioCobranza(pagosCliente.items, 'PGO-'),
      timbrado: editing?.timbrado ?? TIMBRADO_VACIO,
      clienteId,
      fechaMovimiento: editing?.fechaMovimiento ?? new Date().toISOString(),
      fechaCobro,
      formaPago,
      cuentaBancariaId: cuentaBancariaId || undefined,
      importeDepositado,
      moneda,
      tipoCambio,
      referenciaBancaria,
      concepto,
      aplicaciones,
      saldoAFavor,
      estatus: editing?.estatus ?? 'Aplicado',
    });
  }

  return (
    <Modal title={soloLectura ? `Consultar pago ${editing?.folio}` : editing ? `Editar pago ${editing.folio}` : 'Registrar Pago/Abono'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Fecha movimiento">
              <Input readOnly value={editing ? new Date(editing.fechaMovimiento).toLocaleString('es-MX') : new Date().toLocaleString('es-MX')} />
            </Field>
            <Field label="Fecha Cobro">
              <Input type="date" value={fechaCobro} onChange={(e) => setFechaCobro(e.target.value)} />
            </Field>
            <Field label="Tipo Cambio">
              <Input type="number" step="0.0001" min="0" value={tipoCambio} onChange={(e) => setTipoCambio(Number(e.target.value) || 1)} />
            </Field>
          </div>

          <Field label="Cliente">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={clienteSeleccionado ? `${clienteSeleccionado.numeroCliente} - ${clienteSeleccionado.nombre}` : ''}
                placeholder="Sin cliente seleccionado"
              />
              <ToolbarButton type="button" onClick={() => setClientePickerOpen(true)}>
                ...
              </ToolbarButton>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Forma Pago">
              <Select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                {FORMAS_PAGO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cuenta Bancaria">
              <Select value={cuentaBancariaId} onChange={(e) => setCuentaBancariaId(e.target.value)}>
                <option value="">Sin cuenta</option>
                {cuentasBancarias.items.filter((c) => c.activa).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} - {c.descripcion}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda">
              <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="PESOS">PESOS</option>
                <option value="DOLARES">DOLARES</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label={`Importe Depositado (${moneda})`}>
              <Input type="number" step="0.01" min="0" value={importeDepositado} onChange={(e) => setImporteDepositado(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Referencia Bancaria">
              <Input value={referenciaBancaria} onChange={(e) => setReferenciaBancaria(e.target.value)} />
            </Field>
            <Field label="Concepto Cobranza">
              <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} />
            </Field>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">
              Facturas pendientes {clienteSeleccionado ? `de ${clienteSeleccionado.nombre}` : ''}
            </h3>
            <div className="max-h-72 overflow-auto rounded-xl border border-line-800">
              {!clienteId ? (
                <p className="p-4 text-center text-sm text-ink-600">Selecciona un cliente para ver sus facturas pendientes.</p>
              ) : pendientes.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-600">Este cliente no tiene facturas con saldo pendiente.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2">Viaje / Load Number</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                      <th className="px-3 py-2 text-right">Importe a aplicar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map(({ factura, saldo }) => {
                      const marcada = factura.id in importesPorFactura;
                      return (
                        <tr key={factura.id} className="border-t border-line-800/70">
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={marcada} onChange={() => toggleFactura(factura.id, saldo)} className="h-4 w-4 accent-breco-500" />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-ink-100">{factura.folio}</td>
                          <td className="px-3 py-2 text-ink-300">{folioViaje(factura.id)}</td>
                          <td className="px-3 py-2 text-ink-300">{factura.fecha}</td>
                          <td className="px-3 py-2 text-right text-ink-300">{money(factura.importe)}</td>
                          <td className="px-3 py-2 text-right text-ink-300">{money(saldo)}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={!marcada}
                              className="w-28 text-right"
                              value={importesPorFactura[factura.id] ?? 0}
                              onChange={(e) => cambiarImporte(factura.id, Number(e.target.value) || 0)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line-800 p-3 text-center">
              <div className="text-xs text-ink-500">Saldo Total</div>
              <div className="text-sm font-semibold text-ink-100">{money(saldoTotal)}</div>
            </div>
            <div className="rounded-lg border border-line-800 p-3 text-center">
              <div className="text-xs text-ink-500">Importe a Pagar</div>
              <div className="text-sm font-semibold text-ink-100">{money(importeAPagar)}</div>
            </div>
            <div className="rounded-lg border border-line-800 p-3 text-center">
              <div className="text-xs text-ink-500">Saldo a favor</div>
              <div className="text-sm font-semibold text-emerald-400">{money(saldoAFavor)}</div>
            </div>
            <div className="rounded-lg border border-line-800 p-3 text-center">
              <div className="text-xs text-ink-500">Compensacion</div>
              <div className="text-sm font-semibold text-ink-100">{money(compensacion)}</div>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose}>
            {soloLectura ? 'Cerrar' : 'Cancelar'}
          </GhostButton>
          {!soloLectura && <PrimaryButton type="submit">Aceptar</PrimaryButton>}
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
            setClienteId(c.id);
            setImportesPorFactura({});
            setClientePickerOpen(false);
          }}
          onClose={() => setClientePickerOpen(false)}
        />
      )}
    </Modal>
  );
}
