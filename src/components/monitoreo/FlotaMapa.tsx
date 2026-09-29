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
  /** true si `posicion` viene de una plataforma de GPS real conectada, no de la posicion calculada sobre la Ruta. */
  enVivo?: boolean;
  /** Rumbo en grados (0=Norte, 90=Este, 180=Sur, 270=Oeste) para orientar el icono del camion. */
  rumbo?: number | null;
}

const TAMANO_CAMION = 38;

// El PNG viene visto desde arriba con el frente apuntando al Norte (0 grados)
// en reposo, para que el `rumbo` (0=Norte, 90=Este, 180=Sur, 270=Oeste) se
// pueda aplicar directamente como rotacion sin ningun ajuste.
const ICONO_CAMION_URL = '/monitoreo/camion-gps.png';

function crearIconoCamion(): L.DivIcon {
  return L.divIcon({
    className: 'camion-gps-marcador',
    html: `
      <div style="position:relative;width:${TAMANO_CAMION}px;height:${TAMANO_CAMION}px;">
        <img src="${ICONO_CAMION_URL}" class="camion-gps-img" style="width:100%;height:100%;display:block;transition:transform 0.6s linear;transform:rotate(0deg);" />
        <span class="camion-gps-estado" style="position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:9999px;background:#9ca3af;border:2px solid white;"></span>
      </div>
    `,
    iconSize: [TAMANO_CAMION, TAMANO_CAMION],
    iconAnchor: [TAMANO_CAMION / 2, TAMANO_CAMION / 2],
  });
}

/**
 * Mapa compartido de Centro de Control y Mapa GPS. Cada unidad se dibuja con
 * un icono de camion visto desde arriba, orientado segun `rumbo`. Mientras
 * no haya una plataforma de GPS conectada, `posicion`/`rumbo` vienen de un
 * CALCULO sobre el trazo real de la Ruta (tiempo transcurrido / horas
 * autorizadas), no de una senal real -- se distingue con el punto de estado
 * gris ("posicion estimada") vs. verde con halo ("GPS en vivo"). Los
 * marcadores se reutilizan entre actualizaciones (no se recrean) para que la
 * transicion de posicion/rotacion se vea suave en vez de saltar de golpe.
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
  const capaTrazosRef = useRef<L.LayerGroup | null>(null);
  const marcadoresRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa);
    mapaRef.current = mapa;
    capaTrazosRef.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaRef.current = null;
      capaTrazosRef.current = null;
      marcadoresRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const capaTrazos = capaTrazosRef.current;
    if (!mapa || !capaTrazos) return;

    capaTrazos.clearLayers();
    if (mostrarTrazos) {
      marcadores.forEach((m) => {
        if (!m.trazo || m.trazo.length < 2) return;
        const color = m.demorado ? '#ef4444' : '#0071e3';
        L.polyline(m.trazo, { color, weight: 2, opacity: 0.4, dashArray: '4 6' }).addTo(capaTrazos);
      });
    }

    const vistos = new Set<string>();
    marcadores.forEach((m) => {
      vistos.add(m.id);
      const colorEstado = m.demorado ? '#ef4444' : m.enVivo ? '#22c55e' : '#9ca3af';

      let marker = marcadoresRef.current.get(m.id);
      if (!marker) {
        marker = L.marker(m.posicion, { icon: crearIconoCamion() }).addTo(mapa);
        marcadoresRef.current.set(m.id, marker);
      } else {
        marker.setLatLng(m.posicion);
      }
      marker.bindTooltip(`${m.unidad} -- ${m.folio}${m.enVivo ? ' (GPS en vivo)' : ' (posicion estimada)'}`);

      const el = marker.getElement();
      const img = el?.querySelector<HTMLImageElement>('.camion-gps-img');
      if (img) img.style.transform = `rotate(${m.rumbo ?? 0}deg)`;
      const punto = el?.querySelector<HTMLSpanElement>('.camion-gps-estado');
      if (punto) {
        punto.style.background = colorEstado;
        punto.style.boxShadow = m.enVivo ? `0 0 6px ${colorEstado}` : 'none';
      }
    });

    for (const [id, marker] of marcadoresRef.current) {
      if (!vistos.has(id)) {
        marker.remove();
        marcadoresRef.current.delete(id);
      }
    }

    const bounds = L.latLngBounds(marcadores.map((m) => m.posicion));
    if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [marcadores, mostrarTrazos]);

  return <div ref={contenedorRef} className={`w-full ${alturaClase} rounded-xl`} />;
}
