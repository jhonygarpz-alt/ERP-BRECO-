import { useEffect, useMemo, useState } from 'react';
import { MapPin, MessageSquare, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import type { Tone } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/Badge';
import { Select, inputClass } from '../../components/ui/form';
import { construirFilaMonitoreo, viajeActivo } from '../../lib/monitoreoViajes';

export function MonitoreoViajesPage() {
  const { viajes, rutas, unidades, operadores, clientes, estatusViajes } = useData();
  const [ahora, setAhora] = useState(new Date());
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const filas = useMemo(
    () =>
      viajes.items
        .filter(viajeActivo)
        .map((v) => construirFilaMonitoreo(v, ahora, rutas.items, unidades.items, operadores.items, clientes.items, colorEstatus)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, ahora, rutas.items, unidades.items, operadores.items, clientes.items, estatusViajes.items],
  );

  const etiquetasDisponibles = useMemo(() => Array.from(new Set(filas.map((f) => f.etiqueta.texto))), [filas]);

  const filtradas = filas.filter((f) => {
    if (filtroEstatus !== 'todos' && f.etiqueta.texto !== filtroEstatus) return false;
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      f.viaje.folio.toLowerCase().includes(termino) ||
      f.unidadCodigo.toLowerCase().includes(termino) ||
      f.operadorNombre.toLowerCase().includes(termino) ||
      f.clienteNombre.toLowerCase().includes(termino)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Monitoreo de Viajes</h1>
        <p className="mt-1 text-sm text-ink-500">Todos los viajes activos con su estatus, ETA y avance calculado.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por viaje, unidad, operador o cliente..."
            className={`${inputClass} w-72 pl-9`}
          />
        </div>
        <Select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="w-56">
          <option value="todos">Todos los estatus</option>
          {etiquetasDisponibles.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Viaje</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-ink-600">
                    Sin viajes que coincidan.
                  </td>
                </tr>
              )}
              {filtradas.map((f) => (
                <tr key={f.viaje.id} className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40">
                  <td className="px-4 py-3 font-semibold text-ink-100">{f.viaje.folio}</td>
                  <td className="px-4 py-3 text-ink-300">{f.unidadCodigo}</td>
                  <td className="px-4 py-3 text-ink-300">{f.operadorNombre}</td>
                  <td className="px-4 py-3 text-ink-300">{f.clienteNombre}</td>
                  <td className="px-4 py-3 uppercase text-ink-300">{f.viaje.origen || 'N/D'}</td>
                  <td className="px-4 py-3 uppercase text-ink-300">{f.viaje.destino || 'N/D'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.etiqueta.texto} tone={f.etiqueta.tono} />
                    {f.etiqueta.detalle && <div className="mt-0.5 text-[10px] text-ink-600">{f.etiqueta.detalle}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-400">{f.eta}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Ver en mapa"
                        onClick={() => (window.location.hash = '#/monitoreo/mapa')}
                        className="rounded p-1.5 text-ink-500 hover:bg-bg-700 hover:text-ink-100"
                      >
                        <MapPin size={14} />
                      </button>
                      <button
                        type="button"
                        title="Comunicacion"
                        onClick={() => (window.location.hash = '#/monitoreo/comunicacion')}
                        className="rounded p-1.5 text-ink-500 hover:bg-bg-700 hover:text-ink-100"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button
                        type="button"
                        title="Imprimir viaje"
                        onClick={() => window.open(`#/viajes/imprimir/${f.viaje.id}`, '_blank')}
                        className="rounded p-1.5 text-ink-500 hover:bg-bg-700 hover:text-ink-100"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
