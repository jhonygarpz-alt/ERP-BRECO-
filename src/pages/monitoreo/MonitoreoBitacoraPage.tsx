import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { inputClass } from '../../components/ui/form';

export function MonitoreoBitacoraPage() {
  const { viajeUbicaciones, viajes, clientes } = useData();
  const [busqueda, setBusqueda] = useState('');

  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return viajeUbicaciones.items
      .map((u) => {
        const viaje = viajes.items.find((v) => v.id === u.viajeId);
        return {
          id: u.id,
          folio: viaje?.folio ?? 'N/D',
          cliente: clientes.items.find((c) => c.id === viaje?.clienteId)?.nombre ?? '',
          texto: u.texto,
          creadoEn: u.creadoEn ?? '',
        };
      })
      .filter(
        (f) =>
          !termino || f.folio.toLowerCase().includes(termino) || f.texto.toLowerCase().includes(termino) || f.cliente.toLowerCase().includes(termino),
      )
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  }, [viajeUbicaciones.items, viajes.items, clientes.items, busqueda]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Bitacora de Seguimiento</h1>
        <p className="mt-1 text-sm text-ink-500">
          Historial de avances capturados en cada viaje (los mismos checkpoints que se agregan desde Pantalla Aeropuerto).
        </p>
      </div>

      <div className="relative mb-4 w-72">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por viaje, cliente o texto..."
          className={`${inputClass} w-full pl-9`}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Viaje</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Ubicacion registrada</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-600">
                    Sin registros en la bitacora.
                  </td>
                </tr>
              )}
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40">
                  <td className="px-4 py-3 text-ink-400">
                    {f.creadoEn ? new Date(f.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-100">{f.folio}</td>
                  <td className="px-4 py-3 text-ink-300">{f.cliente || '-'}</td>
                  <td className="px-4 py-3 text-ink-300">{f.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
