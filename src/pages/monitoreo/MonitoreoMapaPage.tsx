import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import type { Tone } from '../../components/ui/Badge';
import { FlotaMapa, type FlotaMapaHandle, type MarcadorFlota } from '../../components/monitoreo/FlotaMapa';
import { UnidadMapaCard, type UnidadMapaCardInfo } from '../../components/monitoreo/UnidadMapaCard';
import { construirFilaMonitoreo, destinoViaje, origenViaje, viajeActivo } from '../../lib/monitoreoViajes';

export function MonitoreoMapaPage() {
  const { viajes, rutas, unidades, operadores, clientes, estatusViajes, posicionesGps } = useData();
  const navigate = useNavigate();
  const mapaHandleRef = useRef<FlotaMapaHandle>(null);
  const [ahora, setAhora] = useState(new Date());
  const [mostrarTrazos, setMostrarTrazos] = useState(true);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [mostrarRecorrido, setMostrarRecorrido] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const filasMonitoreo = useMemo(
    () =>
      viajes.items
        .filter(viajeActivo)
        .map((v) =>
          construirFilaMonitoreo(v, ahora, rutas.items, unidades.items, operadores.items, clientes.items, colorEstatus, posicionesGps.items),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, ahora, rutas.items, unidades.items, operadores.items, clientes.items, estatusViajes.items, posicionesGps.items],
  );

  const marcadores: MarcadorFlota[] = filasMonitoreo
    .filter((f) => f.posicion)
    .map((f) => ({
      id: f.viaje.id,
      folio: f.viaje.folio,
      unidad: f.unidadCodigo,
      posicion: f.posicion as [number, number],
      demorado: f.etiqueta.texto === 'DEMORADO',
      trazo: f.trazo ?? undefined,
      enVivo: f.posicionEnVivo,
      rumbo: f.rumbo,
    }));

  // Ya salio a ruta (fraccion no nulo) pero su Ruta no tiene trazo guardado --
  // distinto de un viaje que simplemente todavia no sale (ese no cuenta como
  // "falta el trazo", solo no ha empezado su recorrido.
  const sinTrazo = filasMonitoreo.filter((f) => f.fraccion !== null && !f.posicion).length;

  const filaSeleccionada = seleccionId ? filasMonitoreo.find((f) => f.viaje.id === seleccionId) : undefined;
  const infoTarjeta: UnidadMapaCardInfo | null = filaSeleccionada
    ? (() => {
        const unidad = unidades.items.find((u) => u.id === filaSeleccionada.viaje.unidadId);
        const posicionGps = posicionesGps.items.find((p) => p.id === filaSeleccionada.viaje.unidadId);
        return {
          folio: filaSeleccionada.viaje.folio,
          economico: filaSeleccionada.unidadCodigo,
          placas: unidad?.placas ?? '',
          operador: filaSeleccionada.operadorNombre,
          cliente: filaSeleccionada.clienteNombre,
          origen: origenViaje(filaSeleccionada.viaje, rutas.items),
          destino: destinoViaje(filaSeleccionada.viaje, rutas.items),
          eta: filaSeleccionada.eta,
          estatusTexto: filaSeleccionada.etiqueta.texto,
          estatusTono: filaSeleccionada.etiqueta.tono,
          enVivo: filaSeleccionada.posicionEnVivo,
          velocidadTexto:
            filaSeleccionada.posicionEnVivo && posicionGps?.velocidadKmh != null ? `${Math.round(posicionGps.velocidadKmh)} km/h` : 'N/D',
          ultimaActualizacion:
            filaSeleccionada.posicionEnVivo && posicionGps
              ? new Date(posicionGps.fechaHoraGps).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              : 'N/D',
        };
      })()
    : null;

  function cerrarTarjeta() {
    setSeleccionId(null);
    setMostrarRecorrido(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Mapa GPS</h1>
          <p className="mt-1 text-sm text-ink-500">Posicion calculada de cada unidad en transito sobre el trazo real de su Ruta.</p>
        </div>
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <Radio size={12} className="animate-pulse" />
          En vivo
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-line-800 bg-bg-900 p-3 text-sm">
        <label className="flex items-center gap-2 text-ink-300">
          <input
            type="checkbox"
            checked={mostrarTrazos}
            onChange={(e) => setMostrarTrazos(e.target.checked)}
            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
          />
          Rutas trazadas
        </label>
        <span className="flex items-center gap-1.5 text-ink-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#9ca3af]" /> Posicion estimada
        </span>
        <span className="flex items-center gap-1.5 text-ink-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_#22c55e]" /> GPS en vivo
        </span>
        <span className="flex items-center gap-1.5 text-ink-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Demorado
        </span>
        {sinTrazo > 0 && (
          <span className="text-ink-600">
            {sinTrazo} viaje(s) en transito sin trazo de ruta guardado -- no se pueden ubicar en el mapa.
          </span>
        )}
      </div>

      <div className="relative">
        <FlotaMapa
          ref={mapaHandleRef}
          marcadores={marcadores}
          mostrarTrazos={mostrarTrazos}
          alturaClase="h-[600px]"
          rutaResaltadaId={mostrarRecorrido ? seleccionId : null}
          onSeleccionar={(id) => {
            setSeleccionId(id);
            setMostrarRecorrido(false);
          }}
        />
        {infoTarjeta && (
          <UnidadMapaCard
            info={infoTarjeta}
            rutaResaltada={mostrarRecorrido}
            onClose={cerrarTarjeta}
            onCentrar={() => seleccionId && mapaHandleRef.current?.centrarEn(seleccionId)}
            onVerRecorrido={() => setMostrarRecorrido((v) => !v)}
            onVerDetalle={() => navigate('/viajes')}
          />
        )}
      </div>

      <p className="mt-3 text-xs text-ink-600">
        Las unidades con una plataforma de rastreo GPS conectada (ver "Identificador GPS" en el catalogo de Unidades)
        muestran su posicion real (marcador con borde verde). El resto muestra una posicion CALCULADA con el tiempo
        transcurrido desde la hora de salida sobre las horas autorizadas de la Ruta, proyectado sobre las coordenadas
        reales de su trazo -- no una señal real. Haz clic sobre un camion para ver su informacion.
      </p>
    </div>
  );
}
