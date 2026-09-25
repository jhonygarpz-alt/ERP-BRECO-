import { useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { mensajeDeError } from '../../lib/errors';
import { CATEGORIAS_FOTO, eliminarFotoUnidadStorage, subirFotoUnidad, useSignedUrl } from '../../lib/unidad360';
import type { CategoriaFotoUnidad, Unidad, UnidadFoto } from '../../types';
import { IconButton } from '../ui/form';

function Slot({
  unidad,
  categoria,
  label,
  foto,
  inspeccionId,
  readOnly,
}: {
  unidad: Unidad;
  categoria: CategoriaFotoUnidad;
  label: string;
  foto: UnidadFoto | undefined;
  inspeccionId?: string;
  readOnly?: boolean;
}) {
  const { unidadFotos, empresa } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const url = useSignedUrl(foto?.storagePath);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setSubiendo(true);
    try {
      const resultado = await subirFotoUnidad(empresa.value.id, unidad.id, file);
      if ('error' in resultado) {
        alert(resultado.error);
        return;
      }
      if (foto) await eliminarFotoUnidadStorage(foto.storagePath);
      await unidadFotos.add({
        id: uid('foto'),
        unidadId: unidad.id,
        inspeccionId,
        categoria,
        storagePath: resultado.path,
        nombreArchivo: file.name,
      });
      if (foto) await unidadFotos.remove(foto.id);
    } catch (err) {
      alert(mensajeDeError(err));
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar() {
    if (!foto) return;
    if (!confirm(`Eliminar la foto "${label}"?`)) return;
    await eliminarFotoUnidadStorage(foto.storagePath);
    await unidadFotos.remove(foto.id);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line-800 bg-bg-900"
        onClick={() => !readOnly && !foto && inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-ink-600">
            <Upload size={20} />
            {!readOnly && <span className="text-[11px]">{subiendo ? 'Subiendo...' : 'Subir'}</span>}
          </div>
        )}
        {!readOnly && foto && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleEliminar();
            }}
            className="absolute right-1.5 top-1.5 bg-black/50 text-white opacity-0 hover:text-breco-500 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </IconButton>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <span className="text-center text-[11px] text-ink-500">{label}</span>
    </div>
  );
}

/** Cuadricula de fotos por categoria de una unidad -- si `inspeccionId` se da, es el juego de fotos de ese evento de inspeccion; si no, son las fotos "actuales" de la unidad (las que usa Vista 360 por defecto). */
export function FotosUnidadGrid({
  unidad,
  fotos,
  inspeccionId,
  readOnly,
}: {
  unidad: Unidad;
  fotos: UnidadFoto[];
  inspeccionId?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
      {CATEGORIAS_FOTO.map((c) => (
        <Slot
          key={c.id}
          unidad={unidad}
          categoria={c.id}
          label={c.label}
          foto={fotos.find((f) => f.categoria === c.id)}
          inspeccionId={inspeccionId}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
