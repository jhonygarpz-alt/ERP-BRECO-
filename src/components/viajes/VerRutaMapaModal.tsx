import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Modal } from '../ui/Modal';
import { Field, Input } from '../ui/form';

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

  useEffect(() => {
    if (!mapaRef.current) return;
    let coordenadas: [number, number][] = [];
    try {
      coordenadas = JSON.parse(trazoRuta);
    } catch {
      coordenadas = [];
    }

    const mapa = L.map(mapaRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa);

    if (coordenadas.length > 0) {
      const linea = L.polyline(coordenadas, { color: '#3b82f6', weight: 4 }).addTo(mapa);
      L.circleMarker(coordenadas[0], { radius: 8, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 })
        .bindTooltip('Origen')
        .addTo(mapa);
      L.circleMarker(coordenadas[coordenadas.length - 1], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 })
        .bindTooltip('Destino')
        .addTo(mapa);
      mapa.fitBounds(linea.getBounds(), { padding: [30, 30] });
    }
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
    };
  }, [trazoRuta]);

  return (
    <Modal title="Ver Ruta en Mapa" subtitle={`${origenDireccion} → ${destinoDireccion}`} onClose={onClose} wide="xl">
      <div className="space-y-3">
        <div ref={mapaRef} className="h-96 w-full overflow-hidden rounded-xl border border-line-800" />
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
