import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { mensajeDeError } from '../../lib/errors';
import { subirFotoUnidad } from '../../lib/unidad360';
import { nextFolioMantenimiento } from '../../lib/mantenimiento';
import type { ReporteFalla, SeveridadDanoUnidad, Unidad } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea } from '../ui/form';

interface Borrador {
  fotoId?: string;
  xPct?: number;
  yPct?: number;
  hotspotId?: string;
  zonaSugerida?: string;
}

const SEVERIDADES: SeveridadDanoUnidad[] = ['Leve', 'Media', 'Grave'];

export function RegistrarDanoModal({ unidad, borrador, onClose }: { unidad: Unidad; borrador: Borrador; onClose: () => void }) {
  const { unidadDanos, reportesFalla, empresa } = useData();
  const [zona, setZona] = useState(borrador.zonaSugerida ?? '');
  const [tipo, setTipo] = useState('Golpe');
  const [severidad, setSeveridad] = useState<SeveridadDanoUnidad>('Media');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [kilometraje, setKilometraje] = useState(unidad.kilometrajeActual ? String(unidad.kilometrajeActual) : '');
  const [observacion, setObservacion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      let storagePath: string | undefined;
      if (archivo) {
        const resultado = await subirFotoUnidad(empresa.value.id, unidad.id, archivo);
        if ('error' in resultado) {
          setError(resultado.error);
          return;
        }
        storagePath = resultado.path;
      }
      // Todo dano registrado en Flota Digital 360 genera de inmediato su
      // Reporte de Falla en Mantenimiento -- asi el taller lo ve sin que
      // alguien tenga que capturarlo dos veces.
      const nuevoReporte: ReporteFalla = {
        id: uid('rf'),
        folio: nextFolioMantenimiento(reportesFalla.items, 'RF-'),
        fecha,
        codigoFalla: '',
        sucursal: unidad.sucursal || 'MATRIZ',
        unidadId: unidad.id,
        descripcion: `[Flota Digital 360] ${zona} -- ${tipo} (severidad ${severidad}).${observacion ? ` ${observacion}` : ''}`,
        documentos: [],
        estatus: 'Abierto',
      };
      await reportesFalla.add(nuevoReporte);
      await unidadDanos.add({
        id: uid('dano'),
        unidadId: unidad.id,
        hotspotId: borrador.hotspotId,
        fotoId: borrador.fotoId,
        xPct: borrador.xPct,
        yPct: borrador.yPct,
        zona,
        tipo,
        severidad,
        fecha,
        kilometraje: kilometraje ? Number(kilometraje) : undefined,
        observacion,
        storagePath,
        estatus: 'Activo',
        reparacion: '',
        reporteFallaId: nuevoReporte.id,
      });
      onClose();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal title="Registrar dano" subtitle={unidad.economico} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Zona">
          <Input required value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej. Defensa, lateral derecho" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Golpe, rayon, faltante..." />
          </Field>
          <Field label="Severidad">
            <Select value={severidad} onChange={(e) => setSeveridad(e.target.value as SeveridadDanoUnidad)}>
              {SEVERIDADES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
        </div>
        <Field label="Observacion">
          <Textarea rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Golpe detectado durante inspeccion de retorno." />
        </Field>
        <Field label="Fotografia (opcional)">
          <Input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
        </Field>
        {error && <p className="text-sm text-breco-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar dano'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
