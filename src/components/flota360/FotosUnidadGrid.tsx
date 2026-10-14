import { useRef, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { mensajeDeError } from '../../lib/errors';
import { CATEGORIAS_FOTO, CATEGORIAS_FOTO_MULTIPLES, eliminarFotoUnidadStorage, subirFotoUnidad, useSignedUrl } from '../../lib/unidad360';
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

function MultiThumb({ foto, label, readOnly, onDelete }: { foto: UnidadFoto; label: string; readOnly?: boolean; onDelete: () => void }) {
  const url = useSignedUrl(foto.storagePath);
  return (
    <div className="group relative aspect-square w-16 overflow-hidden rounded-lg border border-line-800 bg-bg-900">
      {url && <img src={url} alt={label} className="h-full w-full object-cover" />}
      {!readOnly && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-0.5 top-0.5 bg-black/50 text-white opacity-0 hover:text-breco-500 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </IconButton>
      )}
    </div>
  );
}

/** Igual que Slot, pero permite varias fotos a la vez en la misma categoria: no reemplaza la anterior, agrega una mas con el boton "+". */
function MultiSlot({
  unidad,
  categoria,
  label,
  fotos,
  inspeccionId,
  readOnly,
}: {
  unidad: Unidad;
  categoria: CategoriaFotoUnidad;
  label: string;
  fotos: UnidadFoto[];
  inspeccionId?: string;
  readOnly?: boolean;
}) {
  const { unidadFotos, empresa } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setSubiendo(true);
    try {
      const resultado = await subirFotoUnidad(empresa.value.id, unidad.id, file);
      if ('error' in resultado) {
        alert(resultado.error);
        return;
      }
      await unidadFotos.add({
        id: uid('foto'),
        unidadId: unidad.id,
        inspeccionId,
        categoria,
        storagePath: resultado.path,
        nombreArchivo: file.name,
      });
    } catch (err) {
      alert(mensajeDeError(err));
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleEliminar(foto: UnidadFoto) {
    if (!confirm(`Eliminar esta foto de "${label}"?`)) return;
    await eliminarFotoUnidadStorage(foto.storagePath);
    await unidadFotos.remove(foto.id);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {fotos.map((foto) => (
          <MultiThumb key={foto.id} foto={foto} label={label} readOnly={readOnly} onDelete={() => handleEliminar(foto)} />
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-line-700 bg-bg-900 text-ink-600 hover:border-breco-500 hover:text-breco-500"
          >
            <Plus size={16} />
            <span className="text-[9px]">{subiendo ? '...' : 'Agregar'}</span>
          </button>
        )}
      </div>
      {!readOnly && (
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      )}
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
      {CATEGORIAS_FOTO.map((c) =>
        CATEGORIAS_FOTO_MULTIPLES.includes(c.id) ? (
          <MultiSlot
            key={c.id}
            unidad={unidad}
            categoria={c.id}
            label={c.label}
            fotos={fotos.filter((f) => f.categoria === c.id)}
            inspeccionId={inspeccionId}
            readOnly={readOnly}
          />
        ) : (
          <Slot
            key={c.id}
            unidad={unidad}
            categoria={c.id}
            label={c.label}
            foto={fotos.find((f) => f.categoria === c.id)}
            inspeccionId={inspeccionId}
            readOnly={readOnly}
          />
        ),
      )}
    </div>
  );
}
