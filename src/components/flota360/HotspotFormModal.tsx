import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { CAMPOS_POR_TIPO, TIPOS_HOTSPOT, datosIniciales, useSignedUrl } from '../../lib/unidad360';
import { CATEGORIA_FOTO_POR_TIPO } from '../../lib/unidad360Diagrama';
import type { ModoHotspotUnidad, TipoHotspotUnidad, Unidad, UnidadFoto, UnidadHotspot } from '../../types';
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
  const { unidadHotspots, unidadInspecciones, unidadFotos } = useData();
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

  const ultimaInspeccion = useMemo(
    () =>
      [...unidadInspecciones.items]
        .filter((i) => i.unidadId === unidad.id)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0],
    [unidadInspecciones.items, unidad.id],
  );

  const categoriaRelacionada = CATEGORIA_FOTO_POR_TIPO[tipo];
  const fotosRelacionadas = useMemo(
    () =>
      categoriaRelacionada
        ? unidadFotos.items.filter((f) => f.unidadId === unidad.id && !f.inspeccionId && f.categoria === categoriaRelacionada)
        : [],
    [unidadFotos.items, unidad.id, categoriaRelacionada],
  );

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

        <div className="rounded-xl border border-line-800 bg-bg-900/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Ultima inspeccion</p>
          {ultimaInspeccion ? (
            <p className="text-sm text-ink-300">
              {ultimaInspeccion.tipoEvento} -- {ultimaInspeccion.fecha}
              {ultimaInspeccion.kilometraje ? ` -- ${ultimaInspeccion.kilometraje} km` : ''}
              {ultimaInspeccion.responsable ? ` -- ${ultimaInspeccion.responsable}` : ''}
            </p>
          ) : (
            <p className="text-sm text-ink-600">Sin inspecciones registradas para esta unidad.</p>
          )}
        </div>

        {categoriaRelacionada && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Fotografias relacionadas</p>
            {fotosRelacionadas.length === 0 ? (
              <p className="text-sm text-ink-600">Sin fotos de esta categoria todavia.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fotosRelacionadas.map((f) => (
                  <MiniaturaFoto key={f.id} foto={f} />
                ))}
              </div>
            )}
          </div>
        )}

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

function MiniaturaFoto({ foto }: { foto: UnidadFoto }) {
  const url = useSignedUrl(foto.storagePath);
  return (
    <a href={url ?? undefined} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-line-700 bg-bg-800">
      {url && <img src={url} alt={foto.nombreArchivo} className="h-full w-full object-cover" />}
    </a>
  );
}
