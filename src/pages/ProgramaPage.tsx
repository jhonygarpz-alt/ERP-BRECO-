import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Truck, IdCard, PackageSearch } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { StatusBadge } from '../components/ui/Badge';
import { inputClass } from '../components/ui/form';

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ProgramaPage() {
  const { viajes, clientes, unidades, cajas, operadores } = useData();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const cajaNombre = (id: string) => cajas.items.find((c) => c.id === id)?.economico ?? 'N/D';
  const operadorNombre = (id: string) => operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';

  const viajesDelDia = useMemo(
    () =>
      viajes.items
        .filter((v) => v.fecha === fecha)
        .sort((a, b) => a.horaSalida.localeCompare(b.horaSalida)),
    [viajes.items, fecha],
  );

  const formattedDate = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const counts = ['Programado', 'En transito', 'Entregado', 'Cancelado'].map((estatus) => ({
    estatus,
    total: viajesDelDia.filter((v) => v.estatus === estatus).length,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-100">Programa Diario de Viajes</h1>
          <p className="mt-1 text-sm capitalize text-ink-500">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setFecha(new Date().toISOString().slice(0, 10))}
            className="rounded-lg border border-line-700 bg-bg-800 px-3 py-2 text-sm text-ink-300 hover:text-ink-100"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.estatus} className="rounded-xl border border-line-800 bg-bg-800 p-4 text-center">
            <div className="text-2xl font-semibold text-ink-100">{c.total}</div>
            <div className="mt-1 text-xs text-ink-500">{c.estatus}</div>
          </div>
        ))}
      </div>

      <div className="relative space-y-4 border-l border-line-800 pl-6">
        {viajesDelDia.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-600">No hay viajes programados para este dia.</p>
        )}
        {viajesDelDia.map((v) => (
          <div key={v.id} className="relative">
            <span className="absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-bg-950 bg-breco-500" />
            <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold text-ink-100">{v.horaSalida}</span>
                  <span className="text-sm font-medium text-ink-300">{v.folio}</span>
                </div>
                <StatusBadge status={v.estatus} />
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-300">
                <MapPin size={14} className="text-breco-500" />
                {v.origen} <span className="text-ink-600">&rarr;</span> {v.destino}
                {v.horaLlegadaEstimada && (
                  <span className="text-xs text-ink-600">(ETA {v.horaLlegadaEstimada})</span>
                )}
              </div>

              <div className="mt-3 text-sm font-medium text-ink-100">{clienteNombre(v.clienteId)}</div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1.5">
                  <Truck size={13} /> {unidadNombre(v.unidadId)}
                </span>
                <span className="flex items-center gap-1.5">
                  <PackageSearch size={13} /> {cajaNombre(v.cajaId)}
                </span>
                <span className="flex items-center gap-1.5">
                  <IdCard size={13} /> {operadorNombre(v.operadorId)}
                </span>
              </div>

              {v.observaciones && (
                <p className="mt-3 rounded-lg bg-bg-900/60 px-3 py-2 text-xs text-ink-500">{v.observaciones}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
