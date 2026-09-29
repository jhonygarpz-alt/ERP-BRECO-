import { Camera, Crosshair, Navigation2, X } from 'lucide-react';
import { StatusBadge, type Tone } from '../ui/Badge';
import { GhostButton, PrimaryButton } from '../ui/form';

export interface UnidadMapaCardInfo {
  folio: string;
  economico: string;
  placas: string;
  operador: string;
  cliente: string;
  origen: string;
  destino: string;
  eta: string;
  estatusTexto: string;
  estatusTono: Tone;
  enVivo: boolean;
  velocidadTexto: string;
  ultimaActualizacion: string;
  posicion: [number, number];
  rumbo?: number | null;
}

/**
 * Abre Google Street View (la version publica y gratuita de maps.google.com
 * en una pestana nueva, no la API de pago) centrada en la posicion de la
 * unidad. Como la posicion puede ser CALCULADA (sin GPS real conectado), la
 * foto que muestre Street View es la del punto sobre el mapa, no
 * necesariamente donde esta la unidad en este momento -- el texto del boton
 * lo aclara cuando aplica.
 */
function abrirVistaCalle(posicion: [number, number], rumbo?: number | null) {
  const [lat, lon] = posicion;
  const heading = rumbo ?? 0;
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=${heading}&pitch=0&fov=80`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Tarjeta flotante con la info de la unidad seleccionada en el Mapa GPS /
 * Centro de Control. Solo muestra datos que el sistema realmente tiene hoy
 * -- velocidad y "ultima actualizacion" quedan en "N/D" mientras la posicion
 * sea calculada (no hay GPS real conectado), en vez de inventar un valor.
 */
export function UnidadMapaCard({
  info,
  rutaResaltada,
  onClose,
  onCentrar,
  onVerRecorrido,
  onVerDetalle,
}: {
  info: UnidadMapaCardInfo;
  rutaResaltada: boolean;
  onClose: () => void;
  onCentrar: () => void;
  onVerRecorrido: () => void;
  onVerDetalle: () => void;
}) {
  return (
    <div className="absolute right-3 top-3 z-[1000] w-80 rounded-xl border border-line-700 bg-bg-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-ink-100">{info.economico}</p>
          <p className="text-xs text-ink-500">{info.placas || 'Sin placas'}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-ink-500 hover:text-ink-100" title="Cerrar">
          <X size={16} />
        </button>
      </div>

      <div className="mt-2">
        <StatusBadge status={info.estatusTexto} tone={info.estatusTono} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <p className="text-ink-600">Viaje</p>
          <p className="font-medium text-ink-200">{info.folio}</p>
        </div>
        <div>
          <p className="text-ink-600">Operador</p>
          <p className="font-medium text-ink-200">{info.operador}</p>
        </div>
        <div>
          <p className="text-ink-600">Cliente</p>
          <p className="font-medium text-ink-200">{info.cliente}</p>
        </div>
        <div>
          <p className="text-ink-600">ETA</p>
          <p className="font-medium text-ink-200">{info.eta}</p>
        </div>
        <div className="col-span-2">
          <p className="text-ink-600">Ruta</p>
          <p className="font-medium text-ink-200">
            {info.origen || 'N/D'} → {info.destino || 'N/D'}
          </p>
        </div>
        <div>
          <p className="text-ink-600">Velocidad</p>
          <p className="font-medium text-ink-200">{info.velocidadTexto}</p>
        </div>
        <div>
          <p className="text-ink-600">Ultima actualizacion</p>
          <p className="font-medium text-ink-200">{info.ultimaActualizacion}</p>
        </div>
      </div>

      {!info.enVivo && (
        <p className="mt-3 rounded-lg bg-bg-800 px-2.5 py-1.5 text-[11px] text-ink-500">
          Posicion, velocidad y hora estimadas (calculadas sobre la Ruta) -- esta unidad no tiene una plataforma de GPS
          conectada todavia.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <GhostButton type="button" onClick={onCentrar} className="flex items-center gap-1.5 text-xs">
          <Crosshair size={13} />
          Centrar unidad
        </GhostButton>
        <GhostButton type="button" onClick={onVerRecorrido} className="flex items-center gap-1.5 text-xs">
          <Navigation2 size={13} />
          {rutaResaltada ? 'Ocultar recorrido' : 'Ver recorrido'}
        </GhostButton>
        <GhostButton
          type="button"
          onClick={() => abrirVistaCalle(info.posicion, info.rumbo)}
          className="flex items-center gap-1.5 text-xs"
          title="Abre Google Street View en una pestana nueva"
        >
          <Camera size={13} />
          Vista de calle
        </GhostButton>
        <PrimaryButton type="button" onClick={onVerDetalle} className="text-xs">
          Ver detalle
        </PrimaryButton>
      </div>
    </div>
  );
}
