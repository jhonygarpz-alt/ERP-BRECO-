import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Radio,
  CheckCircle2,
  Clock3,
  CalendarClock,
  MapPin,
  X,
  Trash2,
  Plus,
  LogOut,
  Flag,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { Tone } from '../components/ui/Badge';
import type { EstatusViajeCustom, Ruta, Viaje } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { GhostButton, Input, ToolbarButton, inputClass } from '../components/ui/form';

// Solo se usa como respaldo cuando el viaje no tiene una Ruta capturada (o
// esa Ruta no trae sus horas estimadas) -- siempre que se pueda, el limite
// se calcula con las horas reales de esa Ruta, no con un numero fijo.
const HORAS_MAX_TRANSITO_RESPALDO = 24;

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

// El catalogo de Estatus de Viaje es texto libre (EstatusViaje = string), asi
// que dos capturas del mismo estatus pueden diferir en mayusculas/minusculas
// ("En transito" vs "en transito"). Todas las comparaciones de esta pantalla
// normalizan antes de comparar para no depender de que coincida el case
// exacto.
function normalizarEstatus(estatus: string): string {
  return estatus.trim().toLowerCase();
}

function formatearDuracion(ms: number): string {
  const totalMin = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Horas autorizadas de transito para este viaje: las de su Ruta (si tiene
 * una capturada con horas > 0) o, si no, el respaldo fijo. */
function horasAutorizadas(v: Viaje, rutas: Ruta[]): number {
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  return ruta && ruta.horas > 0 ? ruta.horas : HORAS_MAX_TRANSITO_RESPALDO;
}

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-emerald-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  gray: 'text-ink-400',
  purple: 'text-violet-400',
};

interface EtiquetaEstatus {
  texto: string;
  tono: Tone;
  detalle?: string;
}

