import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MarcadorFlota {
  id: string;
  folio: string;
  unidad: string;
  posicion: [number, number];
  demorado: boolean;
  trazo?: [number, number][];
}

/**
 * Mapa compartido de Centro de Control y Mapa GPS. Los marcadores muestran
 * la posicion CALCULADA de cada unidad (ver posicionEnRuta en
 * lib/monitoreoViajes.ts) -- no hay hardware de GPS conectado al sistema, asi
 * que esto es una aproximacion sobre el trazo real de la Ruta, no una senal
 * en vivo. Se deja explicito en la leyenda de cada pantalla que lo usa.
 */
export function FlotaMapa({
  marcadores,
  mostrarTrazos = true,
  alturaClase = 'h-96',
}: {
  marcadores: MarcadorFlota[];
  mostrarTrazos?: boolean;
  alturaClase?: string;
}) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa);
    mapaRef.current = mapa;
    capaRef.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const capa = capaRef.current;
    if (!mapa || !capa) return;
    capa.clearLayers();

    if (marcadores.length === 0) return;

    marcadores.forEach((m) => {
      const color = m.demorado ? '#ef4444' : '#0071e3';
      if (mostrarTrazos && m.trazo && m.trazo.length > 1) {
        L.polyline(m.trazo, { color, weight: 2, opacity: 0.4, dashArray: '4 6' }).addTo(capa);
      }
      L.circleMarker(m.posicion, { radius: 9, color, fillColor: color, fillOpacity: 1, weight: 2 })
        .bindTooltip(`${m.unidad} -- ${m.folio}`)
        .addTo(capa);
    });

    const bounds = L.latLngBounds(marcadores.map((m) => m.posicion));
    if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [marcadores, mostrarTrazos]);

  return <div ref={contenedorRef} className={`w-full ${alturaClase} rounded-xl`} />;
}
