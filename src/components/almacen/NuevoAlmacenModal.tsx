import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { Almacen } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../ui/form';

/** Alta rapida de Almacen desde cualquier documento del modulo (sin salir a llenar el catalogo). */
export function NuevoAlmacenModal({ onClose, onCreado }: { onClose: () => void; onCreado: (almacen: Almacen) => void }) {
  const { almacenes } = useData();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  function guardar() {
    const codigoLimpio = codigo.trim();
    const nombreLimpio = nombre.trim();
    if (!codigoLimpio || !nombreLimpio) {
      setError('Falta el codigo o el nombre.');
      return;
    }
    if (almacenes.items.some((a) => a.codigo.trim().toLowerCase() === codigoLimpio.toLowerCase())) {
      setError(`Ya existe un almacen con el codigo ${codigoLimpio}.`);
      return;
    }
    const nuevo: Almacen = { id: uid('alm'), codigo: codigoLimpio, nombre: nombreLimpio, activo: true };
    almacenes.add(nuevo);
    onCreado(nuevo);
  }

  return (
    <Modal title="Agregando Almacen" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Codigo">
          <Input required autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </Field>
        <Field label="Nombre">
          <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
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
