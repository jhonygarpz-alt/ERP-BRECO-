import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { Articulo } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../ui/form';

/** Alta rapida de Articulo desde cualquier documento del modulo (Cotizacion, Requisicion, Orden de Compra, Compra, Movimiento). */
export function NuevoArticuloModal({ onClose, onCreado }: { onClose: () => void; onCreado: (articulo: Articulo) => void }) {
  const { articulos } = useData();
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Pieza');
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [error, setError] = useState('');

  function guardar() {
    const codigoLimpio = codigo.trim();
    const descripcionLimpia = descripcion.trim();
    if (!codigoLimpio || !descripcionLimpia) {
      setError('Falta el codigo o la descripcion.');
      return;
    }
    if (articulos.items.some((a) => a.codigo.trim().toLowerCase() === codigoLimpio.toLowerCase())) {
      setError(`Ya existe un articulo con el codigo ${codigoLimpio}.`);
      return;
    }
    const nuevo: Articulo = { id: uid('art'), codigo: codigoLimpio, descripcion: descripcionLimpia, unidadMedida, precioUnitario, activo: true };
    articulos.add(nuevo);
    onCreado(nuevo);
  }

  return (
    <Modal title="Agregando Articulo" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Codigo">
            <Input required autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </Field>
          <Field label="Unidad de Medida">
            <Input value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} />
          </Field>
        </div>
        <Field label="Descripcion">
          <Input required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Field>
        <div className="max-w-[180px]">
          <Field label="Precio Unitario">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <p className="text-xs text-ink-500">El resto de los datos se pueden completar despues desde el catalogo de Articulos.</p>
        <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
          {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="button" onClick={guardar}>
            Aceptar
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
