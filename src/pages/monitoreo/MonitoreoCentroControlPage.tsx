import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Truck,
  Navigation,
  WifiOff,
  Clock3,
  Flag,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Printer,
} from 'lucide-react';
import { useData } from '../../lib/DataContext';
import type { Tone } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, TONE_DOT } from '../../components/ui/Badge';
import { FlotaMapa, type MarcadorFlota } from '../../components/monitoreo/FlotaMapa';
import {
  construirFilaMonitoreo,
  viajeActivo,
  viajeEnTransito,
  normalizarEstatus,
} from '../../lib/monitoreoViajes';
import { calcularAlertas } from '../../lib/monitoreoAlertas';

const ICONO_ALERTA = { retraso: Clock3, sin_actualizacion: WifiOff } as const;

export function MonitoreoCentroControlPage() {
  const { viajes, rutas, unidades, operadores, clientes, estatusViajes, viajeUbicaciones, incidenciasViaje, mensajesViaje } = useData();
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const hoy = ahora.toISOString().slice(0, 10);

  const viajesActivos = useMemo(() => viajes.items.filter(viajeActivo), [viajes.items]);
  const viajesEnTransito = useMemo(() => viajesActivos.filter(viajeEnTransito), [viajesActivos]);

  const filasMonitoreo = useMemo(
    () =>
      viajesActivos.map((v) => construirFilaMonitoreo(v, ahora, rutas.items, unidades.items, operadores.items, clientes.items, colorEstatus)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajesActivos, ahora, rutas.items, unidades.items, operadores.items, clientes.items, estatusViajes.items],
  );

  const alertas = useMemo(
    () => calcularAlertas(viajes.items, rutas.items, viajeUbicaciones.items, ahora),
    [viajes.items, rutas.items, viajeUbicaciones.items, ahora],
  );
  const alertasRetraso = alertas.filter((a) => a.tipo === 'retraso');
  const alertasSinActualizar = alertas.filter((a) => a.tipo === 'sin_actualizacion');

  const proximosDestino = filasMonitoreo.filter(
    (f) => f.fraccion !== null && f.fraccion >= 0.85 && f.fraccion <= 1 && f.etiqueta.texto !== 'DEMORADO',
  ).length;

  const finalizadosHoy = viajes.items.filter((v) => normalizarEstatus(v.estatus) === 'entregado' && v.fechaEntrega === hoy).length;
  const incidenciasActivas = incidenciasViaje.items.filter((i) => i.estatus === 'Abierta').length;

  const marcadores: MarcadorFlota[] = filasMonitoreo
    .filter((f) => f.posicion)
    .map((f) => ({
      id: f.viaje.id,
      folio: f.viaje.folio,
      unidad: f.unidadCodigo,
      posicion: f.posicion as [number, number],
      demorado: f.etiqueta.texto === 'DEMORADO',
      trazo: f.trazo ?? undefined,
    }));

  const eventos = useMemo(() => {
    const deUbicacion = viajeUbicaciones.items.map((u) => ({
      id: `ubi:${u.id}`,
      creadoEn: u.creadoEn ?? '',
      texto: `${viajes.items.find((v) => v.id === u.viajeId)?.folio ?? 'N/D'} -- ${u.texto}`,
      tono: 'blue' as Tone,
    }));
    const deIncidencias = incidenciasViaje.items.map((i) => ({
      id: `inc:${i.id}`,
      creadoEn: i.creadoEn ?? '',
      texto: `${viajes.items.find((v) => v.id === i.viajeId)?.folio ?? 'N/D'} -- Incidencia: ${i.tipo}`,
      tono: 'amber' as Tone,
    }));
    const deMensajes = mensajesViaje.items.map((m) => ({
      id: `msg:${m.id}`,
      creadoEn: m.creadoEn ?? '',
      texto: `${viajes.items.find((v) => v.id === m.viajeId)?.folio ?? 'N/D'} -- ${m.autor || 'Mensaje'}: ${m.mensaje}`,
      tono: 'purple' as Tone,
    }));
    return [...deUbicacion, ...deIncidencias, ...deMensajes]
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
      .slice(0, 10);
  }, [viajeUbicaciones.items, incidenciasViaje.items, mensajesViaje.items, viajes.items]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Centro de Control</h1>
          <p className="mt-1 text-sm text-ink-500">Supervisa la operacion de tus viajes y unidades.</p>
        </div>
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <Radio size={12} className="animate-pulse" />
          En vivo
        </span>
      </div>

      <p className="mb-4 text-xs text-ink-600">
        El sistema no tiene hardware de GPS conectado: la posicion en el mapa y las alertas de retraso/sin actualizacion se
        calculan con la hora de salida, las horas autorizadas de la Ruta y la bitacora de ubicacion -- no son una senal en
        vivo de un sensor.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Viajes activos" value={String(viajesActivos.length)} icon={Truck} accent="blue" />
        <StatCard label="En transito" value={String(viajesEnTransito.length)} icon={Navigation} accent="green" />
        <StatCard label="Sin actualizacion" value={String(alertasSinActualizar.length)} icon={WifiOff} accent="amber" />
        <StatCard label="Con retraso" value={String(alertasRetraso.length)} icon={Clock3} accent="red" />
        <StatCard label="Proximos a destino" value={String(proximosDestino)} icon={Flag} accent="blue" />
        <StatCard label="Incidencias activas" value={String(incidenciasActivas)} icon={AlertTriangle} accent="red" />
        <StatCard label="Viajes finalizados hoy" value={String(finalizadosHoy)} icon={CheckCircle2} accent="green" />
        <StatCard label="Alertas totales" value={String(alertas.length)} icon={Radio} accent="amber" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-100">Mapa en Tiempo Real</h2>
            <Link to="/monitoreo/mapa" className="text-xs text-breco-500 hover:underline">
              Ver mapa completo
            </Link>
          </div>
          <FlotaMapa marcadores={marcadores} alturaClase="h-80" />
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-100">Alertas en Tiempo Real</h2>
            <Link to="/monitoreo/alertas" className="text-xs text-breco-500 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {alertas.length === 0 && <p className="text-sm text-ink-600">Sin alertas activas.</p>}
            {alertas.slice(0, 6).map((a) => {
              const Icono = ICONO_ALERTA[a.tipo];
              return (
                <div key={a.id} className="flex items-start gap-2 rounded-lg border border-line-800 bg-bg-900 p-2.5">
                  <span className={`mt-0.5 rounded-md p-1.5 ${a.severidad === 'alta' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    <Icono size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-100">{a.mensaje}</p>
                    <p className="text-xs text-ink-600">{a.detalle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-100">Viajes en Monitoreo</h2>
            <Link to="/monitoreo/viajes" className="text-xs text-breco-500 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2.5">Viaje</th>
                  <th className="px-3 py-2.5">Unidad</th>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">Destino</th>
                  <th className="px-3 py-2.5">Estatus</th>
                  <th className="px-3 py-2.5">ETA</th>
                  <th className="px-3 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filasMonitoreo.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-ink-600">
                      Sin viajes activos.
                    </td>
                  </tr>
                )}
                {filasMonitoreo.slice(0, 8).map((f) => (
                  <tr key={f.viaje.id} className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40">
                    <td className="px-3 py-2.5 font-semibold text-ink-100">{f.viaje.folio}</td>
                    <td className="px-3 py-2.5 text-ink-300">{f.unidadCodigo}</td>
                    <td className="px-3 py-2.5 text-ink-300">{f.clienteNombre}</td>
                    <td className="px-3 py-2.5 uppercase text-ink-300">{f.viaje.destino || 'N/D'}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={f.etiqueta.texto} tone={f.etiqueta.tono} />
                    </td>
                    <td className="px-3 py-2.5 text-ink-400">{f.eta}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Link to="/monitoreo/mapa" title="Ver en mapa" className="rounded p-1.5 text-ink-500 hover:bg-bg-700 hover:text-ink-100">
                          <MapPin size={14} />
                        </Link>
                        <Link to="/monitoreo/comunicacion" title="Comunicacion" className="rounded p-1.5 text-ink-500 hover:bg-bg-700 hover:text-ink-100">
                          <MessageSquare size={14} />
                        </Link>
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

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Ultimos Eventos</h2>
          <div className="space-y-3">
            {eventos.length === 0 && <p className="text-sm text-ink-600">Sin eventos registrados.</p>}
            {eventos.map((e) => (
              <div key={e.id} className="flex items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${TONE_DOT[e.tono]}`} />
                <div className="min-w-0">
                  <p className="text-xs text-ink-200">{e.texto}</p>
                  {e.creadoEn && <p className="text-[10px] text-ink-600">{new Date(e.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
