import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';
import {
  buscarSugerenciasDireccion,
  calcularRuta,
  geocodificarDireccion,
  indiceInsercionManual,
  muestrearPuntos,
  rutaDesdePuntosManuales,
  type PuntoGeocodificado,
  type RutaCalculada,
  type SugerenciaDireccion,
} from '../../lib/rutaMapa';
import { mensajeDeError } from '../../lib/errors';
import { googleMapsDisponible } from '../../lib/googlePlaces';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, inputClass } from '../ui/form';

// Pin tipo "gota" dibujado con HTML/CSS (sin imagenes externas, para no
// depender de los assets de icono por defecto de Leaflet, que no cargan bien
// con Vite). Verde con "A" para Origen, rojo con "B" para Destino.
function pinIcon(color: string, letra: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html:
      `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};` +
      'transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;' +
      'border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.45);">' +
      `<span style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px;line-height:1;">${letra}</span>` +
      '</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

function puntoIconManual(): L.DivIcon {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;' +
      'border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.45);cursor:grab;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Tope duro de puntos en el trazado libre (para que no se vuelva lento con
// cientos de manijas arrastrables). El trazo inicial al entrar en modo
// manual parte de una muestra mas chica (PUNTOS_INICIALES_AUTO) para no
// saturar el mapa de entrada; el usuario puede seguir agregando puntos con
// clic hasta llegar al tope.
const MAX_PUNTOS_MANUALES = 60;
const PUNTOS_INICIALES_AUTO = 18;

// Autocompletado tipo "Google Maps": mientras el usuario escribe se buscan
// sugerencias con debounce (nunca en cada tecla) para respetar el limite de
// uso razonable de Nominatim. `saltarRef` evita relanzar la busqueda cuando
// el texto cambia porque el propio usuario eligio una sugerencia (ya no hace
// falta volver a buscar esa misma direccion).
function useSugerenciasDireccion(texto: string) {
  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([]);
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
  onSeleccionar: (sugerencia: SugerenciaDireccion) => void;
  sugerencias: SugerenciaDireccion[];
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
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSeleccionar(s)}
              className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-bg-700"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-breco-500" />
              <span>{s.texto}</span>
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
  // Opciones de ruta devueltas por OSRM (como el panel de "varias opciones"
  // de Google Maps). `resultado` siempre es la opcion actualmente elegida
  // (rutasAlternativas[indiceRuta]); fuera del modo auto (manual, o solo 1
  // opcion encontrada) la lista queda vacia y no se muestra el panel.
  const [rutasAlternativas, setRutasAlternativas] = useState<RutaCalculada[]>([]);
  const [indiceRuta, setIndiceRuta] = useState(0);
  // Puntos realmente ubicados en el mapa (pueden moverse arrastrando el pin,
  // independiente del texto de los campos de arriba).
  const [origenActual, setOrigenActual] = useState<PuntoGeocodificado | null>(null);
  const [destinoActual, setDestinoActual] = useState<PuntoGeocodificado | null>(null);
  // Modo "trazado libre": en vez de seguir las calles via OSRM, el usuario
  // arrastra/agrega puntos y la linea se dibuja recta entre ellos.
  const [modoManual, setModoManual] = useState(false);
  const [puntosManuales, setPuntosManuales] = useState<[number, number][]>([]);
  const puntosManualesRef = useRef<[number, number][]>([]);
  const lineaManualRef = useRef<L.Polyline | null>(null);
  const modoManualAnteriorRef = useRef(false);

  const origenSug = useSugerenciasDireccion(origenTexto);
  const destinoSug = useSugerenciasDireccion(destinoTexto);

  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaInstancia = useRef<L.Map | null>(null);
  const capaRuta = useRef<L.LayerGroup | null>(null);
  const capaCalles = useRef<L.TileLayer | null>(null);
  const capaSatelital = useRef<L.TileLayer | null>(null);
  const [vistaSatelital, setVistaSatelital] = useState(false);

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
    if (!mapaRef.current || mapaInstancia.current) return;
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
    capaRuta.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 150);

    return () => {
      mapa.remove();
      mapaInstancia.current = null;
    };
  }, []);

  // Dibuja pines + linea cada vez que cambia el origen/destino, el resultado
  // (auto u OSRM) o la lista de puntos manuales. Los arrastres continuos
  // (evento "drag") NO pasan por aqui -- actualizan el mapa directamente para
  // no recrear el marcador que se esta arrastrando a medio gesto; solo al
  // soltar ("dragend") se guarda en el estado de React, que es lo que dispara
  // este efecto para dejar todo consistente.
  useEffect(() => {
    const mapa = mapaInstancia.current;
    const capa = capaRuta.current;
    if (!mapa || !capa) return;
    capa.clearLayers();
    lineaManualRef.current = null;
    if (!origenActual || !destinoActual) return;

    const coordenadas = modoManual ? puntosManuales : (resultado?.coordenadas ?? []);
    puntosManualesRef.current = modoManual ? [...puntosManuales] : [];

    // Al editar a mano, NO se reencuadra el mapa en cada punto que se mueve:
    // el usuario normalmente ya hizo zoom a la zona exacta que quiere
    // corregir, y perder ese zoom en cada ajuste entorpece el trazado. Solo
    // se reencuadra la primera vez que se entra al modo manual (transicion
    // false->true) o siempre que no se este editando a mano.
    const entrandoAModoManual = modoManual && !modoManualAnteriorRef.current;
    modoManualAnteriorRef.current = modoManual;
    if (coordenadas.length >= 2) {
      const linea = L.polyline(coordenadas, {
        color: '#3b82f6',
        weight: 4,
        dashArray: modoManual ? '6 6' : undefined,
      }).addTo(capa);
      if (modoManual) lineaManualRef.current = linea;
      if (!modoManual || entrandoAModoManual) mapa.fitBounds(linea.getBounds(), { padding: [30, 30] });
    }

    if (modoManual && puntosManuales.length > 2) {
      puntosManuales.slice(1, -1).forEach((punto, i) => {
        const indice = i + 1;
        const marcador = L.marker(punto, { icon: puntoIconManual(), draggable: true }).addTo(capa);
        marcador.on('drag', (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          puntosManualesRef.current[indice] = [ll.lat, ll.lng];
          lineaManualRef.current?.setLatLngs(puntosManualesRef.current);
        });
        marcador.on('dragend', (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          setPuntosManuales((prev) => {
            const copia = [...prev];
            copia[indice] = [ll.lat, ll.lng];
            return copia;
          });
        });
      });
    }

    const origenMarcador = L.marker([origenActual.lat, origenActual.lon], { icon: pinIcon('#22c55e', 'A'), draggable: true })
      .bindTooltip('Origen', { permanent: true, direction: 'top', offset: [0, -24] })
      .addTo(capa);
    const destinoMarcador = L.marker([destinoActual.lat, destinoActual.lon], { icon: pinIcon('#ef4444', 'B'), draggable: true })
      .bindTooltip('Destino', { permanent: true, direction: 'top', offset: [0, -24] })
      .addTo(capa);

    if (modoManual) {
      origenMarcador.on('drag', (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        puntosManualesRef.current[0] = [ll.lat, ll.lng];
        lineaManualRef.current?.setLatLngs(puntosManualesRef.current);
      });
      origenMarcador.on('dragend', (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        setOrigenActual((o) => (o ? { ...o, lat: ll.lat, lon: ll.lng } : o));
        setPuntosManuales((prev) => (prev.length > 0 ? [[ll.lat, ll.lng], ...prev.slice(1)] : prev));
      });
      destinoMarcador.on('drag', (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        const ultimo = puntosManualesRef.current.length - 1;
        puntosManualesRef.current[ultimo] = [ll.lat, ll.lng];
        lineaManualRef.current?.setLatLngs(puntosManualesRef.current);
      });
      destinoMarcador.on('dragend', (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        setDestinoActual((d) => (d ? { ...d, lat: ll.lat, lon: ll.lng } : d));
        setPuntosManuales((prev) => (prev.length > 0 ? [...prev.slice(0, -1), [ll.lat, ll.lng]] : prev));
      });
    } else {
      origenMarcador.on('dragend', async (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        const nuevoOrigen: PuntoGeocodificado = { ...origenActual, lat: ll.lat, lon: ll.lng };
        setOrigenActual(nuevoOrigen);
        setCargando(true);
        setError('');
        try {
          elegirRutas(await calcularRuta(nuevoOrigen, destinoActual, { alternativas: true }));
        } catch (err) {
          setError(mensajeDeError(err));
        } finally {
          setCargando(false);
        }
      });
      destinoMarcador.on('dragend', async (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        const nuevoDestino: PuntoGeocodificado = { ...destinoActual, lat: ll.lat, lon: ll.lng };
        setDestinoActual(nuevoDestino);
        setCargando(true);
        setError('');
        try {
          elegirRutas(await calcularRuta(origenActual, nuevoDestino, { alternativas: true }));
        } catch (err) {
          setError(mensajeDeError(err));
        } finally {
          setCargando(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origenActual, destinoActual, resultado, modoManual, puntosManuales]);

  // En modo manual, agregar un punto nuevo con clic en el mapa: se inserta
  // en el segmento de la ruta mas cercano al clic (no siempre al final),
  // para que aparezca donde se señalo sobre el trazo sin reordenar el resto.
  useEffect(() => {
    const mapa = mapaInstancia.current;
    if (!mapa || !modoManual) return;
    function alHacerClic(e: L.LeafletMouseEvent) {
      setPuntosManuales((prev) => {
        if (prev.length < 2 || prev.length >= MAX_PUNTOS_MANUALES) return prev;
        const clic: [number, number] = [e.latlng.lat, e.latlng.lng];
        const indice = indiceInsercionManual(prev, clic);
        const nuevo = [...prev];
        nuevo.splice(indice, 0, clic);
        return nuevo;
      });
    }
    mapa.on('click', alHacerClic);
    return () => {
      mapa.off('click', alHacerClic);
    };
  }, [modoManual]);

  // Mientras se edita a mano, la distancia/duracion se recalculan en linea
  // recta entre los puntos (no hay forma de medir por calles sin OSRM).
  useEffect(() => {
    if (!modoManual || puntosManuales.length < 2) return;
    setResultado(rutaDesdePuntosManuales(puntosManuales));
  }, [modoManual, puntosManuales]);

  function elegirRutas(rutas: RutaCalculada[]) {
    setRutasAlternativas(rutas);
    setIndiceRuta(0);
    setResultado(rutas[0]);
  }

  function elegirIndiceRuta(indice: number) {
    setIndiceRuta(indice);
    setResultado(rutasAlternativas[indice]);
  }

  function activarModoManual() {
    if (!origenActual || !destinoActual) return;
    const base =
      resultado && resultado.coordenadas.length >= 2
        ? muestrearPuntos(resultado.coordenadas, PUNTOS_INICIALES_AUTO)
        : [
            [origenActual.lat, origenActual.lon] as [number, number],
            [destinoActual.lat, destinoActual.lon] as [number, number],
          ];
    const puntos = [...base];
    puntos[0] = [origenActual.lat, origenActual.lon];
    puntos[puntos.length - 1] = [destinoActual.lat, destinoActual.lon];
    setPuntosManuales(puntos);
    setRutasAlternativas([]);
    setModoManual(true);
  }

  // Se recalcula con OSRM en vez de restaurar un resultado guardado: si el
  // usuario arrastro el pin de Origen/Destino mientras editaba a mano, la
  // ruta automatica debe seguir las calles desde esa posicion nueva, no
  // desde donde estaba antes de entrar al modo manual.
  async function salirModoManual() {
    if (!origenActual || !destinoActual) return;
    setModoManual(false);
    setPuntosManuales([]);
    setCargando(true);
    setError('');
    try {
      elegirRutas(await calcularRuta(origenActual, destinoActual, { alternativas: true }));
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }

  function deshacerPuntoManual() {
    setPuntosManuales((prev) => (prev.length > 2 ? [...prev.slice(0, -2), prev[prev.length - 1]] : prev));
  }

  // Con Nominatim las coordenadas ya vienen en la sugerencia; con Google
  // Places hace falta una segunda consulta ("Place Details") para obtenerlas,
  // asi que resolver() es async en ambos casos. Si esa consulta llega a
  // fallar, origenPunto/destinoPunto quedan en null y "Trazar Ruta" vuelve a
  // geocodificar el texto como respaldo.
  async function seleccionarOrigen(sugerencia: SugerenciaDireccion) {
    origenSug.saltarSiguienteBusqueda();
    setOrigenTexto(sugerencia.texto);
    setOrigenAbierto(false);
    origenSug.limpiar();
    try {
      setOrigenPunto(await sugerencia.resolver());
    } catch {
      setOrigenPunto(null);
    }
  }

  async function seleccionarDestino(sugerencia: SugerenciaDireccion) {
    destinoSug.saltarSiguienteBusqueda();
    setDestinoTexto(sugerencia.texto);
    setDestinoAbierto(false);
    destinoSug.limpiar();
    try {
      setDestinoPunto(await sugerencia.resolver());
    } catch {
      setDestinoPunto(null);
    }
  }

  async function trazar() {
    if (!origenTexto.trim() || !destinoTexto.trim()) {
      setError('Escribe el origen y el destino.');
      return;
    }
    setCargando(true);
    setError('');
    setResultado(null);
    setRutasAlternativas([]);
    setOrigenActual(null);
    setDestinoActual(null);
    setModoManual(false);
    setPuntosManuales([]);
    try {
      const [origen, destino] = await Promise.all([
        origenPunto ?? geocodificarDireccion(origenTexto),
        destinoPunto ?? geocodificarDireccion(destinoTexto),
      ]);
      const rutas = await calcularRuta(origen, destino, { alternativas: true });
      setOrigenActual(origen);
      setDestinoActual(destino);
      elegirRutas(rutas);
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
    <Modal
      title="Trazar Ruta"
      subtitle={
        googleMapsDisponible()
          ? 'Busqueda con Google Places (reconoce nombres de negocios) · ruteo con OpenStreetMap'
          : 'Geocodificacion y ruteo con OpenStreetMap (gratuito) · direcciones de Mexico'
      }
      onClose={onClose}
      wide="xl"
    >
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          {origenActual && destinoActual && (
            <GhostButton type="button" onClick={modoManual ? salirModoManual : activarModoManual}>
              {modoManual ? 'Volver a ruta automatica' : 'Editar trazado manualmente'}
            </GhostButton>
          )}
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

        {!modoManual && rutasAlternativas.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {rutasAlternativas.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => elegirIndiceRuta(i)}
                className={`rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                  i === indiceRuta
                    ? 'border-breco-500 bg-breco-500/10 text-ink-100'
                    : 'border-line-700 bg-bg-900 text-ink-300 hover:bg-bg-800'
                }`}
              >
                <span className="block font-semibold">Opcion {i + 1}: {Math.round(r.duracionHoras * 60)} min</span>
                <span className="block text-ink-500">{r.distanciaKm} km</span>
              </button>
            ))}
          </div>
        )}

        {modoManual && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-breco-500/30 bg-breco-500/5 px-3 py-2 text-xs text-ink-300">
            <span>
              Trazado libre: arrastra los puntos azules o los pines para ajustar la ruta. Haz clic en el mapa para
              agregar un punto nuevo.
            </span>
            <GhostButton type="button" onClick={deshacerPuntoManual} disabled={puntosManuales.length <= 2}>
              Deshacer ultimo punto
            </GhostButton>
          </div>
        )}

        <div className="relative">
          <div ref={mapaRef} className="h-96 w-full overflow-hidden rounded-xl border border-line-800" />
          <button
            type="button"
            onClick={alternarVistaSatelital}
            className="absolute right-2 top-2 z-[1000] rounded-lg border border-line-700 bg-bg-800/90 px-3 py-1.5 text-xs font-medium text-ink-200 shadow-lg hover:bg-bg-700"
          >
            {vistaSatelital ? 'Vista calles' : 'Vista satelital'}
          </button>
          {origenActual && destinoActual && (
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

        {resultado && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:grid-cols-4">
            <Field label="Kilometros">
              <Input readOnly value={resultado.distanciaKm} />
            </Field>
            <Field label={modoManual ? 'Horas (estimado, trazado libre)' : 'Horas (estimado)'}>
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
