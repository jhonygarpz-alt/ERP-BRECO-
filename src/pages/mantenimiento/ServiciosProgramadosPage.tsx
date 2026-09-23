import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { calcularServiciosProgramados } from '../../lib/mantenimiento';
import { StatusBadge } from '../../components/ui/Badge';

export function ServiciosProgramadosPage() {
  const { unidades, planesServicio, ordenesServicio } = useData();
  const [busqueda, setBusqueda] = useState('');
  const [soloVencidos, setSoloVencidos] = useState(false);

  const estados = useMemo(
    () => calcularServiciosProgramados(unidades.items, planesServicio.items, ordenesServicio.items, hoyISO()),
    [unidades.items, planesServicio.items, ordenesServicio.items],
  );

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return estados
      .filter((e) => !soloVencidos || e.vencido)
      .filter((e) => !termino || e.unidad.economico.toLowerCase().includes(termino) || e.plan.nombre.toLowerCase().includes(termino));
  }, [estados, busqueda, soloVencidos]);

  const totalVencidos = estados.filter((e) => e.vencido).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Servicios Programados</h1>
          <p className="mt-1 text-sm text-ink-500">Que unidades ya vencieron o estan por vencer su proximo mantenimiento, segun sus planes de servicio.</p>
        </div>
        {totalVencidos > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            <AlertTriangle size={16} />
            {totalVencidos} servicio{totalVencidos === 1 ? '' : 's'} vencido{totalVencidos === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-300">
          <input type="checkbox" checked={soloVencidos} onChange={(e) => setSoloVencidos(e.target.checked)} className="h-4 w-4 accent-breco-500" />
          Solo vencidos
        </label>
        <div className="relative flex-1">
          <label className="mb-1 block text-xs text-ink-500">Buscar</label>
          <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-ink-600" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Unidad o plan de servicio..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
          Sin resultados. Verifica que tengas Unidades activas y Planes de Servicio configurados en Catalogos de Mantenimiento.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Unidad</th>
                  <th className="px-4 py-3 font-medium">Plan de Servicio</th>
                  <th className="px-4 py-3 font-medium">Ultimo Servicio</th>
                  <th className="px-4 py-3 font-medium">Km Recorridos</th>
                  <th className="px-4 py-3 font-medium">Km Restantes</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Dias Restantes</th>
                  <th className="px-4 py-3 font-medium">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e, i) => (
                  <tr key={i} className={`border-b border-line-800/70 last:border-0 hover:bg-bg-700/40 ${e.vencido ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-ink-100">
                      {e.unidad.economico} <span className="font-normal text-ink-500">({e.unidad.placas})</span>
                    </td>
                    <td className="px-4 py-3 text-ink-300">{e.plan.nombre}</td>
                    <td className="px-4 py-3 text-ink-300">{e.ultimoServicio?.fecha ?? 'Nunca'}</td>
                    <td className="px-4 py-3 text-ink-300">{e.kmRecorridos !== null ? e.kmRecorridos.toLocaleString('es-MX') : '-'}</td>
                    <td className="px-4 py-3 text-ink-300">{e.kmRestantes !== null ? e.kmRestantes.toLocaleString('es-MX') : '-'}</td>
                    <td className="px-4 py-3 text-ink-300">{e.fechaVencimiento ?? '-'}</td>
                    <td className="px-4 py-3 text-ink-300">{e.diasRestantes !== null ? e.diasRestantes : '-'}</td>
                    <td className="px-4 py-3">
                      {e.vencido ? (
                        <StatusBadge status="Vencido" tone="red" />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 size={14} /> Al dia
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
