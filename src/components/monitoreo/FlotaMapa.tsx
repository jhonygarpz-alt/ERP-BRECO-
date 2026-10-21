import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Layers, Satellite, TrafficCone } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type CapaBase = 'calles' | 'satelite';

// Ambas son servicios publicos gratuitos, sin llave/API key -- igual que las
// calles de OpenStreetMap que ya se usaban. "Satelite" es el servicio
// publico de imagenes de Esri (no Google Satellite), asi que la resolucion y
// fecha de la foto pueden variar por zona.
const TILES_BASE: Record<CapaBase, { url: string; attribution: string }> = {
  calles: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

// A diferencia de las dos anteriores, el trafico en tiempo real SI necesita
// una llave (gratuita, sin tarjeta) de TomTom -- se configura como variable
// de entorno de Vite (VITE_TOMTOM_API_KEY) para no quedar escrita en el
// codigo fuente. Mientras esa variable no exista, el boton de Trafico no se
// muestra (en vez de mostrar un boton que no puede funcionar).
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY as string | undefined;
const TILE_TRAFICO_URL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`;

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

export interface FlotaMapaHandle {
  /** Centra y acerca el mapa sobre la unidad indicada (si esta en los marcadores actuales). */
  centrarEn: (id: string) => void;
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
      <div style="position:relative;width:${TAMANO_CAMION}px;height:${TAMANO_CAMION}px;cursor:pointer;">
        <img src="${ICONO_CAMION_URL}" class="camion-gps-img" style="width:100%;height:100%;display:block;transition:transform 0.6s linear;transform:rotate(0deg);" />
        <span class="camion-gps-estado" style="position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:9999px;background:#9ca3af;border:2px solid white;"></span>
      </div>
    `,
    iconSize: [TAMANO_CAMION, TAMANO_CAMION],
    iconAnchor: [TAMANO_CAMION / 2, TAMANO_CAMION / 2],
  });
}

/** Dibuja una ruta "iluminada" (varias lineas apiladas, mas anchas y transparentes por debajo) en vez de la linea punteada tenue normal -- para resaltar hacia donde va una unidad especifica. */
function dibujarRutaResaltada(capa: L.LayerGroup, trazo: [number, number][]) {
  const color = '#22d3ee';
  L.polyline(trazo, { color, weight: 16, opacity: 0.12 }).addTo(capa);
  L.polyline(trazo, { color, weight: 9, opacity: 0.25 }).addTo(capa);
  L.polyline(trazo, { color, weight: 3, opacity: 1 }).addTo(capa);
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
export const FlotaMapa = forwardRef<
  FlotaMapaHandle,
  {
    marcadores: MarcadorFlota[];
    mostrarTrazos?: boolean;
    alturaClase?: string;
    /** id del marcador cuya ruta se dibuja "iluminada"; oculta las demas rutas mientras este activo. */
    rutaResaltadaId?: string | null;
    onSeleccionar?: (id: string) => void;
  }
>(function FlotaMapa({ marcadores, mostrarTrazos = true, alturaClase = 'h-96', rutaResaltadaId = null, onSeleccionar }, ref) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaBaseRef = useRef<L.TileLayer | null>(null);
  const capaTrazosRef = useRef<L.LayerGroup | null>(null);
  const capaTraficoRef = useRef<L.TileLayer | null>(null);
  const marcadoresRef = useRef<Map<string, L.Marker>>(new Map());
  const [capaBase, setCapaBase] = useState<CapaBase>('calles');
  const [mostrarTrafico, setMostrarTrafico] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      centrarEn(id: string) {
        const mapa = mapaRef.current;
        const marker = marcadoresRef.current.get(id);
        if (!mapa || !marker) return;
        mapa.setView(marker.getLatLng(), Math.max(mapa.getZoom(), 13), { animate: true });
      },
    }),
    [],
  );

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView([23.6345, -102.5528], 5);
    capaBaseRef.current = L.tileLayer(TILES_BASE.calles.url, { attribution: TILES_BASE.calles.attribution, maxZoom: 19 }).addTo(mapa);
    mapaRef.current = mapa;
    capaTrazosRef.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaRef.current = null;
      capaBaseRef.current = null;
      capaTrazosRef.current = null;
      capaTraficoRef.current = null;
      marcadoresRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !TOMTOM_API_KEY) return;
    if (mostrarTrafico) {
      capaTraficoRef.current = L.tileLayer(TILE_TRAFICO_URL, { maxZoom: 19, opacity: 0.85 }).addTo(mapa);
    } else if (capaTraficoRef.current) {
      mapa.removeLayer(capaTraficoRef.current);
      capaTraficoRef.current = null;
    }
  }, [mostrarTrafico]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (capaBaseRef.current) mapa.removeLayer(capaBaseRef.current);
    const { url, attribution } = TILES_BASE[capaBase];
    capaBaseRef.current = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapa);
    capaBaseRef.current.bringToBack();
  }, [capaBase]);

  useEffect(() => {
    const mapa = mapaRef.current;
    const capaTrazos = capaTrazosRef.current;
    if (!mapa || !capaTrazos) return;

    capaTrazos.clearLayers();
    const resaltado = rutaResaltadaId ? marcadores.find((m) => m.id === rutaResaltadaId) : undefined;
    if (resaltado?.trazo && resaltado.trazo.length > 1) {
      dibujarRutaResaltada(capaTrazos, resaltado.trazo);
    } else if (mostrarTrazos) {
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
      marker.off('click').on('click', () => onSeleccionar?.(m.id));

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

    if (resaltado?.trazo && resaltado.trazo.length > 1) {
      const bounds = L.latLngBounds(resaltado.trazo);
      if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [50, 50] });
    } else {
      const bounds = L.latLngBounds(marcadores.map((m) => m.posicion));
      if (bounds.isValid()) mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    }
  }, [marcadores, mostrarTrazos, rutaResaltadaId, onSeleccionar]);

  return (
    <div className="relative">
      <div ref={contenedorRef} className={`w-full ${alturaClase} rounded-xl`} />
      <div className="absolute bottom-3 left-3 z-[1000] flex overflow-hidden rounded-lg border border-line-700 bg-bg-900/95 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setCapaBase('calles')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
            capaBase === 'calles' ? 'bg-breco-500 text-white' : 'text-ink-300 hover:bg-bg-800'
          }`}
        >
          <Layers size={13} />
          Calles
        </button>
        <button
          type="button"
          onClick={() => setCapaBase('satelite')}
          className={`flex items-center gap-1.5 border-l border-line-700 px-3 py-1.5 text-xs font-medium transition ${
            capaBase === 'satelite' ? 'bg-breco-500 text-white' : 'text-ink-300 hover:bg-bg-800'
          }`}
        >
          <Satellite size={13} />
          Satelite
        </button>
        {TOMTOM_API_KEY && (
          <button
            type="button"
            onClick={() => setMostrarTrafico((v) => !v)}
            className={`flex items-center gap-1.5 border-l border-line-700 px-3 py-1.5 text-xs font-medium transition ${
              mostrarTrafico ? 'bg-breco-500 text-white' : 'text-ink-300 hover:bg-bg-800'
            }`}
          >
            <TrafficCone size={13} />
            Trafico
          </button>
        )}
      </div>
    </div>
  );
});
