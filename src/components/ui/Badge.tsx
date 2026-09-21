export const TONES: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  gray: 'bg-ink-500/15 text-ink-500 border-ink-500/30',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  lime: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export type Tone = keyof typeof TONES;

// Version solida de cada tono, para pintar el punto de un selector de color
// (los TONES de arriba son translucidos, pensados para el fondo del badge).
export const TONE_DOT: Record<Tone, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  gray: 'bg-ink-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  yellow: 'bg-yellow-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
  lime: 'bg-lime-500',
  sky: 'bg-sky-500',
};

const STATUS_TONE: Record<string, Tone> = {
  Disponible: 'green',
  activo: 'green',
  'En viaje': 'blue',
  'En transito': 'green',
  Programado: 'amber',
  Entregado: 'green',
  Facturado: 'blue',
  Pagado: 'green',
  Pendiente: 'amber',
  Cancelado: 'red',
  Taller: 'amber',
  Mantenimiento: 'amber',
  'Fuera de servicio': 'red',
  'En uso': 'blue',
  Descanso: 'purple',
  Baja: 'red',
  inactivo: 'gray',
};

/**
 * "tone" permite pasar un color explicito (ej. desde un catalogo editable
 * por el usuario como estatus_viaje.color) que tiene prioridad sobre el
 * mapa fijo de arriba, el cual solo cubre los estatus que vienen de fabrica.
 */
export function StatusBadge({ status, tone: toneProp }: { status: string; tone?: Tone | null }) {
  const tone = toneProp ?? STATUS_TONE[status] ?? 'gray';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
