import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import { calcularTotalesArticulos, importeLinea, nextFolioAlmacen } from '../../lib/almacen';
import type { LineaArticuloAlmacen, Requisicion } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';
import { LineaArticuloModal } from './LineaArticuloModal';
import { NuevoProveedorModal } from './NuevoProveedorModal';
import { NuevoAlmacenModal } from './NuevoAlmacenModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function RequisicionFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: Requisicion | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Requisicion) => void;
}) {
  const { requisiciones, proveedores, almacenes } = useData();

  const [fecha, setFecha] = useState(editing?.fecha ?? hoyISO());
  const [proveedorId, setProveedorId] = useState(editing?.proveedorId ?? '');
  const [almacenId, setAlmacenId] = useState(editing?.almacenId ?? '');
  const [referencia, setReferencia] = useState(editing?.referencia ?? '');
  const [moneda, setMoneda] = useState(editing?.moneda ?? 'PESOS');
  const [tipoCambio, setTipoCambio] = useState(editing?.tipoCambio ?? 1);
  const [lineas, setLineas] = useState<LineaArticuloAlmacen[]>(editing?.lineas ?? []);
  const [observaciones, setObservaciones] = useState(editing?.observaciones ?? '');
  const [proveedorPickerOpen, setProveedorPickerOpen] = useState(false);
  const [almacenPickerOpen, setAlmacenPickerOpen] = useState(false);
  const [lineaModalOpen, setLineaModalOpen] = useState(false);
  const [lineaEditando, setLineaEditando] = useState<LineaArticuloAlmacen | null>(null);
  const [nuevoProveedorOpen, setNuevoProveedorOpen] = useState(false);
  const [nuevoAlmacenOpen, setNuevoAlmacenOpen] = useState(false);
  const [error, setError] = useState('');

  const proveedorSeleccionado = proveedores.items.find((p) => p.id === proveedorId);
  const almacenSeleccionado = almacenes.items.find((a) => a.id === almacenId);
  const totales = calcularTotalesArticulos(lineas);

  function guardarLinea(linea: LineaArticuloAlmacen) {
    setLineas((actual) => {
      const existe = actual.some((l) => l.id === linea.id);
      return existe ? actual.map((l) => (l.id === linea.id ? linea : l)) : [...actual, linea];
    });
    setLineaModalOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lineas.length === 0) {
      setError('Agrega al menos un articulo.');
      return;
    }
    setError('');
    onGuardar({
      id: editing?.id ?? uid('req'),
      folio: editing?.folio ?? nextFolioAlmacen(requisiciones.items, 'REQ-'),
      fecha,
      proveedorId: proveedorId || undefined,
      almacenId: almacenId || undefined,
      referencia,
      moneda,
      tipoCambio,
      lineas,
      observaciones,
      estatus: editing?.estatus ?? 'Abierta',
    });
  }

  return (
    <Modal title={soloLectura ? 'Consultar requisicion' : editing ? 'Editando requisicion' : 'Agregando requisicion'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          </div>

          {moneda === 'DOLARES' && (
            <Field label="Tipo de Cambio">
              <Input type="number" step="0.0001" min="0" value={tipoCambio} onChange={(e) => setTipoCambio(Number(e.target.value) || 1)} className="max-w-[180px]" />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Proveedor (opcional)">
              <div className="flex items-center gap-2">
                <Input readOnly value={proveedorSeleccionado?.nombre ?? ''} placeholder="Sin proveedor" />
                <ToolbarButton type="button" onClick={() => setProveedorPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
            <Field label="Almacen (opcional)">
              <div className="flex items-center gap-2">
                <Input readOnly value={almacenSeleccionado ? `${almacenSeleccionado.codigo} - ${almacenSeleccionado.nombre}` : ''} placeholder="Sin almacen" />
                <ToolbarButton type="button" onClick={() => setAlmacenPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
          </div>

          <Field label="Referencia">
            <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Articulos</h3>
              <ToolbarButton
                type="button"
                onClick={() => {
                  setLineaEditando(null);
                  setLineaModalOpen(true);
                }}
              >
                <Plus size={14} /> Agregar
              </ToolbarButton>
            </div>
            <div className="overflow-auto rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2">Codigo</th>
                    <th className="px-3 py-2">Articulo</th>
                    <th className="px-3 py-2 text-right">Precio Unitario</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                    <th className="px-3 py-2">Unidad Medida</th>
                    <th className="px-3 py-2">Observaciones</th>
                    <th className="w-16 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lineas.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-ink-600">
                        Sin articulos agregados.
                      </td>
                    </tr>
                  )}
                  {lineas.map((l) => (
                    <tr key={l.id} className="border-t border-line-800/70 text-ink-300">
                      <td className="px-3 py-1.5 text-right">{l.cantidad}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{l.codigo}</td>
                      <td className="px-3 py-1.5">{l.descripcion}</td>
                      <td className="px-3 py-1.5 text-right">{money(l.precioUnitario)}</td>
                      <td className="px-3 py-1.5 text-right">{money(importeLinea(l))}</td>
                      <td className="px-3 py-1.5">{l.unidadMedida}</td>
                      <td className="px-3 py-1.5">{l.observaciones}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLineaEditando(l);
                              setLineaModalOpen(true);
                            }}
                            className="text-ink-600 hover:text-breco-500"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLineas((actual) => actual.filter((ll) => ll.id !== l.id))}
                            className="text-ink-600 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
        <LineaArticuloModal editing={lineaEditando} onClose={() => setLineaModalOpen(false)} onGuardar={guardarLinea} />
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
            setNuevoProveedorOpen(false);
          }}
        />
      )}

      {almacenPickerOpen && (
        <ListaSeleccionModal
          title="Buscar almacen"
          items={almacenes.items.filter((a) => a.activo)}
          filtro={(a, t) => !t || a.nombre.toLowerCase().includes(t) || a.codigo.toLowerCase().includes(t)}
          renderRow={(a) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{a.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{a.nombre}</td>
            </>
          )}
          onSelect={(a) => {
            setAlmacenId(a.id);
            setAlmacenPickerOpen(false);
          }}
          onClose={() => setAlmacenPickerOpen(false)}
          accionExtra={{ label: 'Agregar Almacen', onClick: () => (setAlmacenPickerOpen(false), setNuevoAlmacenOpen(true)) }}
        />
      )}

      {nuevoAlmacenOpen && (
        <NuevoAlmacenModal
          onClose={() => setNuevoAlmacenOpen(false)}
          onCreado={(a) => {
            setAlmacenId(a.id);
            setNuevoAlmacenOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
