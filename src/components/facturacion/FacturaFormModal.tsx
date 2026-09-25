import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { USO_CFDI_SAT } from '../../lib/catalogosSat';
import { TIMBRADO_VACIO, timbrarSimulado } from '../../lib/timbrado';
import type { ConceptoFacturacion, Factura, FacturaLinea, TipoFactura } from '../../types';
import {
  calcularTotalesFactura,
  creditoDisponibleDeCliente,
  lineasDesdeViaje,
  nextFolioFactura,
  porcentajeDeTexto,
  viajesPendientesDeFacturar,
} from '../../lib/facturacion';
import { siguienteFolioDocumento } from '../../lib/folios';
import type { FolioAutorizado } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyLineaForm = {
  conceptoFacturacionId: undefined as string | undefined,
  concepto: '',
  unidadMedida: '',
  cantidad: 1,
  precioUnitario: 0,
  descuento: 0,
  traslada: '',
  retiene: '',
};

function construirFactura(
  tipo: TipoFactura,
  facturas: Factura[],
  foliosAutorizados: FolioAutorizado[],
): { factura: Omit<Factura, 'id'>; error: string | null } {
  const resultadoFolio = siguienteFolioDocumento('Factura', foliosAutorizados, facturas.map((f) => f.folio), () => nextFolioFactura(facturas));
  const factura: Omit<Factura, 'id'> = {
    folio: resultadoFolio.folio ?? '',
    fecha: hoyISO(),
    timbrado: TIMBRADO_VACIO,
    viajeId: '',
    clienteId: '',
    importe: 0,
    moneda: 'MXN',
    estatus: 'Pendiente',
    observaciones: '',
    tipo,
    viajeIds: [],
    sucursal: 'MA',
    condicionesPago: 'CREDITO',
    formaPago: '',
    metodoPago: 'PPD',
    usoCfdi: 'G03',
    tipoCambio: 1,
    referencia: '',
    solicitante: '',
    lineas: [],
    subtotal: 0,
    descuentoTotal: 0,
  };
  return { factura, error: resultadoFolio.error };
}

