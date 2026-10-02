import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Modal } from '../ui/Modal';
import { Field, Input } from '../ui/form';
import { pinIcon } from './pinesMapa';

/**
 * Muestra en un mapa el trazo ya guardado de una ruta (sin volver a
 * geocodificar ni recalcular nada contra OSRM), para que se pueda verificar
 * de un vistazo que el trayecto asignado al viaje es el correcto.
 */
export function VerRutaMapaModal({
  origenDireccion,
  destinoDireccion,
  kilometros,
  horas,
  trazoRuta,
  onClose,
}: {
  origenDireccion: string;
  destinoDireccion: string;
  kilometros: number;
  horas: number;
  trazoRuta: string;
  onClose: () => void;
}) {
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaInstancia = useRef<L.Map | null>(null);
  const capaCalles = useRef<L.TileLayer | null>(null);
  const capaSatelital = useRef<L.TileLayer | null>(null);
  const [vistaSatelital, setVistaSatelital] = useState(false);
  const [hayTrazo, setHayTrazo] = useState(false);

  function alternarVistaSatelital() {
    const mapa = mapaInstancia.current;
    if (!mapa || !capaCalles.current || !capaSatelital.current) return;
    if (vistaSatelital) {
      mapa.removeLayer(capaSatelital.current);
      mapa.addLayer(capaCalles.current);
    } else {
      mapa.removeLayer(capaCalles.current);
      mapa.addLayer(capaSatelital.current);
    }
    setVistaSatelital(!vistaSatelital);
  }

  useEffect(() => {
    if (!mapaRef.current) return;
    let coordenadas: [number, number][] = [];
    try {
      coordenadas = JSON.parse(trazoRuta);
    } catch {
      coordenadas = [];
    }

    const mapa = L.map(mapaRef.current).setView([23.6345, -102.5528], 5);
    capaCalles.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa);
    capaSatelital.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19 },
    );
    mapaInstancia.current = mapa;

    if (coordenadas.length > 0) {
      const linea = L.polyline(coordenadas, { color: '#3b82f6', weight: 4 }).addTo(mapa);
      L.marker(coordenadas[0], { icon: pinIcon('#22c55e', 'A') })
        .bindTooltip('Origen', { permanent: true, direction: 'top', offset: [0, -24] })
        .addTo(mapa);
      L.marker(coordenadas[coordenadas.length - 1], { icon: pinIcon('#ef4444', 'B') })
        .bindTooltip('Destino', { permanent: true, direction: 'top', offset: [0, -24] })
        .addTo(mapa);
      mapa.fitBounds(linea.getBounds(), { padding: [30, 30] });
      setHayTrazo(true);
    }
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaInstancia.current = null;
    };
  }, [trazoRuta]);

  return (
    <Modal title="Ver Ruta en Mapa" subtitle={`${origenDireccion} → ${destinoDireccion}`} onClose={onClose} wide="xl">
      <div className="space-y-3">
        <div className="relative">
          <div ref={mapaRef} className="h-96 w-full overflow-hidden rounded-xl border border-line-800" />
          <button
            type="button"
            onClick={alternarVistaSatelital}
            className="absolute right-2 top-2 z-[1000] rounded-lg border border-line-700 bg-bg-800/90 px-3 py-1.5 text-xs font-medium text-ink-200 shadow-lg hover:bg-bg-700"
          >
            {vistaSatelital ? 'Vista calles' : 'Vista satelital'}
          </button>
          {hayTrazo && (
            <div className="absolute bottom-2 left-2 z-[1000] flex items-center gap-3 rounded-lg border border-line-700 bg-bg-800/90 px-3 py-1.5 text-xs text-ink-200 shadow-lg">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Origen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Destino
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:grid-cols-4">
          <Field label="Kilometros">
            <Input readOnly value={kilometros} />
          </Field>
          <Field label="Horas (estimado)">
            <Input readOnly value={horas} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