/** Inicio real del transito: fecha + hora de salida a ruta. null si aun no se ha registrado. */
function inicioTransito(v: Viaje): Date | null {
  if (!v.horaSalida) return null;
  const d = new Date(`${v.fecha}T${v.horaSalida}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Limite autorizado: hora de salida + las horas autorizadas para esta Ruta. */
function limiteTransito(v: Viaje, horasAutorizadasViaje: number): Date | null {
  const inicio = inicioTransito(v);
  return inicio ? new Date(inicio.getTime() + horasAutorizadasViaje * 60 * 60 * 1000) : null;
}

/**
 * Traduce el estatus real del viaje al lenguaje de un tablero de operacion.
 * En cuanto hay hora de salida registrada, "EN TIEMPO"/"DEMORADO" se
 * calculan contra el limite real (salida + horas de ETA de la Ruta) y
 * muestran cuanto falta o cuanto de retraso lleva.
 */
function etiquetaTablero(v: Viaje, ahora: Date, colorPersonalizado: Tone | null, horasAutorizadasViaje: number): EtiquetaEstatus {
  const est = normalizarEstatus(v.estatus);
  if (est === 'cancelado') return { texto: 'CANCELADO', tono: 'red' };
  if (est === 'entregado') return { texto: 'ENTREGADO', tono: 'green' };

  const limite = limiteTransito(v, horasAutorizadasViaje);
  if (limite) {
    const diff = ahora.getTime() - limite.getTime();
    if (diff > 0) return { texto: 'DEMORADO', tono: 'red', detalle: `${formatearDuracion(diff)} de retraso` };
    return { texto: 'EN TIEMPO', tono: 'green', detalle: `ETA en ${formatearDuracion(diff)}` };
  }

  if (est === 'en transito') return { texto: 'EN TRANSITO', tono: 'blue' };
  if (est === 'programado') return { texto: 'PROGRAMADO', tono: 'gray' };
  return { texto: v.estatus.toUpperCase(), tono: colorPersonalizado ?? 'gray' };
}

/**
 * Fraccion 0-1 del avance del viaje. Si ya se entrego, el camion se va
 * directo al 100% (destino) sin importar cuanto tiempo real haya pasado --
 * antes se calculaba solo contra un numero fijo de horas, asi que un viaje
 * corto ya entregado se veia "atorado" cerca del origen porque apenas
 * habia transcurrido una fraccion chica de esas horas.
 */
function avanceTransito(v: Viaje, ahora: Date, horasAutorizadasViaje: number): number | null {
  const est = normalizarEstatus(v.estatus);
  if (est === 'entregado') return 1;
  if (est === 'cancelado') return null;
  const inicio = inicioTransito(v);
  if (!inicio) return null;
  const transcurrido = ahora.getTime() - inicio.getTime();
  return transcurrido / (horasAutorizadasViaje * 60 * 60 * 1000);
}

function BarraAvance({ fraccion }: { fraccion: number }) {
  const pct = Math.min(Math.max(fraccion, 0), 1) * 100;
  const color = fraccion > 1 ? 'bg-red-500' : fraccion > 0.75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-700">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Reloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const fecha = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="text-right">
      <div className="font-mono text-2xl font-bold text-ink-100">{hora}</div>
      <div className="text-xs uppercase tracking-wide text-ink-500">{fecha}</div>
    </div>
  );
}

/** Linea de tiempo horizontal Origen -> Destino con un camion animado que
 * marca el avance real (mismo porcentaje que BarraAvance/avanceTransito). */
function LineaTiempoRuta({ origen, destino, fraccion }: { origen: string; destino: string; fraccion: number | null }) {
  const pct = fraccion === null ? 0 : Math.min(Math.max(fraccion, 0), 1) * 100;
  const demorado = fraccion !== null && fraccion > 1;
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between text-xs text-ink-500">
        <span>
          Origen: <span className="font-medium text-ink-200">{origen || 'N/D'}</span>
        </span>
        <span>
          Destino: <span className="font-medium text-ink-200">{destino || 'N/D'}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 py-3">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
        <div className="relative h-1 flex-1">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-line-700" />
          <div
            className={`absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full ${demorado ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 z-10 transition-[left] duration-1000 ease-linear"
            style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-lg ${demorado ? 'bg-red-500 shadow-red-500/40' : 'bg-emerald-500 shadow-emerald-500/40'}`}>
              <Truck size={17} className="text-bg-950 [animation:camion-manejando_0.6s_ease-in-out_infinite]" strokeWidth={2.25} />
            </div>
          </div>
        </div>
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-line-600 bg-bg-800" />
      </div>
      {fraccion === null && <p className="mt-3 text-center text-xs text-ink-600">Aun no se registra la salida a ruta.</p>}
      {demorado && <p className="mt-3 text-center text-xs text-red-400">Excedio el tiempo de transito autorizado.</p>}
    </div>
  );
}

function AvanceModal({
  viaje,
  ahora,
  rutas,
  onClose,
}: {
  viaje: Viaje;
  ahora: Date;
  rutas: Ruta[];
  onClose: () => void;
}) {
  const { viajeUbicaciones, viajes } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Viajes', 'editar');
  const [texto, setTexto] = useState('');

  const checkpoints = useMemo(
    () =>
      viajeUbicaciones.items
        .filter((u) => u.viajeId === viaje.id)
        .sort((a, b) => (a.creadoEn ?? '').localeCompare(b.creadoEn ?? '')),
    [viajeUbicaciones.items, viaje.id],
  );

  const horasViaje = horasAutorizadas(viaje, rutas);
  const inicio = inicioTransito(viaje);
  const limite = limiteTransito(viaje, horasViaje);

  async function agregar() {
    const valor = texto.trim();
    if (!valor) return;
    await viajeUbicaciones.add({ id: uid('vub'), viajeId: viaje.id, texto: valor });
    await viajes.update(viaje.id, { ubicacionActual: valor });
    setTexto('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line-700 bg-bg-800 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-line-700 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-100">Avance del viaje {viaje.folio}</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Remolque {viaje.cajaEconomico || viaje.cajaNombre || 'N/D'} &middot; {viaje.origen || 'N/D'} &rarr;{' '}
              {viaje.destino || 'N/D'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <LineaTiempoRuta origen={viaje.origen} destino={viaje.destino} fraccion={avanceTransito(viaje, ahora, horasViaje)} />

          {inicio && limite ? (
            <p className="mb-4 text-xs text-ink-500">
              Salio a ruta el {inicio.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })} &middot; limite
              de {horasViaje} h: {limite.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          ) : (
            <p className="mb-4 text-xs text-amber-400">
              Todavia no se registra la hora de salida a ruta -- no se puede calcular el limite de transito.
            </p>
          )}

          <div className="space-y-0">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span className="h-3 w-3 flex-shrink-0 rounded-full bg-ink-500" />
                <span className="w-px flex-1 bg-line-700" style={{ minHeight: 16 }} />
              </div>
              <div className="pb-4 text-sm text-ink-300">
                <span className="font-medium text-ink-100">Origen:</span> {viaje.origen || 'N/D'}
              </div>
            </div>

            {checkpoints.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full bg-breco-500" />
                  <span className="w-px flex-1 bg-line-700" style={{ minHeight: 16 }} />
                </div>
                <div className="flex flex-1 items-start justify-between gap-2 pb-4">
                  <div>
                    <div className="text-sm text-ink-100">{c.texto}</div>
                    {c.creadoEn && (
                      <div className="text-xs text-ink-600">
                        {new Date(c.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                  {puedeEditar && (
                    <button
                      type="button"
                      onClick={() => viajeUbicaciones.remove(c.id)}
                      className="flex-shrink-0 text-ink-600 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex items-start gap-3">
              <span className="h-3 w-3 flex-shrink-0 rounded-full bg-emerald-500" />
              <div className="text-sm text-ink-300">
                <span className="font-medium text-ink-100">Destino:</span> {viaje.destino || 'N/D'}
                {normalizarEstatus(viaje.estatus) === 'entregado' && <span className="ml-2 text-xs text-emerald-400">Entregado</span>}
              </div>
            </div>
          </div>

          {puedeEditar && (
            <div className="mt-4 flex items-center gap-2 border-t border-line-800 pt-4">
              <Input
                placeholder="Ej. Monterrey, San Luis Potosi, Queretaro..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregar();
                  }
                }}
              />
              <GhostButton type="button" onClick={agregar}>
                <Plus size={14} />
                Agregar
              </GhostButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tablero({
  titulo,
  filas,
  ahora,
  puedeEditar,
  colorEstatus,
  unidadNombre,
  estatusOpciones,
  rutas,
  onCambiarEstatus,
  onDarSalida,
  onDarLlegada,
  onCambiarHora,
  onVerAvance,
}: {
  titulo: string;
  filas: Viaje[];
  ahora: Date;
  puedeEditar: boolean;
  colorEstatus: (nombre: string) => Tone | null;
  unidadNombre: (id: string) => string;
  estatusOpciones: EstatusViajeCustom[];
  rutas: Ruta[];
  onCambiarEstatus: (v: Viaje, estatus: string) => void;
  onDarSalida: (v: Viaje) => void;
  onDarLlegada: (v: Viaje) => void;
  onCambiarHora: (v: Viaje, hora: string) => void;
  onVerAvance: (v: Viaje) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0b0e14]">
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Truck size={26} className="text-amber-400" />
          <div className="text-xl font-black tracking-wide text-amber-400">{titulo}</div>
        </div>
        <Reloj />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left font-mono text-sm">
          <thead className="text-[11px] uppercase tracking-widest text-amber-500/70">
            <tr className="border-b border-line-800">
              <th className="px-4 py-2.5">Hora salida</th>
              <th className="px-4 py-2.5">Viaje</th>
              <th className="px-4 py-2.5">Origen</th>
              <th className="px-4 py-2.5">Destino</th>
              <th className="px-4 py-2.5">Unidad</th>
              <th className="px-4 py-2.5">Estatus</th>
              <th className="px-4 py-2.5">Avance</th>
              {puedeEditar && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={puedeEditar ? 8 : 7} className="px-4 py-8 text-center text-ink-600">
                  Sin viajes para esta fecha.
                </td>
              </tr>
            )}
            {filas.map((v) => {
              const horasViaje = horasAutorizadas(v, rutas);
              const etiqueta = etiquetaTablero(v, ahora, colorEstatus(v.estatus), horasViaje);
              const est = normalizarEstatus(v.estatus);
              const terminado = est === 'entregado' || est === 'cancelado';
              const fraccion = avanceTransito(v, ahora, horasViaje);
              return (
                <tr key={v.id} className="border-b border-line-800/70 text-ink-200">
                  <td className="px-4 py-2.5">
                    {puedeEditar ? (
                      <input
                        type="time"
                        value={v.horaSalida}
                        onChange={(e) => onCambiarHora(v, e.target.value)}
                        className="rounded border border-line-700 bg-bg-800 px-1.5 py-1 font-mono text-xs text-ink-100 outline-none focus:border-breco-500"
                      />
                    ) : (
                      <span className="tabular-nums">{v.horaSalida || '--:--'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-ink-100">{v.cajaEconomico || v.cajaNombre || 'N/D'}</div>
                    <div className="text-[11px] text-ink-600">{v.folio}</div>
                  </td>
                  <td className="px-4 py-2.5 uppercase">{v.origen || 'N/D'}</td>
                  <td className="px-4 py-2.5 uppercase">{v.destino || 'N/D'}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink-100">{unidadNombre(v.unidadId)}</td>
                  <td className="px-4 py-2.5">
                    {puedeEditar ? (
                      <select
                        value={v.estatus}
                        onChange={(e) => onCambiarEstatus(v, e.target.value)}
                        className={`rounded border border-line-700 bg-bg-800 px-1.5 py-1 text-xs font-bold outline-none focus:border-breco-500 ${TONE_TEXT[etiqueta.tono]}`}
                      >
                        {!estatusOpciones.some((es) => es.nombre === v.estatus) && <option value={v.estatus}>{v.estatus}</option>}
                        {estatusOpciones.map((es) => (
                          <option key={es.id} value={es.nombre}>
                            {es.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`font-bold ${TONE_TEXT[etiqueta.tono]}`}>{etiqueta.texto}</span>
                    )}
                    {etiqueta.detalle && <div className={`mt-1 text-[10px] font-normal normal-case ${TONE_TEXT[etiqueta.tono]}`}>{etiqueta.detalle}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16">{fraccion !== null && <BarraAvance fraccion={fraccion} />}</div>
                      <button
                        type="button"
                        onClick={() => onVerAvance(v)}
                        title="Ver/agregar avance"
                        className="rounded p-1 text-ink-500 hover:text-ink-100"
                      >
                        <MapPin size={14} />
                      </button>
                    </div>
                  </td>
                  {puedeEditar && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {!v.horaSalida && !terminado && (
                          <button
                            type="button"
                            onClick={() => onDarSalida(v)}
                            title="Dar salida a ruta"
                            className="flex items-center gap-1 rounded-lg bg-blue-500/15 px-2.5 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/25"
                          >
                            <LogOut size={13} />
                            Dar Salida
                          </button>
                        )}
                        {!terminado && (
                          <button
                            type="button"
                            onClick={() => onDarLlegada(v)}
                            title="Dar llegada"
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
                          >
                            <Flag size={13} />
                            Dar Llegada
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AeropuertoPage() {
  const { viajes, unidades, estatusViajes, rutas } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Viajes', 'editar');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [ahora, setAhora] = useState(new Date());
  const [viajeAvance, setViajeAvance] = useState<Viaje | null>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';

  const viajesDelDia = useMemo(() => viajes.items.filter((v) => v.fecha === fecha), [viajes.items, fecha]);

  const viajesOrdenados = useMemo(
    () => viajesDelDia.slice().sort((a, b) => (a.horaSalida || '99:99').localeCompare(b.horaSalida || '99:99')),
    [viajesDelDia],
  );

  const enCurso = viajesDelDia.filter((v) => normalizarEstatus(v.estatus) === 'en transito').length;
  const completados = viajesDelDia.filter((v) => normalizarEstatus(v.estatus) === 'entregado').length;
  const demorados = viajesDelDia.filter((v) => {
    const est = normalizarEstatus(v.estatus);
    if (est === 'entregado' || est === 'cancelado') return false;
    const limite = limiteTransito(v, horasAutorizadas(v, rutas.items));
    return limite !== null && ahora.getTime() > limite.getTime();
  }).length;

  function darSalida(v: Viaje) {
    viajes.update(v.id, {
      horaSalida: v.horaSalida || new Date().toTimeString().slice(0, 5),
      estatus: 'En transito',
    });
  }

  function darLlegada(v: Viaje) {
    viajes.update(v.id, {
      estatus: 'Entregado',
      fechaEntrega: new Date().toISOString().slice(0, 10),
      horaEntregaReal: new Date().toTimeString().slice(0, 5),
    });
  }

  function cambiarEstatusManual(v: Viaje, estatus: string) {
    viajes.update(v.id, { estatus });
  }

  function cambiarHora(v: Viaje, hora: string) {
    viajes.update(v.id, { horaSalida: hora });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Pantalla Aeropuerto</h1>
          <p className="mt-1 text-sm text-ink-500">Tablero de exportaciones e importaciones del dia, con avance por unidad.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Radio size={12} className="animate-pulse" />
            En vivo
          </span>
          <button
            onClick={() => setFecha((f) => shiftDate(f, -1))}
            className="rounded-lg border border-blue-400/50 bg-blue-400/5 p-2 text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={`${inputClass} w-44 border-blue-400/50 focus:border-blue-400`}
          />
          <button
            onClick={() => setFecha((f) => shiftDate(f, 1))}
            className="rounded-lg border border-blue-400/50 bg-blue-400/5 p-2 text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10"
          >
            <ChevronRight size={16} />
          </button>
          <ToolbarButton type="button" onClick={() => setFecha(new Date().toISOString().slice(0, 10))}>
            Hoy
          </ToolbarButton>
        </div>
      </div>

      <p className="mb-4 text-xs text-ink-600">
        Cada servicio tiene autorizadas las horas de ETA capturadas en su Ruta (o {HORAS_MAX_TRANSITO_RESPALDO} horas si la
        ruta no trae ETA) desde su hora real de salida. Si se excede sin haberse entregado, se marca DEMORADO.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Viajes de hoy" value={String(viajesDelDia.length)} icon={CalendarClock} accent="blue" />
        <StatCard label="En curso" value={String(enCurso)} icon={Truck} accent="blue" />
        <StatCard label="Completados" value={String(completados)} icon={CheckCircle2} accent="green" />
        <StatCard label="Demorados" value={String(demorados)} icon={Clock3} accent="amber" />
      </div>

      <div className="flex flex-col gap-4">
        <Tablero
          titulo="VIAJES EN RUTA"
          filas={viajesOrdenados}
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          unidadNombre={unidadNombre}
          estatusOpciones={estatusViajes.items}
          rutas={rutas.items}
          onCambiarEstatus={cambiarEstatusManual}
          onDarSalida={darSalida}
          onDarLlegada={darLlegada}
          onCambiarHora={cambiarHora}
          onVerAvance={setViajeAvance}
        />
      </div>

      {viajeAvance && <AvanceModal viaje={viajeAvance} ahora={ahora} rutas={rutas.items} onClose={() => setViajeAvance(null)} />}
    </div>
  );
}
