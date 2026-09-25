import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { CAMPOS_POR_TIPO, TIPOS_HOTSPOT, datosIniciales } from '../../lib/unidad360';
import type { ModoHotspotUnidad, TipoHotspotUnidad, Unidad, UnidadHotspot } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../ui/form';

interface Borrador {
  modo: ModoHotspotUnidad;
  fotoId?: string;
  xPct?: number;
  yPct?: number;
  posicion3d?: string;
  tipoSugerido?: TipoHotspotUnidad;
  etiquetaSugerida?: string;
}

export function HotspotFormModal({
  unidad,
  hotspot,
  borrador,
  onClose,
}: {
  unidad: Unidad;
  hotspot?: UnidadHotspot | null;
  borrador?: Borrador | null;
  onClose: () => void;
}) {
  const { unidadHotspots } = useData();
  const tipoInicial = hotspot?.tipo ?? borrador?.tipoSugerido ?? 'componente';
  const [tipo, setTipo] = useState<TipoHotspotUnidad>(tipoInicial);
  const [etiqueta, setEtiqueta] = useState(hotspot?.etiqueta ?? borrador?.etiquetaSugerida ?? '');
  const [datos, setDatos] = useState<Record<string, string>>(hotspot?.datos ?? datosIniciales(tipoInicial, unidad));
  const [guardando, setGuardando] = useState(false);

  function cambiarTipo(nuevo: TipoHotspotUnidad) {
    setTipo(nuevo);
    if (!hotspot) setDatos(datosIniciales(nuevo, unidad));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (hotspot) {
        await unidadHotspots.update(hotspot.id, { tipo, etiqueta, datos });
      } else if (borrador) {
        await unidadHotspots.add({
          id: uid('hotspot'),
          unidadId: unidad.id,
          modo: borrador.modo,
          fotoId: borrador.fotoId,
          xPct: borrador.xPct,
          yPct: borrador.yPct,
          posicion3d: borrador.posicion3d,
          tipo,
          etiqueta,
          datos,
        });
      }
      onClose();
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!hotspot) return;
    if (!confirm('Eliminar este punto de informacion?')) return;
    await unidadHotspots.remove(hotspot.id);
    onClose();
  }

  const campos = CAMPOS_POR_TIPO[tipo];

  return (
    <Modal title={hotspot ? 'Editar punto de informacion' : 'Nuevo punto de informacion'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => cambiarTipo(e.target.value as TipoHotspotUnidad)}>
            {TIPOS_HOTSPOT.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Etiqueta">
          <Input value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Ej. Llanta delantera izquierda" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campos.map((c) => (
            <Field key={c.key} label={c.label}>
              <Input
                value={datos[c.key] ?? ''}
                onChange={(e) => setDatos((d) => ({ ...d, [c.key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <div className="flex justify-between gap-2">
          {hotspot ? (
            <GhostButton type="button" onClick={handleEliminar} className="text-breco-500">
              Eliminar
            </GhostButton>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <GhostButton type="button" onClick={onClose}>
              Cancelar
            </GhostButton>
            <PrimaryButton type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
