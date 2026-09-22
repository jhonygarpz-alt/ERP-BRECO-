import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';
import { buscarSugerenciasDireccion, calcularRuta, geocodificarDireccion, type PuntoGeocodificado, type RutaCalculada } from '../../lib/rutaMapa';
import { mensajeDeError } from '../../lib/errors';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, inputClass } from '../ui/form';

// Autocompletado tipo "Google Maps": mientras el usuario escribe se buscan
// sugerencias con debounce (nunca en cada tecla) para respetar el limite de
// uso razonable de Nominatim. `saltarRef` evita relanzar la busqueda cuando
// el texto cambia porque el propio usuario eligio una sugerencia (ya no hace
// falta volver a buscar esa misma direccion).
function useSugerenciasDireccion(texto: string) {
  const [sugerencias, setSugerencias] = useState<PuntoGeocodificado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saltarRef = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (saltarRef.current) {
      saltarRef.current = false;
      return;
    }
    const termino = texto.trim();
    if (termino.length < 3) {
      setSugerencias([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    timerRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarSugerenciasDireccion(termino);
        setSugerencias(resultados);
      } catch {
        setSugerencias([]);
      } finally {
        setBuscando(false);
      }
    }, 450);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [texto]);

  return {
    sugerencias,
    buscando,
    limpiar: () => setSugerencias([]),
    saltarSiguienteBusqueda: () => {
      saltarRef.current = true;
    },
  };
}

