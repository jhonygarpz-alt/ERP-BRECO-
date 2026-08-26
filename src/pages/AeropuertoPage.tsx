import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, PlaneTakeoff, PlaneLanding, CalendarClock, Radio, CheckCircle2, Clock3 } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import type { Tone } from '../components/ui/Badge';
import type { Viaje } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { GhostButton, inputClass } from '../components/ui/form';

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

/**
 * Traduce el estatus real del viaje al lenguaje de un tablero de
 * aeropuerto. "DEMORADO" se infiere comparando la cita contra la hora
 * actual (no hay telemetria real); todo lo demas viene de datos reales
 * del viaje (estatus, y su color si es un estatus personalizado).
 */
function etiquetaAeropuerto(
  v: Viaje,
  esSalida: boolean,
  ahora: Date,
  colorPersonalizado: Tone | null,
): EtiquetaEstatus {
  if (v.estatus === 'Cancelado') return { texto: 'CANCELADO', tono: 'red' };
  if (v.estatus === 'Entregado') return { texto: esSalida ? 'SALIO' : 'ARRIBO', tono: 'green' };

  if (v.cita) {
    const citaEnMs = new Date(`${v.fecha}T${v.cita}`).getTime();
    if (Number.isFinite(citaEnMs) && citaEnMs < ahora.getTime()) {
      return { texto: 'DEMORADO', tono: 'amber' };
    }
  }

  if (v.estatus === 'En transito') return { texto: 'EN CAMINO', tono: 'blue' };
  if (v.estatus === 'Programado') return { texto: 'A TIEMPO', tono: 'green' };
  return { texto: v.estatus.toUpperCase(), tono: colorPersonalizado ?? 'gray' };
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

function Tablero({
  titulo,
  Icono,
  columnaExtra,
  filas,
  esSalida,
  ahora,
  puedeEditar,
  colorEstatus,
  onTerminar,
}: {
  titulo: string;
  Icono: typeof PlaneTakeoff;
  columnaExtra: string;
  filas: { viaje: Viaje; unidad: string; extra: string }[];
  esSalida: boolean;
  ahora: Date;
  puedeEditar: boolean;
  colorEstatus: (nombre: string) => Tone | null;
  onTerminar: (v: Viaje) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0b0e14]">
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Icono size={26} className="text-amber-400" />
          <div>
            <div className="text-xl font-black tracking-wide text-amber-400">{titulo}</div>
            <div className="text-[11px] uppercase tracking-widest text-ink-500">
              {esSalida ? 'Departures' : 'Arrivals'}
            </div>
          </div>
        </div>
        <Reloj />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left font-mono text-sm">
          <thead className="text-[11px] uppercase tracking-widest text-amber-500/70">
            <tr className="border-b border-line-800">
              <th className="px-4 py-2.5">Hora</th>
              <th className="px-4 py-2.5">Vuelo</th>
              <th className="px-4 py-2.5">{esSalida ? 'Destino' : 'Origen'}</th>
              <th className="px-4 py-2.5">{columnaExtra}</th>
              <th className="px-4 py-2.5">Estatus</th>
              {puedeEditar && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={puedeEditar ? 6 : 5} className="px-4 py-8 text-center text-ink-600">
                  Sin viajes {esSalida ? 'de salida' : 'de llegada'} para esta fecha.
                </td>
              </tr>
            )}
            {filas.map(({ viaje: v, unidad, extra }) => {
              const etiqueta = etiquetaAeropuerto(v, esSalida, ahora, colorEstatus(v.estatus));
              const terminado = v.estatus === 'Entregado' || v.estatus === 'Cancelado';
              return (
                <tr key={v.id} className="border-b border-line-800/70 text-ink-200">
                  <td className="px-4 py-2.5 tabular-nums">{v.horaSalida || v.cita || '--:--'}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink-100">{v.folio}</td>
                  <td className="px-4 py-2.5 uppercase">{(esSalida ? v.destino : v.origen) || 'N/D'}</td>
                  <td className="px-4 py-2.5 text-ink-400">{extra || unidad}</td>
                  <td className={`px-4 py-2.5 font-bold ${TONE_TEXT[etiqueta.tono]}`}>{etiqueta.texto}</td>
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

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const colorEstatus = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const viajesDelDia = useMemo(() => viajes.items.filter((v) => v.fecha === fecha), [viajes.items, fecha]);

  const salidas = useMemo(
    () =>
      viajesDelDia
        .filter((v) => v.exportacion)
        .sort((a, b) => (a.horaSalida || a.cita).localeCompare(b.horaSalida || b.cita))
        .map((v) => ({ viaje: v, unidad: unidadNombre(v.unidadId), extra: unidadNombre(v.unidadId) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajesDelDia, unidades.items],
  );

  const llegadas = useMemo(
    () =>
      viajesDelDia
        .filter((v) => v.importacion)
        .sort((a, b) => (a.horaSalida || a.cita).localeCompare(b.horaSalida || b.cita))
        .map((v) => ({ viaje: v, unidad: unidadNombre(v.unidadId), extra: unidadNombre(v.unidadId) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajesDelDia, unidades.items],
  );

  const enCurso = viajesDelDia.filter((v) => v.estatus === 'En transito').length;
  const completados = viajesDelDia.filter((v) => v.estatus === 'Entregado').length;
  const demorados = viajesDelDia.filter((v) => {
    if (v.estatus === 'Entregado' || v.estatus === 'Cancelado' || !v.cita) return false;
    const citaEnMs = new Date(`${v.fecha}T${v.cita}`).getTime();
    return Number.isFinite(citaEnMs) && citaEnMs < ahora.getTime();
  }).length;

  function terminarViaje(v: Viaje) {
    viajes.update(v.id, { estatus: 'Entregado' });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Pantalla Aeropuerto</h1>
          <p className="mt-1 text-sm text-ink-500">Tablero de salidas (EXPO) y llegadas (IMPO) del dia.</p>
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

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Viajes de hoy" value={String(viajesDelDia.length)} icon={CalendarClock} accent="blue" />
        <StatCard label="En curso" value={String(enCurso)} icon={PlaneTakeoff} accent="blue" />
        <StatCard label="Completados" value={String(completados)} icon={CheckCircle2} accent="green" />
        <StatCard label="Demorados" value={String(demorados)} icon={Clock3} accent="amber" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Tablero
          titulo="EXPOS"
          Icono={PlaneTakeoff}
          columnaExtra="Puerta"
          filas={salidas}
          esSalida
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          onTerminar={terminarViaje}
        />
        <Tablero
          titulo="IMPOS"
          Icono={PlaneLanding}
          columnaExtra="Cinta"
          filas={llegadas}
          esSalida={false}
          ahora={ahora}
          puedeEditar={puedeEditar}
          colorEstatus={colorEstatus}
          onTerminar={terminarViaje}
        />
      </div>
    </div>
  );
}
