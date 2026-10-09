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
import { TONE_DOT, type Tone } from '../components/ui/Badge';
import type { EstatusViajeCustom, Ruta, Viaje } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { GhostButton, Input, ToolbarButton, inputClass } from '../components/ui/form';
import {
  HORAS_MAX_TRANSITO_RESPALDO,
  avanceTransito,
  destinoViaje,
  etiquetaTablero,
  horasAutorizadas,
  inicioTransito,
  limiteTransito,
  normalizarEstatus,
  origenViaje,
} from '../lib/monitoreoViajes';
import { fechaLocal, hoyISO } from '../lib/fechas';

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return fechaLocal(d);
}

function fechaCorta(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-emerald-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  gray: 'text-ink-400',
  purple: 'text-violet-400',
};

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
  const puedeEditar = hasPermission('Monitoreo', 'editar');
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
  const origen = origenViaje(viaje, rutas);
  const destino = destinoViaje(viaje, rutas);

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
              Remolque {viaje.cajaEconomico || viaje.cajaNombre || 'N/D'} &middot; {origen || 'N/D'} &rarr; {destino || 'N/D'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <LineaTiempoRuta origen={origen} destino={destino} fraccion={avanceTransito(viaje, ahora, horasViaje)} />

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
                <span className="font-medium text-ink-100">Origen:</span> {origen || 'N/D'}
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
                <span className="font-medium text-ink-100">Destino:</span> {destino || 'N/D'}
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
  fechaSeleccionada,
  ahora,
  puedeEditar,
  colorEstatus,
  unidadNombre,
  nombreCliente,
  nombreOperador,
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
  fechaSeleccionada: string;
  ahora: Date;
  puedeEditar: boolean;
  colorEstatus: (nombre: string) => Tone | null;
  unidadNombre: (id: string) => string;
  nombreCliente: (id: string) => string;
  nombreOperador: (v: Viaje) => string;
  estatusOpciones: EstatusViajeCustom[];
  rutas: Ruta[];
  onCambiarEstatus: (v: Viaje, estatus: string) => void;
  onDarSalida: (v: Viaje) => void;
  onDarLlegada: (v: Viaje) => void;
  onCambiarHora: (v: Viaje, hora: string) => void;
  onVerAvance: (v: Viaje) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border border-line-800 bg-bg-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-line-800 bg-bg-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <Truck size={26} className="text-breco-500" />
          <div className="text-xl font-black tracking-wide text-ink-100">{titulo}</div>
        </div>
        <Reloj />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left font-mono text-sm">
          <thead className="bg-breco-500/10 text-[11px] uppercase tracking-widest text-ink-400">
            <tr className="border-b border-line-800">
              {['#', 'Estatus', 'Viaje', 'Fecha / Hora', 'Cliente', 'Origen', 'Destino', 'Unidad', 'Operador', 'Avance'].map((col) => (
                <th key={col} className="px-4 py-2.5">
                  <span className="inline-block rounded border border-dotted border-breco-400 px-2 py-0.5 shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-breco-500)_60%,transparent)]">
                    {col}
                  </span>
                </th>
              ))}
              {puedeEditar && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={puedeEditar ? 11 : 10} className="px-4 py-8 text-center text-ink-600">
                  Sin viajes para esta fecha.
                </td>
              </tr>
            )}
            {filas.map((v, i) => {
              const horasViaje = horasAutorizadas(v, rutas);
              const etiqueta = etiquetaTablero(v, ahora, colorEstatus(v.estatus), horasViaje);
              const est = normalizarEstatus(v.estatus);
              const terminado = est === 'entregado' || est === 'cancelado';
              const fraccion = avanceTransito(v, ahora, horasViaje);
              return (
                <tr key={v.id} className="border-b border-line-800/70 text-ink-300">
                  <td className="px-4 py-2.5 text-ink-600">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    {puedeEditar ? (
                      <select
                        value={v.estatus}
                        onChange={(e) => onCambiarEstatus(v, e.target.value)}
                        className={`rounded-lg border-0 px-2 py-1 text-xs font-bold text-white outline-none ${TONE_DOT[etiqueta.tono]}`}
                      >
                        {!estatusOpciones.some((es) => es.nombre === v.estatus) && <option value={v.estatus}>{v.estatus}</option>}
                        {estatusOpciones.map((es) => (
                          <option key={es.id} value={es.nombre}>
                            {es.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block rounded-lg px-2 py-1 text-xs font-bold text-white ${TONE_DOT[etiqueta.tono]}`}>
                        {etiqueta.texto}
                      </span>
                    )}
                    {etiqueta.detalle && <div className={`mt-1 text-[10px] font-normal normal-case ${TONE_TEXT[etiqueta.tono]}`}>{etiqueta.detalle}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-ink-100">{v.folio}</div>
                    <div className="text-[11px] text-ink-600">
                      {v.cajaEconomico || v.cajaNombre || 'N/D'}
                      {v.fecha !== fechaSeleccionada && (
                        <span className="ml-1.5 rounded bg-amber-500/15 px-1 py-0.5 text-amber-400">Del {v.fecha}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="tabular-nums">{fechaCorta(v.fecha)}</div>
                    {puedeEditar ? (
                      <input
                        type="time"
                        value={v.horaSalida}
                        onChange={(e) => onCambiarHora(v, e.target.value)}
                        className="mt-0.5 rounded border border-line-700 bg-bg-800 px-1.5 py-1 font-mono text-xs text-ink-100 outline-none focus:border-breco-500"
                      />
                    ) : (
                      <span className="tabular-nums text-ink-500">{v.horaSalida || '--:--'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 normal-case text-ink-200">{nombreCliente(v.clienteId)}</td>
                  <td className="px-4 py-2.5 uppercase">{origenViaje(v, rutas) || 'N/D'}</td>
                  <td className="px-4 py-2.5 uppercase">{destinoViaje(v, rutas) || 'N/D'}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink-100">{unidadNombre(v.unidadId)}</td>
                  <td className="px-4 py-2.5 normal-case text-ink-200">{nombreOperador(v)}</td>
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
                            className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-black/20 transition hover:bg-blue-400"
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
                            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-black/20 transition hover:bg-emerald-400"
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

/** Vista rapida tipo tablero (una columna solida por estatus, con sus
 * viajes como tarjetas) debajo de la tabla -- mismos datos del dia, solo
 * para ver de un vistazo cuantos/cuales van en cada etapa. */
function TableroKanban({
  grupos,
  nombreCliente,
  onVerTarjeta,
}: {
  grupos: { nombre: string; tone: Tone; viajes: Viaje[] }[];
  nombreCliente: (id: string) => string;
  onVerTarjeta: (v: Viaje) => void;
}) {
  if (grupos.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {grupos.map((g) => (
        <div key={g.nombre} className="w-72 flex-shrink-0 overflow-hidden rounded-2xl border border-line-800 bg-bg-900 shadow-sm">
          <div className={`flex items-center justify-between px-4 py-2.5 ${TONE_DOT[g.tone]}`}>
            <span className="text-sm font-bold text-white">{g.nombre}</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-bold text-white">
              {g.viajes.length}
            </span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
            {g.viajes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onVerTarjeta(v)}
                className="w-full rounded-xl border border-line-800 bg-bg-800 p-3 text-left shadow-sm shadow-black/20 transition hover:border-line-700 hover:bg-bg-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-ink-100">
                    {v.folio} <span className="font-normal text-ink-500">{v.cajaEconomico || v.cajaNombre || ''}</span>
                  </span>
                  <Truck size={15} className="flex-shrink-0 text-ink-500" />
                </div>
                <div className="mt-1.5 truncate text-sm font-medium text-ink-200">{nombreCliente(v.clienteId)}</div>
                <div className="mt-1 text-xs tabular-nums text-ink-500">{v.horaSalida || '--:--'}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AeropuertoPage() {
  const { viajes, unidades, estatusViajes, rutas, clientes, operadores } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Monitoreo', 'editar');
  const [fecha, setFecha] = useState(hoyISO());
  const [ahora, setAhora] = useState(new Date());
  const [viajeAvance, setViajeAvance] = useState<Viaje | null>(null);
  const [filtroEstatus, setFiltroEstatus] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const nombreCliente = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const nombreOperador = (v: Viaje) => {
    const operadorId = v.trayectos[0]?.operadorId || v.operadorId;
    return operadores.items.find((o) => o.id === operadorId)?.nombre || 'N/D';
  };

  // Ademas de los viajes fechados este dia, en la vista de "Hoy" tambien se
  // incluye cualquier viaje que siga En Transito sin importar en que fecha
  // se registro -- si no, un viaje que salio ayer y todavia no llega
  // desaparece del tablero en cuanto cambia la fecha, aunque siga en la
  // carretera.
  const viajesDelDia = useMemo(
    () =>
      viajes.items.filter(
        (v) => v.fecha === fecha || (fecha === hoyISO() && normalizarEstatus(v.estatus) === 'en transito'),
      ),
    [viajes.items, fecha],
  );

  const viajesOrdenados = useMemo(
    () => viajesDelDia.slice().sort((a, b) => (a.horaSalida || '99:99').localeCompare(b.horaSalida || '99:99')),
    [viajesDelDia],
  );

  // Viajes del dia agrupados por estatus (mismo orden del catalogo), para la
  // barra de filtros por color y el tablero Kanban de abajo.
  const gruposEstatus = useMemo(() => {
    const porNombre = new Map<string, Viaje[]>();
    for (const v of viajesOrdenados) {
      const lista = porNombre.get(v.estatus) ?? [];
      lista.push(v);
      porNombre.set(v.estatus, lista);
    }
    const nombresCatalogo = estatusViajes.items.map((e) => e.nombre);
    const nombresExtra = Array.from(porNombre.keys()).filter((n) => !nombresCatalogo.includes(n));
    return [...nombresCatalogo, ...nombresExtra]
      .filter((n) => porNombre.has(n))
      .map((nombre) => ({ nombre, tone: colorEstatus(nombre) ?? ('gray' as Tone), viajes: porNombre.get(nombre)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajesOrdenados, estatusViajes.items]);

  const filasTabla = useMemo(
    () => (filtroEstatus ? viajesOrdenados.filter((v) => v.estatus === filtroEstatus) : viajesOrdenados),
    [viajesOrdenados, filtroEstatus],
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
      fechaEntrega: hoyISO(),
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
        <div className="rounded-2xl bg-sb-bg px-5 py-4">
          <h1 className="text-xl font-bold text-sb-text">Pantalla Aeropuerto</h1>
          <p className="mt-1 text-sm text-sb-text-muted">Tablero de exportaciones e importaciones del dia, con avance por unidad.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Radio size={12} className="animate-pulse" />
            En vivo
          </span>
          <button
            onClick={() => setFecha((f) => shiftDate(f, -1))}
            className="rounded-lg bg-breco-500 p-2 text-white shadow-sm shadow-black/20 transition hover:brightness-110"
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
            className="rounded-lg bg-breco-500 p-2 text-white shadow-sm shadow-black/20 transition hover:brightness-110"
          >
            <ChevronRight size={16} />
          </button>
          <ToolbarButton type="button" onClick={() => setFecha(hoyISO())}>
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

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltroEstatus(null)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm shadow-black/20 transition ${
            filtroEstatus === null ? 'bg-breco-500 text-white' : 'bg-bg-600 text-ink-300 hover:bg-bg-500'
          }`}
        >
          Todos
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
              filtroEstatus === null ? 'bg-white/20 text-white' : 'bg-bg-500 text-ink-200'
            }`}
          >
            {viajesOrdenados.length}
          </span>
        </button>
        {gruposEstatus.map((g) => (
          <button
            key={g.nombre}
            type="button"
            onClick={() => setFiltroEstatus((actual) => (actual === g.nombre ? null : g.nombre))}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm shadow-black/20 transition ${
              filtroEstatus === g.nombre ? `${TONE_DOT[g.tone]} text-white` : 'bg-bg-600 text-ink-300 hover:bg-bg-500'
            }`}
          >
            {g.nombre}
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${
                filtroEstatus === g.nombre ? 'bg-white/20' : TONE_DOT[g.tone]
              }`}
            >
              {g.viajes.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Tablero
          titulo="VIAJES EN RUTA"
          filas={filasTabla}
          fechaSeleccionada={fecha}
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          unidadNombre={unidadNombre}
          nombreCliente={nombreCliente}
          nombreOperador={nombreOperador}
          estatusOpciones={estatusViajes.items}
          rutas={rutas.items}
          onCambiarEstatus={cambiarEstatusManual}
          onDarSalida={darSalida}
          onDarLlegada={darLlegada}
          onCambiarHora={cambiarHora}
          onVerAvance={setViajeAvance}
        />
      </div>

      {gruposEstatus.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Tablero por estatus</h2>
          <TableroKanban grupos={gruposEstatus} nombreCliente={nombreCliente} onVerTarjeta={setViajeAvance} />
        </div>
      )}

      {viajeAvance && <AvanceModal viaje={viajeAvance} ahora={ahora} rutas={rutas.items} onClose={() => setViajeAvance(null)} />}
    </div>
  );
}
