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
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { Tone } from '../components/ui/Badge';
import type { Viaje } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { GhostButton, Input, inputClass } from '../components/ui/form';

const HORAS_MAX_TRANSITO = 24;

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
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
}

/** Inicio real del transito: fecha + hora de salida a ruta. null si aun no se ha registrado. */
function inicioTransito(v: Viaje): Date | null {
  if (!v.horaSalida) return null;
  const d = new Date(`${v.fecha}T${v.horaSalida}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Limite autorizado: 24 horas despues de la salida real. */
function limiteTransito(v: Viaje): Date | null {
  const inicio = inicioTransito(v);
  return inicio ? new Date(inicio.getTime() + HORAS_MAX_TRANSITO * 60 * 60 * 1000) : null;
}

/**
 * Traduce el estatus real del viaje al lenguaje de un tablero de
 * operacion. "DEMORADO" ya no se adivina: se calcula contra las 24 horas
 * maximas de transito autorizadas desde la hora real de salida a ruta.
 */
function etiquetaTablero(v: Viaje, esSalida: boolean, ahora: Date, colorPersonalizado: Tone | null): EtiquetaEstatus {
  if (v.estatus === 'Cancelado') return { texto: 'CANCELADO', tono: 'red' };
  if (v.estatus === 'Entregado') return { texto: esSalida ? 'SALIO' : 'ARRIBO', tono: 'green' };

  const limite = limiteTransito(v);
  if (limite && ahora.getTime() > limite.getTime()) return { texto: 'DEMORADO', tono: 'red' };

  if (v.estatus === 'En transito') return { texto: 'EN TRANSITO', tono: 'blue' };
  if (v.estatus === 'Programado') return { texto: v.horaSalida ? 'A TIEMPO' : 'PROGRAMADO', tono: v.horaSalida ? 'green' : 'gray' };
  return { texto: v.estatus.toUpperCase(), tono: colorPersonalizado ?? 'gray' };
}

/** Fraccion 0-1 de las 24 h autorizadas ya transcurridas (puede pasar de 1 si va demorado). */
function avanceTransito(v: Viaje, ahora: Date): number | null {
  const inicio = inicioTransito(v);
  if (!inicio) return null;
  const transcurrido = ahora.getTime() - inicio.getTime();
  return transcurrido / (HORAS_MAX_TRANSITO * 60 * 60 * 1000);
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

function AvanceModal({ viaje, onClose }: { viaje: Viaje; onClose: () => void }) {
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

  const inicio = inicioTransito(viaje);
  const limite = limiteTransito(viaje);

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
          {inicio && limite ? (
            <p className="mb-4 text-xs text-ink-500">
              Salio a ruta el {inicio.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })} &middot; limite
              de {HORAS_MAX_TRANSITO} h: {limite.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
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
                {viaje.estatus === 'Entregado' && <span className="ml-2 text-xs text-emerald-400">Entregado</span>}
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
  esSalida,
  ahora,
  puedeEditar,
  colorEstatus,
  unidadNombre,
  onTerminar,
  onCambiarHora,
  onVerAvance,
}: {
  titulo: string;
  filas: Viaje[];
  esSalida: boolean;
  ahora: Date;
  puedeEditar: boolean;
  colorEstatus: (nombre: string) => Tone | null;
  unidadNombre: (id: string) => string;
  onTerminar: (v: Viaje) => void;
  onCambiarHora: (v: Viaje, hora: string) => void;
  onVerAvance: (v: Viaje) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0b0e14]">
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Truck size={26} className={`text-amber-400 ${esSalida ? '' : '-scale-x-100'}`} />
          <div>
            <div className="text-xl font-black tracking-wide text-amber-400">{titulo}</div>
            <div className="text-[11px] uppercase tracking-widest text-ink-500">{esSalida ? 'Salidas' : 'Llegadas'}</div>
          </div>
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
                  Sin viajes {esSalida ? 'de exportacion' : 'de importacion'} para esta fecha.
                </td>
              </tr>
            )}
            {filas.map((v) => {
              const etiqueta = etiquetaTablero(v, esSalida, ahora, colorEstatus(v.estatus));
              const terminado = v.estatus === 'Entregado' || v.estatus === 'Cancelado';
              const fraccion = avanceTransito(v, ahora);
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
                  <td className={`px-4 py-2.5 font-bold ${TONE_TEXT[etiqueta.tono]}`}>{etiqueta.texto}</td>
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
                      {!terminado && (
                        <GhostButton type="button" onClick={() => onTerminar(v)} className="py-1 text-xs">
                          Terminar
                        </GhostButton>
                      )}
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
  const { viajes, unidades, estatusViajes } = useData();
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

  const salidas = useMemo(
    () => viajesDelDia.filter((v) => v.exportacion).sort((a, b) => (a.horaSalida || '99:99').localeCompare(b.horaSalida || '99:99')),
    [viajesDelDia],
  );

  const llegadas = useMemo(
    () => viajesDelDia.filter((v) => v.importacion).sort((a, b) => (a.horaSalida || '99:99').localeCompare(b.horaSalida || '99:99')),
    [viajesDelDia],
  );

  const enCurso = viajesDelDia.filter((v) => v.estatus === 'En transito').length;
  const completados = viajesDelDia.filter((v) => v.estatus === 'Entregado').length;
  const demorados = viajesDelDia.filter((v) => {
    if (v.estatus === 'Entregado' || v.estatus === 'Cancelado') return false;
    const limite = limiteTransito(v);
    return limite !== null && ahora.getTime() > limite.getTime();
  }).length;

  function terminarViaje(v: Viaje) {
    viajes.update(v.id, { estatus: 'Entregado' });
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
            className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
          >
            <ChevronLeft size={16} />
          </button>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputClass} w-44`} />
          <button
            onClick={() => setFecha((f) => shiftDate(f, 1))}
            className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
          >
            <ChevronRight size={16} />
          </button>
          <GhostButton type="button" onClick={() => setFecha(new Date().toISOString().slice(0, 10))}>
            Hoy
          </GhostButton>
        </div>
      </div>

      <p className="mb-4 text-xs text-ink-600">
        Cada servicio tiene autorizadas {HORAS_MAX_TRANSITO} horas de transito desde su hora real de salida a ruta. Si se
        excede sin haberse entregado, se marca DEMORADO.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Viajes de hoy" value={String(viajesDelDia.length)} icon={CalendarClock} accent="blue" />
        <StatCard label="En curso" value={String(enCurso)} icon={Truck} accent="blue" />
        <StatCard label="Completados" value={String(completados)} icon={CheckCircle2} accent="green" />
        <StatCard label="Demorados" value={String(demorados)} icon={Clock3} accent="amber" />
      </div>

      <div className="flex flex-col gap-4">
        <Tablero
          titulo="EXPOS"
          filas={salidas}
          esSalida
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          unidadNombre={unidadNombre}
          onTerminar={terminarViaje}
          onCambiarHora={cambiarHora}
          onVerAvance={setViajeAvance}
        />
        <Tablero
          titulo="IMPOS"
          filas={llegadas}
          esSalida={false}
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          unidadNombre={unidadNombre}
          onTerminar={terminarViaje}
          onCambiarHora={cambiarHora}
          onVerAvance={setViajeAvance}
        />
      </div>

      {viajeAvance && <AvanceModal viaje={viajeAvance} onClose={() => setViajeAvance(null)} />}
    </div>
  );
}
