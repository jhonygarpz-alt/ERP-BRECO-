import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { LineaArticuloAlmacen } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, ToolbarButton } from '../ui/form';
import { NuevoArticuloModal } from './NuevoArticuloModal';
import { NuevoAlmacenModal } from './NuevoAlmacenModal';

export function LineaArticuloModal({
  editing,
  almacenIdInicial,
  requiereAlmacen,
  onClose,
  onGuardar,
}: {
  editing: LineaArticuloAlmacen | null;
  /** Cuando el documento maneja almacen por linea (Ordenes de Compra, Compras). */
  almacenIdInicial?: string;
  requiereAlmacen?: boolean;
  onClose: () => void;
  onGuardar: (linea: LineaArticuloAlmacen, almacenId?: string) => void;
}) {
  const { articulos, almacenes } = useData();
  const [articuloId, setArticuloId] = useState(editing?.articuloId ?? '');
  const [codigo, setCodigo] = useState(editing?.codigo ?? '');
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? '');
  const [unidadMedida, setUnidadMedida] = useState(editing?.unidadMedida ?? '');
  const [cantidad, setCantidad] = useState(editing?.cantidad ?? 1);
  const [precioUnitario, setPrecioUnitario] = useState(editing?.precioUnitario ?? 0);
  const [observaciones, setObservaciones] = useState(editing?.observaciones ?? '');
  const [almacenId, setAlmacenId] = useState(almacenIdInicial ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [almacenPickerOpen, setAlmacenPickerOpen] = useState(false);
  const [nuevoArticuloOpen, setNuevoArticuloOpen] = useState(false);
  const [nuevoAlmacenOpen, setNuevoAlmacenOpen] = useState(false);
  const [error, setError] = useState('');

  const almacenSeleccionado = almacenes.items.find((a) => a.id === almacenId);

  function elegirArticulo(a: (typeof articulos.items)[number]) {
    setArticuloId(a.id);
    setCodigo(a.codigo);
    setDescripcion(a.descripcion);
    setUnidadMedida(a.unidadMedida);
    setPrecioUnitario(a.precioUnitario);
    setPickerOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !descripcion.trim()) {
      setError('Elige un articulo o captura codigo y descripcion.');
      return;
    }
    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (requiereAlmacen && !almacenId) {
      setError('Selecciona el almacen de esta linea.');
      return;
    }
    onGuardar(
      {
        id: editing?.id ?? uid('lin'),
        articuloId: articuloId || undefined,
        codigo: codigo.trim(),
        descripcion: descripcion.trim(),
        cantidad,
        precioUnitario,
        unidadMedida,
        observaciones,
      },
      requiereAlmacen ? almacenId : undefined,
    );
  }

  return (
    <Modal title={editing ? 'Editando articulo' : 'Agregando articulo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Articulo">
          <div className="flex items-center gap-2">
            <Input readOnly value={codigo ? `${codigo} - ${descripcion}` : ''} placeholder="Sin articulo seleccionado" />
            <ToolbarButton type="button" onClick={() => setPickerOpen(true)}>
              ...
            </ToolbarButton>
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Cantidad">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Precio Unitario">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Unidad de Medida">
            <Input value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} />
          </Field>
        </div>

        <Field label="Observaciones">
          <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>

        {requiereAlmacen && (
          <Field label="Almacen">
            <div className="flex items-center gap-2">
              <Input readOnly value={almacenSeleccionado ? `${almacenSeleccionado.codigo} - ${almacenSeleccionado.nombre}` : ''} placeholder="Sin almacen seleccionado" />
              <ToolbarButton type="button" onClick={() => setAlmacenPickerOpen(true)}>
                ...
              </ToolbarButton>
            </div>
          </Field>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
          {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="submit">Aceptar</PrimaryButton>
        </div>
      </form>

      {pickerOpen && (
        <ListaSeleccionModal
          title="Buscar articulo"
          items={articulos.items.filter((a) => a.activo)}
          filtro={(a, t) => !t || a.descripcion.toLowerCase().includes(t) || a.codigo.toLowerCase().includes(t)}
          renderRow={(a) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{a.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{a.descripcion}</td>
              <td className="px-3 py-2 text-ink-500">{a.unidadMedida}</td>
            </>
          )}
          onSelect={elegirArticulo}
          onClose={() => setPickerOpen(false)}
          accionExtra={{ label: 'Agregar Articulo', onClick: () => (setPickerOpen(false), setNuevoArticuloOpen(true)) }}
        />
      )}

      {nuevoArticuloOpen && (
        <NuevoArticuloModal
          onClose={() => setNuevoArticuloOpen(false)}
          onCreado={(a) => {
            elegirArticulo(a);
            setNuevoArticuloOpen(false);
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
