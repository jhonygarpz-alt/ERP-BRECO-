import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { mensajeDeError } from '../../lib/errors';
import { subirFotoUnidad } from '../../lib/unidad360';
import { nextFolioMantenimiento } from '../../lib/mantenimiento';
import { supabase } from '../../lib/supabaseClient';
import { reporteFallaToRow } from '../../lib/mappers';
import { POSICIONES_LLANTA_NUMERADAS } from '../../lib/unidad360Diagrama';
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
  const [esLlanta, setEsLlanta] = useState(false);
  const [numeroLlanta, setNumeroLlanta] = useState<number | ''>('');
  const [zona, setZona] = useState(borrador.zonaSugerida ?? '');
  const [tipo, setTipo] = useState('Golpe');
  const [severidad, setSeveridad] = useState<SeveridadDanoUnidad>('Media');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [kilometraje, setKilometraje] = useState(unidad.kilometrajeActual ? String(unidad.kilometrajeActual) : '');
  const [observacion, setObservacion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function elegirPosicionLlanta(valor: string) {
    const num = valor ? Number(valor) : '';
    setNumeroLlanta(num);
    const posicion = POSICIONES_LLANTA_NUMERADAS.find((p) => p.numero === num);
    if (posicion) setZona(`Llanta ${posicion.label}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (esLlanta && numeroLlanta === '') {
      setError('Selecciona el numero de la llanta afectada.');
      return;
    }
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
      // Insercion directa (no via reportesFalla.add): esa funcion nunca
      // lanza en caso de error de RLS/red -- solo hace un alert() y sigue
      // -- lo que dejaria crear el dano igual aunque el reporte fallara,
      // sin que el usuario lo note. Aqui, si falla, se aborta todo (el
      // catch de abajo lo muestra como error real dentro del modal).
      const { error: errReporte } = await supabase.from('reportes_falla').insert(reporteFallaToRow(nuevoReporte) as never);
      if (errReporte) throw errReporte;
      reportesFalla.reload();
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
        posicion3d:
          esLlanta && numeroLlanta !== ''
            ? POSICIONES_LLANTA_NUMERADAS.find((p) => p.numero === numeroLlanta)?.clusterKey
            : undefined,
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
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={esLlanta}
            onChange={(e) => {
              setEsLlanta(e.target.checked);
              if (!e.target.checked) setNumeroLlanta('');
            }}
            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
          />
          Es un dano de llanta
        </label>

        {esLlanta && (
          <Field label="Numero de la llanta">
            <Select value={numeroLlanta} onChange={(e) => elegirPosicionLlanta(e.target.value)}>
              <option value="">Selecciona...</option>
              {POSICIONES_LLANTA_NUMERADAS.map((p) => (
                <option key={p.numero} value={p.numero}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

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
