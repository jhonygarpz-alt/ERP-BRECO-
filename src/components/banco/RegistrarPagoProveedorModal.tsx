import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import { gastosPendientesDePago, nextFolioBanco, saldoCuenta } from '../../lib/banco';
import type { AplicacionGasto, PagoProveedor, Proveedor } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, ToolbarButton } from '../ui/form';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const FORMAS_PAGO = ['TRANSFERENCIA', 'CHEQUE', 'EFECTIVO', 'TARJETA'];

const emptyNuevoProveedor = { nombre: '', rfc: '', tipo: 'Nacional' as Proveedor['tipo'] };

export function RegistrarPagoProveedorModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: PagoProveedor | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<PagoProveedor, 'id'>) => void;
}) {
  const { proveedores, gastosViaje, pagosProveedor, cuentasBancarias, movimientosBancarios } = useData();

  const [proveedorId, setProveedorId] = useState(editing?.proveedorId ?? '');
  const [fecha, setFecha] = useState(editing?.fecha ?? hoyISO());
  const [cuentaBancariaId, setCuentaBancariaId] = useState(editing?.cuentaBancariaId ?? '');
  const [formaPago, setFormaPago] = useState(editing?.formaPago ?? 'TRANSFERENCIA');
  const [referencia, setReferencia] = useState(editing?.referencia ?? '');
  const [concepto, setConcepto] = useState(editing?.concepto ?? 'PAGO A PROVEEDOR');
  const [importesPorGasto, setImportesPorGasto] = useState<Record<string, number>>(() => {
    const inicial: Record<string, number> = {};
    editing?.aplicaciones.forEach((a) => (inicial[a.gastoId] = a.importe));
    return inicial;
  });
  const [proveedorPickerOpen, setProveedorPickerOpen] = useState(false);
  const [nuevoProveedorOpen, setNuevoProveedorOpen] = useState(false);
  const [nuevoProveedorForm, setNuevoProveedorForm] = useState(emptyNuevoProveedor);
  const [nuevoProveedorError, setNuevoProveedorError] = useState('');
  const [error, setError] = useState('');

  const proveedorSeleccionado = proveedores.items.find((p) => p.id === proveedorId);
  const cuentasActivas = cuentasBancarias.items.filter((c) => c.activa);

  const pendientes = useMemo(
    () =>
      proveedorId
        ? gastosPendientesDePago(gastosViaje.items, pagosProveedor.items.filter((p) => p.id !== editing?.id), proveedorId)
        : [],
    [gastosViaje.items, pagosProveedor.items, proveedorId, editing?.id],
  );

  function toggleGasto(gastoId: string, saldo: number) {
    setImportesPorGasto((actual) => {
      const copia = { ...actual };
      if (gastoId in copia) delete copia[gastoId];
      else copia[gastoId] = saldo;
      return copia;
    });
  }

  function abrirNuevoProveedor() {
    setNuevoProveedorForm(emptyNuevoProveedor);
    setNuevoProveedorError('');
    setProveedorPickerOpen(false);
    setNuevoProveedorOpen(true);
  }

  function guardarNuevoProveedor() {
    const nombre = nuevoProveedorForm.nombre.trim();
    const rfc = nuevoProveedorForm.rfc.trim().toUpperCase();
    if (!nombre) {
      setNuevoProveedorError('Falta el Nombre.');
      return;
    }
    if (rfc && proveedores.items.some((p) => p.rfc.trim().toUpperCase() === rfc)) {
      setNuevoProveedorError(`Ya existe un proveedor con el RFC ${rfc}.`);
      return;
    }
    const nuevoId = uid('prv');
    proveedores.add({
      id: nuevoId,
      numero: '',
      fecha: hoyISO(),
      estatus: 'activo',
      tipo: nuevoProveedorForm.tipo,
      rfc,
      nombre,
      nombreCorto: '',
      esProveedorCombustible: false,
      proveedorBienes: false,
      proveedorServicios: false,
      grupo: '',
      tipoOperacion: '',
      tipoTercero: '',
      shortNameSap: '',
      pais: 'Mexico',
      estado: '',
      cp: '',
      municipio: '',
      colonia: '',
      localidad: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      correo: '',
      telefonos: '',
      celular: '',
      nextel: '',
      formaPago: 'Efectivo',
      diasCredito: 0,
      limiteCreditoMxn: 0,
      limiteCreditoUsd: 0,
      banco: '',
      cuentaClabe: '',
      noCuenta: '',
      documentos: [],
    });
    setProveedorId(nuevoId);
    setImportesPorGasto({});
    setNuevoProveedorOpen(false);
  }

  const importeAPagar = Object.values(importesPorGasto).reduce((acc, v) => acc + v, 0);
  const saldoCuentaSeleccionada = cuentaBancariaId ? saldoCuenta(cuentaBancariaId, movimientosBancarios.items) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proveedorId) {
      setError('Selecciona el proveedor a pagar.');
      return;
    }
    if (!cuentaBancariaId) {
      setError('Selecciona de que cuenta bancaria se hara el pago.');
      return;
    }
    if (importeAPagar <= 0) {
      setError('Selecciona al menos un gasto y captura el importe a pagar.');
      return;
    }
    setError('');
    const aplicaciones: AplicacionGasto[] = Object.entries(importesPorGasto)
      .filter(([, importe]) => importe > 0)
      .map(([gastoId, importe]) => ({ gastoId, importe }));

    onGuardar({
      folio: editing?.folio ?? nextFolioBanco(pagosProveedor.items, 'PPV-'),
      proveedorId,
      fecha,
      cuentaBancariaId,
      formaPago,
      referencia,
      concepto,
      aplicaciones,
      importe: importeAPagar,
      estatus: 'Aplicado',
    });
  }

  return (
    <Modal title={soloLectura ? 'Consultar pago a proveedor' : editing ? 'Editar pago a proveedor' : 'Registrar Pago a Proveedor'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
            <Field label="Forma de Pago">
              <Select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                {FORMAS_PAGO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Referencia">
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej. TRF123456" />
            </Field>
          </div>

          <Field label="Proveedor">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={proveedorSeleccionado ? `${proveedorSeleccionado.numero} - ${proveedorSeleccionado.nombre}` : ''}
                placeholder="Sin proveedor seleccionado"
              />
              <ToolbarButton type="button" onClick={() => setProveedorPickerOpen(true)}>
                ...
              </ToolbarButton>
            </div>
          </Field>

          <Field label="Concepto">
            <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </Field>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Gastos pendientes de pago {proveedorSeleccionado ? `de ${proveedorSeleccionado.nombre}` : '(selecciona un proveedor)'}
            </h3>
            <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
              {!proveedorSeleccionado ? (
                <p className="p-4 text-center text-sm text-ink-600">Selecciona un proveedor para ver sus gastos pendientes.</p>
              ) : pendientes.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-600">Este proveedor no tiene gastos pendientes de pago (con "Genera pasivo").</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2">Concepto</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                      <th className="px-3 py-2 text-right">Importe a Pagar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map(({ gasto: g, saldo }) => (
                      <tr key={g.id} className="border-t border-line-800/70 hover:bg-bg-800">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={g.id in importesPorGasto}
                            onChange={() => toggleGasto(g.id, saldo)}
                            className="h-4 w-4 accent-breco-500"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold text-ink-100">{g.concepto || g.tipo}</td>
                        <td className="px-3 py-2 text-ink-300">{g.fecha}</td>
                        <td className="px-3 py-2 text-right text-ink-300">{money(g.monto)}</td>
                        <td className="px-3 py-2 text-right text-ink-300">{money(saldo)}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!(g.id in importesPorGasto)}
                            value={importesPorGasto[g.id] ?? 0}
                            onChange={(e) => setImportesPorGasto((a) => ({ ...a, [g.id]: Number(e.target.value) || 0 }))}
                            className="w-28 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">
              Resumen de Saldos Bancarios -- elige de que cuenta se pagara
            </h3>
            <div className="overflow-hidden rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2">Banco</th>
                    <th className="px-3 py-2">No. Cuenta</th>
                    <th className="px-3 py-2 text-right">Saldo Disponible</th>
                    <th className="px-3 py-2">Moneda</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasActivas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-ink-600">
                        No hay cuentas bancarias activas.
                      </td>
                    </tr>
                  )}
                  {cuentasActivas.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setCuentaBancariaId(c.id)}
                      className={`cursor-pointer border-t border-line-800/70 hover:bg-bg-800 ${cuentaBancariaId === c.id ? 'bg-breco-500/10' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <input type="radio" readOnly checked={cuentaBancariaId === c.id} className="h-4 w-4 accent-breco-500" />
                      </td>
                      <td className="px-3 py-2 font-semibold text-ink-100">{c.banco}</td>
                      <td className="px-3 py-2 text-ink-300">{c.numero}</td>
                      <td className="px-3 py-2 text-right text-ink-300">{money(saldoCuenta(c.id, movimientosBancarios.items))}</td>
                      <td className="px-3 py-2 text-ink-300">{c.moneda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line-800 p-3">
              <span className="text-xs uppercase tracking-wide text-ink-500">Importe a Pagar</span>
              <p className="text-lg font-bold text-ink-100">{money(importeAPagar)}</p>
            </div>
            <div className="rounded-xl border border-line-800 p-3">
              <span className="text-xs uppercase tracking-wide text-ink-500">Saldo de la Cuenta Elegida</span>
              <p className="text-lg font-bold text-ink-100">{cuentaBancariaId ? money(saldoCuentaSeleccionada) : '-'}</p>
            </div>
            <div className="rounded-xl border border-line-800 p-3">
              <span className="text-xs uppercase tracking-wide text-ink-500">Saldo Despues del Pago</span>
              <p className={`text-lg font-bold ${saldoCuentaSeleccionada - importeAPagar < 0 ? 'text-red-400' : 'text-ink-100'}`}>
                {cuentaBancariaId ? money(saldoCuentaSeleccionada - importeAPagar) : '-'}
              </p>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose}>
            {soloLectura ? 'Cerrar' : 'Cancelar'}
          </GhostButton>
          {!soloLectura && <PrimaryButton type="submit">Generar Pago</PrimaryButton>}
        </div>
      </form>

      {proveedorPickerOpen && (
        <ListaSeleccionModal
          title="Buscar proveedor"
          items={proveedores.items}
          filtro={(p, t) => !t || p.nombre.toLowerCase().includes(t) || p.numero.toLowerCase().includes(t)}
          renderRow={(p) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{p.numero}</td>
              <td className="px-3 py-2 text-ink-200">{p.nombre}</td>
            </>
          )}
          onSelect={(p) => {
            setProveedorId(p.id);
            setImportesPorGasto({});
            setProveedorPickerOpen(false);
          }}
          onClose={() => setProveedorPickerOpen(false)}
          accionExtra={{ label: 'Agregar Proveedor', onClick: abrirNuevoProveedor }}
        />
      )}

      {nuevoProveedorOpen && (
        <Modal title="Agregando Proveedor" onClose={() => setNuevoProveedorOpen(false)}>
          <div className="space-y-4">
            <Field label="Nombre">
              <Input
                required
                autoFocus
                value={nuevoProveedorForm.nombre}
                onChange={(e) => setNuevoProveedorForm({ ...nuevoProveedorForm, nombre: e.target.value })}
              />
            </Field>
            <Field label="RFC">
              <Input
                value={nuevoProveedorForm.rfc}
                onChange={(e) => setNuevoProveedorForm({ ...nuevoProveedorForm, rfc: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Tipo Proveedor">
              <Select
                value={nuevoProveedorForm.tipo}
                onChange={(e) => setNuevoProveedorForm({ ...nuevoProveedorForm, tipo: e.target.value as Proveedor['tipo'] })}
              >
                <option value="Nacional">Nacional</option>
                <option value="Extranjero">Extranjero</option>
              </Select>
            </Field>
            <p className="text-xs text-ink-500">
              El resto de los datos del proveedor (domicilio, credito, cuenta bancaria, etc.) se pueden completar despues desde el catalogo de
              Proveedores.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevoProveedorError && <p className="flex-1 text-sm text-breco-500">{nuevoProveedorError}</p>}
              <GhostButton type="button" onClick={() => setNuevoProveedorOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevoProveedor}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
