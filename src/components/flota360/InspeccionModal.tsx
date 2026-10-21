import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import type { TipoEventoInspeccionUnidad, Unidad } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea } from '../ui/form';

const TIPOS_EVENTO: TipoEventoInspeccionUnidad[] = ['Recepcion', 'Inspeccion', 'Operacion', 'Mantenimiento', 'Entrega'];

export function InspeccionModal({ unidad, onClose, onCreada }: { unidad: Unidad; onClose: () => void; onCreada: (id: string) => void }) {
  const { unidadInspecciones } = useData();
  const [tipoEvento, setTipoEvento] = useState<TipoEventoInspeccionUnidad>('Inspeccion');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [kilometraje, setKilometraje] = useState(unidad.kilometrajeActual ? String(unidad.kilometrajeActual) : '');
  const [responsable, setResponsable] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const id = uid('insp');
      await unidadInspecciones.add({
        id,
        unidadId: unidad.id,
        tipoEvento,
        fecha,
        kilometraje: kilometraje ? Number(kilometraje) : undefined,
        responsable,
        notas,
      });
      onCreada(id);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal title="Nueva inspeccion" subtitle={unidad.economico} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de evento">
            <Select value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value as TipoEventoInspeccionUnidad)}>
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Kilometraje">
            <Input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} />
          </Field>
          <Field label="Responsable">
            <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>
        <p className="text-xs text-ink-500">
          Despues de crear la inspeccion podras subir el juego de fotos de ese evento, para compararlo despues con otro.
        </p>
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="submit" disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear inspeccion'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
