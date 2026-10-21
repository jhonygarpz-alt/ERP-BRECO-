import { useRef, useState } from 'react';
import { Paperclip, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import { calcularTotalesArticulos, cantidadPendiente, importeLinea, nextFolioAlmacen, ordenesCompraPendientes } from '../../lib/almacen';
import { leerCfdiArchivo } from '../../lib/cfdiImport';
import type { Compra, LineaArticuloAlmacen, LineaCompra } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';
import { LineaArticuloModal } from './LineaArticuloModal';
import { NuevoProveedorModal } from './NuevoProveedorModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function CompraFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: Compra | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Compra, tipoMovimientoEntradaId: string) => void;
}) {
  const { compras, proveedores, ordenesCompra, almacenes, tiposMovimientoAlmacen } = useData();

  const [fecha, setFecha] = useState(editing?.fecha ?? hoyISO());
  const [proveedorId, setProveedorId] = useState(editing?.proveedorId ?? '');
  const [folioFiscalUuid, setFolioFiscalUuid] = useState(editing?.folioFiscalUuid ?? '');
  const [serieDocumento, setSerieDocumento] = useState(editing?.serieDocumento ?? '');
  const [numeroDocumento, setNumeroDocumento] = useState(editing?.numeroDocumento ?? '');
  const [fechaRecibido, setFechaRecibido] = useState(editing?.fechaRecibido ?? hoyISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(editing?.fechaVencimiento ?? hoyISO());
  const [moneda, setMoneda] = useState(editing?.moneda ?? 'PESOS');
  const [tipoCambio, setTipoCambio] = useState(editing?.tipoCambio ?? 1);
  const [generarPasivo, setGenerarPasivo] = useState(editing?.generarPasivo ?? true);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<Set<string>>(new Set(editing?.ordenesCompraIds ?? []));
  const [lineas, setLineas] = useState<LineaCompra[]>(editing?.lineas ?? []);
  const [observaciones, setObservaciones] = useState(editing?.observaciones ?? '');
  const [tipoMovimientoEntradaId, setTipoMovimientoEntradaId] = useState('');
  const [proveedorPickerOpen, setProveedorPickerOpen] = useState(false);
  const [nuevoProveedorOpen, setNuevoProveedorOpen] = useState(false);
  const [lineaModalOpen, setLineaModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [cargandoXml, setCargandoXml] = useState(false);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  const proveedorSeleccionado = proveedores.items.find((p) => p.id === proveedorId);
  const totales = calcularTotalesArticulos(lineas);
  const tiposEntrada = tiposMovimientoAlmacen.items.filter((t) => t.naturaleza === 'Entrada' && t.activo);
  const ordenesDelProveedor = proveedorId ? ordenesCompraPendientes(proveedorId, ordenesCompra.items) : [];

  function almacenTexto(id: string) {
    const a = almacenes.items.find((aa) => aa.id === id);
    return a ? `${a.codigo} - ${a.nombre}` : 'N/D';
  }

  async function cargarXml(file: File) {
    setCargandoXml(true);
    const datos = await leerCfdiArchivo(file);
    setCargandoXml(false);
    if (!datos) {
      alert('No se pudo leer el XML: no parece un CFDI timbrado valido.');
      return;
    }
    setFolioFiscalUuid(datos.uuid);
    setSerieDocumento(datos.serie);
    setNumeroDocumento(datos.folio);
  }

  function toggleOrden(oc: (typeof ordenesDelProveedor)[number]) {
    setOrdenesSeleccionadas((actual) => {
      const copia = new Set(actual);
      if (copia.has(oc.id)) {
        copia.delete(oc.id);
        setLineas((ls) => ls.filter((l) => l.ordenCompraId !== oc.id));
      } else {
        copia.add(oc.id);
        const nuevasLineas: LineaCompra[] = oc.lineas
          .filter((l) => cantidadPendiente(l) > 0)
          .map((l) => ({
            id: uid('lin'),
            articuloId: l.articuloId,
            codigo: l.codigo,
            descripcion: l.descripcion,
            cantidad: cantidadPendiente(l),
            precioUnitario: l.precioUnitario,
            unidadMedida: l.unidadMedida,
            observaciones: '',
            ordenCompraId: oc.id,
            ordenCompraLineaId: l.id,
            almacenId: l.almacenId,
          }));
        setLineas((ls) => [...ls, ...nuevasLineas]);
      }
      return copia;
    });
  }

  function actualizarCantidad(id: string, cantidad: number) {
    setLineas((actual) => actual.map((l) => (l.id === id ? { ...l, cantidad } : l)));
  }

  function guardarLineaManual(linea: LineaArticuloAlmacen, almacenId?: string) {
    setLineas((actual) => [...actual, { ...linea, almacenId: almacenId ?? '' }]);
    setLineaModalOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proveedorId) {
      setError('Selecciona el proveedor.');
      return;
    }
    if (lineas.length === 0) {
      setError('Agrega al menos un articulo.');
      return;
    }
    if (!tipoMovimientoEntradaId) {
      setError('Selecciona el Tipo de Movimiento para registrar la entrada al almacen.');
      return;
    }
    setError('');
    onGuardar(
      {
        id: editing?.id ?? uid('cmp'),
        folio: editing?.folio ?? nextFolioAlmacen(compras.items, 'CMP-'),
        fecha,
        proveedorId,
        folioFiscalUuid,
        serieDocumento,
        numeroDocumento,
        fechaRecibido,
        fechaVencimiento,
        moneda,
        tipoCambio,
        ordenesCompraIds: Array.from(ordenesSeleccionadas),
        lineas,
        generarPasivo,
        observaciones,
        estatus: editing?.estatus ?? 'Aplicada',
      },
      tipoMovimientoEntradaId,
    );
  }

  return (
    <Modal title={soloLectura ? 'Consultar compra' : editing ? 'Editando compra' : 'Agregando compra'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Folio">
              <Input readOnly value={editing?.folio ?? 'Se asigna al guardar'} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
            <Field label="Moneda">
              <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="PESOS">PESOS</option>
                <option value="DOLARES">DOLARES</option>
              </Select>
            </Field>
            {moneda === 'DOLARES' && (
              <Field label="Tipo de Cambio">
                <Input type="number" step="0.0001" min="0" value={tipoCambio} onChange={(e) => setTipoCambio(Number(e.target.value) || 1)} />
              </Field>
            )}
          </div>

          <Field label="Proveedor">
            <div className="flex items-center gap-2">
              <Input readOnly value={proveedorSeleccionado?.nombre ?? ''} placeholder="Sin proveedor seleccionado" />
              <ToolbarButton type="button" onClick={() => setProveedorPickerOpen(true)}>
                ...
              </ToolbarButton>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Folio Fiscal UUID">
              <div className="flex items-center gap-2">
                <Input value={folioFiscalUuid} onChange={(e) => setFolioFiscalUuid(e.target.value)} placeholder="Se llena al cargar el XML" />
                <input ref={xmlInputRef} type="file" accept=".xml" className="hidden" onChange={(e) => e.target.files?.[0] && cargarXml(e.target.files[0])} />
                <ToolbarButton type="button" onClick={() => xmlInputRef.current?.click()} disabled={cargandoXml}>
                  <Paperclip size={14} /> {cargandoXml ? 'Leyendo...' : 'Cargar XML'}
                </ToolbarButton>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Serie">
                <Input value={serieDocumento} onChange={(e) => setSerieDocumento(e.target.value)} />
              </Field>
              <Field label="Numero Documento">
                <Input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Fecha Recibido">
              <Input type="date" value={fechaRecibido} onChange={(e) => setFechaRecibido(e.target.value)} />
            </Field>
            <Field label="Fecha Vencimiento">
              <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
            </Field>
            <Field label="Tipo Mov. de Entrada al Almacen">
              <Select value={tipoMovimientoEntradaId} onChange={(e) => setTipoMovimientoEntradaId(e.target.value)}>
                <option value="">Selecciona...</option>
                {tiposEntrada.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-300">
            <input type="checkbox" checked={generarPasivo} onChange={(e) => setGenerarPasivo(e.target.checked)} />
            Generar pasivo en Cuentas por Pagar
          </label>

          {proveedorId && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Ordenes de compra pendientes del proveedor</h3>
              <div className="max-h-40 overflow-auto rounded-xl border border-line-800">
                {ordenesDelProveedor.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-600">Este proveedor no tiene ordenes de compra pendientes de recibir.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="w-8 px-3 py-2" />
                        <th className="px-3 py-2">No. Orden Compra</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenesDelProveedor.map((oc) => (
                        <tr key={oc.id} className="border-t border-line-800/70 hover:bg-bg-800">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={ordenesSeleccionadas.has(oc.id)}
                              onChange={() => toggleOrden(oc)}
                              className="h-4 w-4 accent-breco-500"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-ink-100">{oc.folio}</td>
                          <td className="px-3 py-2 text-ink-300">{oc.fecha}</td>
                          <td className="px-3 py-2 text-right text-ink-300">{money(calcularTotalesArticulos(oc.lineas).total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Articulos</h3>
              <ToolbarButton type="button" onClick={() => setLineaModalOpen(true)}>
                <Plus size={14} /> Agregar Manual
              </ToolbarButton>
            </div>
            <div className="overflow-auto rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-3 py-2">No. Orden Compra</th>
                    <th className="px-3 py-2">Almacen</th>
                    <th className="px-3 py-2">Codigo</th>
                    <th className="px-3 py-2">Articulo</th>
                    <th className="px-3 py-2">Unidad Medida</th>
                    <th className="px-3 py-2 text-right">Cantidad Entregada</th>
                    <th className="px-3 py-2 text-right">Precio Unitario</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lineas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-ink-600">
                        Sin articulos agregados.
                      </td>
                    </tr>
                  )}
                  {lineas.map((l) => (
                    <tr key={l.id} className="border-t border-line-800/70 text-ink-300">
                      <td className="px-3 py-1.5 font-mono text-xs">{l.ordenCompraId ? ordenesCompra.items.find((o) => o.id === l.ordenCompraId)?.folio : '—'}</td>
                      <td className="px-3 py-1.5">{l.almacenId ? almacenTexto(l.almacenId) : '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{l.codigo}</td>
                      <td className="px-3 py-1.5">{l.descripcion}</td>
                      <td className="px-3 py-1.5">{l.unidadMedida}</td>
                      <td className="px-3 py-1.5 text-right">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={l.cantidad}
                          onChange={(e) => actualizarCantidad(l.id, Number(e.target.value) || 0)}
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">{money(l.precioUnitario)}</td>
                      <td className="px-3 py-1.5 text-right">{money(importeLinea(l))}</td>
                      <td className="px-3 py-1.5">
                        <button
                          type="button"
                          onClick={() => setLineas((actual) => actual.filter((ll) => ll.id !== l.id))}
                          className="text-ink-600 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Observaciones">
              <Textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </Field>
            <div className="space-y-2 rounded-xl border border-line-800 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="text-ink-100">{money(totales.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">IVA 16%</span>
                <span className="text-ink-100">{money(totales.totalIva)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line-800 pt-2 text-base font-bold">
                <span className="text-ink-100">Total</span>
                <span className="text-ink-100">{money(totales.total)}</span>
              </div>
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

      {lineaModalOpen && (
        <LineaArticuloModal editing={null} requiereAlmacen onClose={() => setLineaModalOpen(false)} onGuardar={guardarLineaManual} />
      )}

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
            setOrdenesSeleccionadas(new Set());
            setLineas((ls) => ls.filter((l) => !l.ordenCompraId));
            setProveedorPickerOpen(false);
          }}
          onClose={() => setProveedorPickerOpen(false)}
          accionExtra={{ label: 'Agregar Proveedor', onClick: () => (setProveedorPickerOpen(false), setNuevoProveedorOpen(true)) }}
        />
      )}

      {nuevoProveedorOpen && (
        <NuevoProveedorModal
          onClose={() => setNuevoProveedorOpen(false)}
          onCreado={(p) => {
            setProveedorId(p.id);
            setOrdenesSeleccionadas(new Set());
            setLineas((ls) => ls.filter((l) => !l.ordenCompraId));
            setNuevoProveedorOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