export function FacturaFormModal({
  tipo,
  editing,
  soloLectura,
  viajesPreseleccionados,
  onClose,
  onGuardar,
}: {
  tipo: TipoFactura;
  editing: Factura | null;
  soloLectura: boolean;
  /** Al crear (no al editar), precarga estos viajes -- cliente y conceptos -- para facturar directo desde Asignacion de Viajes. */
  viajesPreseleccionados?: string[];
  onClose: () => void;
  onGuardar: (datos: Omit<Factura, 'id'>) => void;
}) {
  const { clientes, viajes, facturas, conceptosFacturacion, foliosAutorizados } = useData();
  const [inicial] = useState(() => {
    if (editing) return { form: { ...editing }, error: '' };
    const { factura: base, error: errorFolio } = construirFactura(tipo, facturas.items, foliosAutorizados.items);
    const viajesSel = (viajesPreseleccionados ?? [])
      .map((id) => viajes.items.find((v) => v.id === id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    if (viajesSel.length === 0) return { form: base, error: errorFolio ?? '' };
    return {
      form: {
        ...base,
        clienteId: viajesSel[0].clienteId || base.clienteId,
        viajeIds: viajesSel.map((v) => v.id),
        lineas: viajesSel.flatMap((v) => lineasDesdeViaje(v)),
      },
      error: errorFolio ?? '',
    };
  });
  const [form, setForm] = useState<Omit<Factura, 'id'>>(inicial.form);
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [conceptoPickerOpen, setConceptoPickerOpen] = useState(false);
  const [lineaForm, setLineaForm] = useState(emptyLineaForm);
  const [error, setError] = useState(inicial.error);
  const [paso, setPaso] = useState<'formulario' | 'preguntarTimbrar' | 'aviso72h'>('formulario');
  const [datosPendientes, setDatosPendientes] = useState<Omit<Factura, 'id'> | null>(null);

  const clienteSeleccionado = clientes.items.find((c) => c.id === form.clienteId);
  const creditoDisponible = creditoDisponibleDeCliente(clienteSeleccionado, facturas.items.filter((f) => f.id !== editing?.id));

  // Al facturar desde un viaje puntual (boton "Facturar" de Asignacion de
  // Viajes) la lista se fija a ese unico viaje -- no deben aparecer ni
  // poder agregarse otros viajes pendientes del mismo cliente.
  const viajesBloqueados = !editing && (viajesPreseleccionados?.length ?? 0) > 0;

  const viajesPendientes = useMemo(() => {
    if (tipo !== 'Viaje') return [];
    if (viajesBloqueados) {
      return (viajesPreseleccionados ?? [])
        .map((id) => viajes.items.find((v) => v.id === id))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    }
    return viajesPendientesDeFacturar(viajes.items, facturas.items.filter((f) => f.id !== editing?.id), form.clienteId);
  }, [tipo, viajesBloqueados, viajesPreseleccionados, viajes.items, facturas.items, form.clienteId, editing?.id]);

  const totales = calcularTotalesFactura(form.lineas);

  function seleccionarCliente(id: string) {
    setForm((f) => ({ ...f, clienteId: id, viajeIds: [], lineas: [] }));
  }

  function toggleViaje(viajeId: string) {
    setForm((f) => {
      const yaIncluido = f.viajeIds.includes(viajeId);
      if (yaIncluido) {
        // Quita solo los renglones que se generaron automaticamente al marcar
        // este viaje -- los agregados a mano (sin viajeId) se quedan igual.
        return {
          ...f,
          viajeIds: f.viajeIds.filter((id) => id !== viajeId),
          lineas: f.lineas.filter((l) => l.viajeId !== viajeId),
        };
      }
      const viaje = viajes.items.find((v) => v.id === viajeId);
      const nuevasLineas = viaje ? lineasDesdeViaje(viaje) : [];
      return { ...f, viajeIds: [...f.viajeIds, viajeId], lineas: [...f.lineas, ...nuevasLineas] };
    });
  }

  function seleccionarConcepto(c: ConceptoFacturacion) {
    const trasladaPredeterminado = c.traslados.find((t) => t.predeterminado)?.impuesto ?? '';
    const retienePredeterminado = c.retenciones.find((t) => t.predeterminado)?.impuesto ?? '';
    setLineaForm({
      conceptoFacturacionId: c.id,
      concepto: c.concepto,
      unidadMedida: c.unidadMedida,
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
      traslada: trasladaPredeterminado,
      retiene: retienePredeterminado,
    });
    setConceptoPickerOpen(false);
  }

  function agregarLinea() {
    if (!lineaForm.concepto.trim()) return;
    const importe = lineaForm.cantidad * lineaForm.precioUnitario - lineaForm.descuento;
    const nueva: FacturaLinea = {
      id: uid('fl'),
      conceptoFacturacionId: lineaForm.conceptoFacturacionId,
      concepto: lineaForm.concepto,
      unidadMedida: lineaForm.unidadMedida,
      cantidad: lineaForm.cantidad,
      precioUnitario: lineaForm.precioUnitario,
      descuento: lineaForm.descuento,
      importe,
      traslada: lineaForm.traslada,
      importeIva: importe * porcentajeDeTexto(lineaForm.traslada),
      retiene: lineaForm.retiene,
      importeRetencion: importe * porcentajeDeTexto(lineaForm.retiene),
    };
    setForm((f) => ({ ...f, lineas: [...f.lineas, nueva] }));
    setLineaForm(emptyLineaForm);
  }

  function eliminarLinea(id: string) {
    setForm((f) => ({ ...f, lineas: f.lineas.filter((l) => l.id !== id) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !form.folio.trim()) {
      setError('No hay folio disponible. Agrega un nuevo rango en Configuracion > Catalogo de Folios antes de continuar.');
      return;
    }
    if (!form.clienteId) {
      setError('Selecciona el cliente a facturar.');
      return;
    }
    if (form.lineas.length === 0) {
      setError('Agrega al menos un concepto de facturacion.');
      return;
    }
    setError('');
    const t = calcularTotalesFactura(form.lineas);
    const datos: Omit<Factura, 'id'> = {
      ...form,
      viajeId: form.viajeIds[0] ?? '',
      subtotal: t.subtotal,
      descuentoTotal: t.descuentoTotal,
      importe: t.total,
    };
    if (datos.timbrado.folioFiscal) {
      // Ya esta timbrada (se esta editando); no se vuelve a preguntar.
      onGuardar(datos);
      return;
    }
    setDatosPendientes(datos);
    setPaso('preguntarTimbrar');
  }

  function confirmarTimbrar() {
    if (!datosPendientes) return;
    onGuardar({ ...datosPendientes, timbrado: timbrarSimulado() });
  }

  function posponerTimbrado() {
    setPaso('aviso72h');
  }

  function cerrarAvisoYGuardar() {
    if (!datosPendientes) return;
    onGuardar(datosPendientes);
  }

  return (
    <Modal
      title={soloLectura ? `Consultar factura ${form.folio}` : editing ? `Editar factura ${form.folio}` : `Agregando Factura ${tipo === 'Viaje' ? 'por Viaje' : 'por Concepto'}`}
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
            <Field label="Credito Disponible">
              <Input readOnly value={clienteSeleccionado ? money(creditoDisponible) : money(0)} />
            </Field>
          </div>

          <Field label="Cliente">
            <div className="flex items-center gap-2">
              <Input readOnly value={clienteSeleccionado ? `${clienteSeleccionado.numeroCliente} - ${clienteSeleccionado.nombre}` : ''} placeholder="Sin cliente seleccionado" />
              {!viajesBloqueados && (
                <ToolbarButton type="button" onClick={() => setClientePickerOpen(true)}>
                  ...
                </ToolbarButton>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Condiciones de Pago">
              <Select value={form.condicionesPago} onChange={(e) => setForm({ ...form, condicionesPago: e.target.value })}>
                <option value="CREDITO">CREDITO</option>
                <option value="CONTADO">CONTADO</option>
              </Select>
            </Field>
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
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Moneda">
              <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Factura['moneda'] })}>
                <option value="MXN">PESOS</option>
                <option value="USD">DOLARES</option>
              </Select>
            </Field>
            <Field label="Tipo de Cambio">
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.tipoCambio}
                onChange={(e) => setForm({ ...form, tipoCambio: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as Factura['estatus'] })}>
                <option value="Pendiente">Pendiente</option>
                <option value="Facturado">Facturado</option>
                <option value="Pagado">Pagado</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </Field>
          </div>

          {tipo === 'Viaje' && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {viajesBloqueados
                  ? 'Viaje a facturar'
                  : `Viajes pendientes por facturar ${clienteSeleccionado ? `de ${clienteSeleccionado.nombre}` : '(selecciona un cliente)'}`}
              </h3>
              <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
                {!clienteSeleccionado ? (
                  <p className="p-4 text-center text-sm text-ink-600">Selecciona un cliente para ver sus viajes pendientes.</p>
                ) : viajesPendientes.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-600">Este cliente no tiene viajes pendientes por facturar.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="w-8 px-3 py-2" />
                        <th className="px-3 py-2">Viaje</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Ruta</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viajesPendientes.map((v) => (
                        <tr
                          key={v.id}
                          onClick={viajesBloqueados ? undefined : () => toggleViaje(v.id)}
                          className={`border-t border-line-800/70 ${viajesBloqueados ? '' : 'cursor-pointer hover:bg-bg-800'}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              readOnly
                              disabled={viajesBloqueados}
                              checked={form.viajeIds.includes(v.id)}
                              className="h-4 w-4 accent-breco-500"
                            />
                          </td>
                          <td className="px-3 py-2 font-semibold text-ink-100">{v.folio}</td>
                          <td className="px-3 py-2 text-ink-300">{v.fecha}</td>
                          <td className="px-3 py-2 text-ink-300">
                            {v.origen} &rarr; {v.destino}
                          </td>
                          <td className="px-3 py-2 text-right text-ink-300">
                            {money(v.conceptosFacturacionViaje.reduce((acc, c) => acc + c.importe, 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">Conceptos de Facturacion</h3>
            <div className="rounded-xl border border-line-800 p-3">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <Field label="Concepto">
                  <div className="flex items-center gap-2">
                    <Input readOnly value={lineaForm.concepto} placeholder="Selecciona un concepto" className="w-56" />
                    <ToolbarButton type="button" onClick={() => setConceptoPickerOpen(true)}>
                      ...
                    </ToolbarButton>
                  </div>
                </Field>
                <Field label="Cantidad">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24"
                    value={lineaForm.cantidad}
                    onChange={(e) => setLineaForm({ ...lineaForm, cantidad: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Precio Unitario">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-32"
                    value={lineaForm.precioUnitario}
                    onChange={(e) => setLineaForm({ ...lineaForm, precioUnitario: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Descuento">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28"
                    value={lineaForm.descuento}
                    onChange={(e) => setLineaForm({ ...lineaForm, descuento: Number(e.target.value) || 0 })}
                  />
                </Field>
                <GhostButton type="button" onClick={agregarLinea}>
                  <Plus size={14} /> Agregar
                </GhostButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-line-800">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-bg-700/50 uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-2 py-2">Cantidad</th>
                      <th className="px-2 py-2">Concepto</th>
                      <th className="px-2 py-2">Precio Unitario</th>
                      <th className="px-2 py-2">Importe</th>
                      <th className="px-2 py-2">Descuento</th>
                      <th className="px-2 py-2">Unidad Medida</th>
                      <th className="px-2 py-2">Traslada IVA</th>
                      <th className="px-2 py-2">Importe IVA</th>
                      <th className="px-2 py-2">Retiene</th>
                      <th className="px-2 py-2">Importe Ret</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineas.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-2 py-6 text-center text-ink-600">
                          Sin conceptos agregados.
                        </td>
                      </tr>
                    )}
                    {form.lineas.map((l) => (
                      <tr key={l.id} className="border-t border-line-800/70 text-ink-300">
                        <td className="px-2 py-1.5">{l.cantidad}</td>
                        <td className="px-2 py-1.5">{l.concepto}</td>
                        <td className="px-2 py-1.5">{money(l.precioUnitario)}</td>
                        <td className="px-2 py-1.5">{money(l.importe)}</td>
                        <td className="px-2 py-1.5">{money(l.descuento)}</td>
                        <td className="px-2 py-1.5">{l.unidadMedida}</td>
                        <td className="px-2 py-1.5">{l.traslada || '-'}</td>
                        <td className="px-2 py-1.5">{money(l.importeIva)}</td>
                        <td className="px-2 py-1.5">{l.retiene || '-'}</td>
                        <td className="px-2 py-1.5">{money(l.importeRetencion)}</td>
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
            <div className="space-y-4">
              <Field label="Observaciones">
                <Textarea rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </Field>
              <Field label="Referencia">
                <Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
              </Field>
              <Field label="Solicitante">
                <Input value={form.solicitante} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} />
              </Field>
            </div>
            <div className="space-y-2 rounded-xl border border-line-800 p-4">
              <div className="flex justify-between text-sm text-ink-400">
                <span>Subtotal</span>
                <span>{money(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-400">
                <span>Descuento</span>
                <span>{money(totales.descuentoTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-400">
                <span>IVA</span>
                <span>{money(totales.totalIva)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-400">
                <span>Retenciones</span>
                <span>-{money(totales.totalRetenciones)}</span>
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

      {conceptoPickerOpen && (
        <ListaSeleccionModal
          title="Buscar concepto de facturacion"
          items={conceptosFacturacion.items.filter((c) => c.activo)}
          filtro={(c, t) => !t || c.concepto.toLowerCase().includes(t) || c.codigo.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{c.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{c.concepto}</td>
            </>
          )}
          onSelect={seleccionarConcepto}
          onClose={() => setConceptoPickerOpen(false)}
        />
      )}

      {paso === 'preguntarTimbrar' && (
        <Modal title="Timbrar factura" onClose={() => setPaso('formulario')}>
          <div className="space-y-4">
            <p className="text-sm text-ink-300">
              La factura {form.folio} ya se guardo. ¿Deseas timbrarla ante el SAT ahora?
            </p>
            <p className="text-xs text-ink-500">
              Por ahora el ERP no esta conectado a un PAC, asi que este timbrado es simulado (no valido ante el SAT); en
              cuanto se conecte uno, este mismo boton hara el timbrado real.
            </p>
            <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
              <GhostButton type="button" onClick={posponerTimbrado}>
                No, mas tarde
              </GhostButton>
              <PrimaryButton type="button" onClick={confirmarTimbrar}>
                Si, timbrar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {paso === 'aviso72h' && (
        <Modal title="Factura sin timbrar" onClose={cerrarAvisoYGuardar}>
          <div className="space-y-4">
            <p className="text-sm text-ink-300">
              La factura {form.folio} se guardo sin timbrar. Tienes <strong>72 horas</strong> para timbrarla; despues de
              ese plazo el SAT ya no permite timbrar con la fecha de emision original.
            </p>
            <div className="flex justify-end border-t border-line-800 pt-4">
              <PrimaryButton type="button" onClick={cerrarAvisoYGuardar}>
                Entendido
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
