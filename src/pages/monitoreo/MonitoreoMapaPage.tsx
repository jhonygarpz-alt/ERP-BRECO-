import { useEffect, useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import type { Tone } from '../../components/ui/Badge';
import { FlotaMapa, type MarcadorFlota } from '../../components/monitoreo/FlotaMapa';
import { construirFilaMonitoreo, viajeEnTransito } from '../../lib/monitoreoViajes';

export function MonitoreoMapaPage() {
  const { viajes, rutas, unidades, operadores, clientes, estatusViajes } = useData();
  const [ahora, setAhora] = useState(new Date());
  const [mostrarTrazos, setMostrarTrazos] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const marcadores: MarcadorFlota[] = useMemo(() => {
    return viajes.items
      .filter(viajeEnTransito)
      .map((v) => construirFilaMonitoreo(v, ahora, rutas.items, unidades.items, operadores.items, clientes.items, colorEstatus))
      .filter((f) => f.posicion)
      .map((f) => ({
        id: f.viaje.id,
        folio: f.viaje.folio,
        unidad: f.unidadCodigo,
        posicion: f.posicion as [number, number],
        demorado: f.etiqueta.texto === 'DEMORADO',
        trazo: f.trazo ?? undefined,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajes.items, ahora, rutas.items, unidades.items, operadores.items, clientes.items, estatusViajes.items]);

  const sinTrazo = viajes.items.filter(viajeEnTransito).length - marcadores.length;

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
          <span className="h-2.5 w-2.5 rounded-full bg-[#0071e3]" /> En tiempo
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

      <FlotaMapa marcadores={marcadores} mostrarTrazos={mostrarTrazos} alturaClase="h-[600px]" />

      <p className="mt-3 text-xs text-ink-600">
        No hay hardware de GPS conectado al sistema. La posicion se calcula con el tiempo transcurrido desde la hora de
        salida sobre las horas autorizadas de la Ruta, proyectado sobre las coordenadas reales de su trazo.
      </p>
    </div>
  );
}
