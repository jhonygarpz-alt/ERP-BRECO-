import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { CategoriaFotoUnidad, UnidadDano, UnidadFoto, UnidadHotspot } from '../../types';
import { CATEGORIAS_360, colorEstatusDano, useSignedUrl } from '../../lib/unidad360';

type ModoColocar = null | 'hotspot' | 'dano';

/** Visor tipo "360" con las fotos reales de la unidad: alterna entre frontal/trasera/laterales con flechas, con los hotspots y marcadores de dano posicionados sobre la foto real (no un modelo generico). */
export function UnidadFotoViewer({
  fotos,
  hotspots,
  danos,
  modoEdicion,
  onAgregarHotspot,
  onSelectHotspot,
  onAgregarDano,
}: {
  fotos: UnidadFoto[];
  hotspots: UnidadHotspot[];
  danos: UnidadDano[];
  modoEdicion?: boolean;
  onAgregarHotspot?: (fotoId: string, xPct: number, yPct: number) => void;
  onSelectHotspot?: (hotspot: UnidadHotspot) => void;
  onAgregarDano?: (fotoId: string, xPct: number, yPct: number) => void;
}) {
  const disponibles = useMemo(
    () => CATEGORIAS_360.map((c) => c.id).filter((id) => fotos.some((f) => f.categoria === id)),
    [fotos],
  );
  const [indice, setIndice] = useState(0);
  const [modoColocar, setModoColocar] = useState<ModoColocar>(null);
  const categoriaActual: CategoriaFotoUnidad | undefined = disponibles[indice];
  const foto = fotos.find((f) => f.categoria === categoriaActual);
  const url = useSignedUrl(foto?.storagePath);

  const hotspotsFoto = foto ? hotspots.filter((h) => h.modo === 'foto' && h.fotoId === foto.id) : [];
  const danosFoto = foto ? danos.filter((d) => d.fotoId === foto.id) : [];

  function handleClickImagen(e: React.MouseEvent<HTMLDivElement>) {
    if (!modoColocar || !foto) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    if (modoColocar === 'hotspot') onAgregarHotspot?.(foto.id, xPct, yPct);
    else onAgregarDano?.(foto.id, xPct, yPct);
    setModoColocar(null);
  }

  if (disponibles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-600">
        <ImageOff size={32} />
        <p className="text-sm">Todavia no hay fotos frontal/trasera/laterales de esta unidad.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className="relative flex-1 overflow-hidden rounded-xl bg-bg-950"
        onClick={handleClickImagen}
        style={{ cursor: modoColocar ? 'crosshair' : 'default' }}
      >
        {url ? (
          <img src={url} alt={categoriaActual} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-600">Cargando...</div>
        )}
        {hotspotsFoto.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectHotspot?.(h);
            }}
            title={h.etiqueta || h.tipo}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-breco-500 shadow-lg"
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
          />
        ))}
        {danosFoto.map((d) => (
          <span
            key={d.id}
            title={`${d.tipo} -- ${d.zona}`}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
            style={{ left: `${d.xPct}%`, top: `${d.yPct}%`, background: colorEstatusDano(d.estatus) }}
          />
        ))}
        {disponibles.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndice((i) => (i - 1 + disponibles.length) % disponibles.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndice((i) => (i + 1) % disponibles.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
              360 · {indice + 1}/{disponibles.length}
            </div>
          </>
        )}
      </div>
      {modoEdicion && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoColocar(modoColocar === 'hotspot' ? null : 'hotspot')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              modoColocar === 'hotspot' ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400 hover:text-ink-100'
            }`}
          >
            {modoColocar === 'hotspot' ? 'Haz clic en la foto...' : '+ Punto de informacion'}
          </button>
          <button
            type="button"
            onClick={() => setModoColocar(modoColocar === 'dano' ? null : 'dano')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              modoColocar === 'dano' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-line-700 text-ink-400 hover:text-ink-100'
            }`}
          >
            {modoColocar === 'dano' ? 'Haz clic en la foto...' : '+ Registrar dano'}
          </button>
        </div>
      )}
    </div>
  );
}