function CampoDireccion({
  label,
  valor,
  onCambiar,
  onSeleccionar,
  sugerencias,
  buscando,
  abierto,
  onAbrir,
  onCerrar,
}: {
  label: string;
  valor: string;
  onCambiar: (texto: string) => void;
  onSeleccionar: (punto: PuntoGeocodificado) => void;
  sugerencias: PuntoGeocodificado[];
  buscando: boolean;
  abierto: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
}) {
  const mostrarLista = abierto && (buscando || sugerencias.length > 0);
  return (
    <div className="relative">
      <Field label={label}>
        <input
          className={inputClass}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          onFocus={onAbrir}
          onBlur={onCerrar}
          placeholder="Direccion, ciudad, planta..."
          autoComplete="off"
        />
      </Field>
      {mostrarLista && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line-700 bg-bg-800 shadow-xl">
          {buscando && sugerencias.length === 0 && (
            <li className="flex items-center gap-2 px-3 py-2 text-xs text-ink-500">
              <Loader2 size={14} className="animate-spin" /> Buscando direcciones en Mexico...
            </li>
          )}
          {sugerencias.map((s, i) => (
            <li
              key={`${s.lat}-${s.lon}-${i}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSeleccionar(s)}
              className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-bg-700"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-breco-500" />
              <span>{s.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TrazarRutaModal({
  origenInicial,
  destinoInicial,
  onConfirmar,
  onClose,
}: {
  origenInicial: string;
  destinoInicial: string;
  onConfirmar: (datos: { origenDireccion: string; destinoDireccion: string; kilometros: number; horas: number; trazoRuta: string }) => void;
  onClose: () => void;
}) {
  const [origenTexto, setOrigenTexto] = useState(origenInicial);
  const [destinoTexto, setDestinoTexto] = useState(destinoInicial);
  const [origenPunto, setOrigenPunto] = useState<PuntoGeocodificado | null>(null);
  const [destinoPunto, setDestinoPunto] = useState<PuntoGeocodificado | null>(null);
  const [origenAbierto, setOrigenAbierto] = useState(false);
  const [destinoAbierto, setDestinoAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<RutaCalculada | null>(null);

  const origenSug = useSugerenciasDireccion(origenTexto);
  const destinoSug = useSugerenciasDireccion(destinoTexto);

  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaInstancia = useRef<L.Map | null>(null);
  const capaRuta = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapaRef.current || mapaInstancia.current) return;
    const mapa = L.map(mapaRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapa);
    mapaInstancia.current = mapa;
    capaRuta.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaInstancia.current = null;
    };
  }, []);

  function seleccionarOrigen(punto: PuntoGeocodificado) {
    origenSug.saltarSiguienteBusqueda();
    setOrigenTexto(punto.displayName);
    setOrigenPunto(punto);
    setOrigenAbierto(false);
    origenSug.limpiar();
  }

  function seleccionarDestino(punto: PuntoGeocodificado) {
    destinoSug.saltarSiguienteBusqueda();
    setDestinoTexto(punto.displayName);
    setDestinoPunto(punto);
    setDestinoAbierto(false);
    destinoSug.limpiar();
  }

  async function trazar() {
    if (!origenTexto.trim() || !destinoTexto.trim()) {
      setError('Escribe el origen y el destino.');
      return;
    }
    setCargando(true);
    setError('');
    setResultado(null);
    // Se limpia el mapa ANTES de intentar geocodificar/trazar: si la
    // busqueda falla, el mapa debe quedar vacio (no mostrar el trazo de un
    // intento anterior), de lo contrario parece que el sistema encontro un
    // destino equivocado cuando en realidad solo esta mostrando informacion
    // vieja que nunca se borro.
    capaRuta.current?.clearLayers();
    try {
      const [origen, destino] = await Promise.all([
        origenPunto ?? geocodificarDireccion(origenTexto),
        destinoPunto ?? geocodificarDireccion(destinoTexto),
      ]);
      const ruta = await calcularRuta(origen, destino);
      setResultado(ruta);

      const mapa = mapaInstancia.current;
      const capa = capaRuta.current;
      if (mapa && capa) {
        L.circleMarker([origen.lat, origen.lon], { radius: 8, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 })
          .bindTooltip('Origen')
          .addTo(capa);
        L.circleMarker([destino.lat, destino.lon], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 })
          .bindTooltip('Destino')
          .addTo(capa);
        const linea = L.polyline(ruta.coordenadas, { color: '#3b82f6', weight: 4 }).addTo(capa);
        mapa.fitBounds(linea.getBounds(), { padding: [30, 30] });
      }
    } catch (err) {
      setError(mensajeDeError(err));
      setResultado(null);
    } finally {
      setCargando(false);
    }
  }

  function confirmar() {
    if (!resultado) return;
    onConfirmar({
      origenDireccion: origenTexto,
      destinoDireccion: destinoTexto,
      kilometros: resultado.distanciaKm,
      horas: resultado.duracionHoras,
      trazoRuta: JSON.stringify(resultado.coordenadas),
    });
  }

  return (
    <Modal title="Trazar Ruta" subtitle="Geocodificacion y ruteo con OpenStreetMap (gratuito) · direcciones de Mexico" onClose={onClose} wide="xl">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CampoDireccion
            label="Origen"
            valor={origenTexto}
            onCambiar={(texto) => {
              setOrigenTexto(texto);
              setOrigenPunto(null);
              setOrigenAbierto(true);
            }}
            onSeleccionar={seleccionarOrigen}
            sugerencias={origenSug.sugerencias}
            buscando={origenSug.buscando}
            abierto={origenAbierto}
            onAbrir={() => setOrigenAbierto(true)}
            onCerrar={() => setOrigenAbierto(false)}
          />
          <CampoDireccion
            label="Destino"
            valor={destinoTexto}
            onCambiar={(texto) => {
              setDestinoTexto(texto);
              setDestinoPunto(null);
              setDestinoAbierto(true);
            }}
            onSeleccionar={seleccionarDestino}
            sugerencias={destinoSug.sugerencias}
            buscando={destinoSug.buscando}
            abierto={destinoAbierto}
            onAbrir={() => setDestinoAbierto(true)}
            onCerrar={() => setDestinoAbierto(false)}
          />
        </div>

        <div className="flex justify-end">
          <PrimaryButton type="button" onClick={trazar} disabled={cargando}>
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Trazando...
              </>
            ) : (
              'Trazar Ruta'
            )}
          </PrimaryButton>
        </div>

        {error && <p className="text-sm text-breco-500">{error}</p>}

        <div ref={mapaRef} className="h-96 w-full overflow-hidden rounded-xl border border-line-800" />

        {resultado && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:grid-cols-4">
            <Field label="Kilometros">
              <Input readOnly value={resultado.distanciaKm} />
            </Field>
            <Field label="Horas (estimado)">
              <Input readOnly value={resultado.duracionHoras} />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="button" disabled={!resultado} onClick={confirmar}>
            Usar esta ruta
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
