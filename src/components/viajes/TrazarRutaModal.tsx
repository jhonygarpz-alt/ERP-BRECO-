import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { calcularRuta, geocodificarDireccion, type RutaCalculada } from '../../lib/rutaMapa';
import { mensajeDeError } from '../../lib/errors';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../ui/form';

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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<RutaCalculada | null>(null);

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

  async function trazar() {
    if (!origenTexto.trim() || !destinoTexto.trim()) {
      setError('Escribe el origen y el destino.');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const [origen, destino] = await Promise.all([geocodificarDireccion(origenTexto), geocodificarDireccion(destinoTexto)]);
      const ruta = await calcularRuta(origen, destino);
      setResultado(ruta);

      const mapa = mapaInstancia.current;
      const capa = capaRuta.current;
      if (mapa && capa) {
        capa.clearLayers();
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
    <Modal title="Trazar Ruta" subtitle="Geocodificacion y ruteo con OpenStreetMap (gratuito)" onClose={onClose} wide="xl">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Origen">
            <Input value={origenTexto} onChange={(e) => setOrigenTexto(e.target.value)} placeholder="Direccion, ciudad, planta..." />
          </Field>
          <Field label="Destino">
            <Input value={destinoTexto} onChange={(e) => setDestinoTexto(e.target.value)} placeholder="Direccion, ciudad, planta..." />
          </Field>
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
