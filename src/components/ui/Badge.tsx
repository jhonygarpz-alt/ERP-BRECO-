const TONES: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  gray: 'bg-ink-500/15 text-ink-400 border-ink-500/30',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  Disponible: 'green',
  activo: 'green',
  'En viaje': 'blue',
  'En transito': 'blue',
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

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
