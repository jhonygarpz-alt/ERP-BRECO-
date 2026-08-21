import { Link } from 'react-router-dom';
import { Truck, Route, Receipt, IdCard, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/Badge';

const todayStr = new Date().toISOString().slice(0, 10);

export function Dashboard() {
  const { viajes, unidades, operadores, facturas, clientes } = useData();

  const viajesHoy = viajes.items.filter((v) => v.fecha === todayStr);
  const enTransito = viajes.items.filter((v) => v.estatus === 'En transito').length;
  const unidadesDisponibles = unidades.items.filter((u) => u.estatus === 'Disponible').length;
  const facturacionHoy = facturas.items
    .filter((f) => f.fecha === todayStr)
    .reduce((sum, f) => sum + f.importe, 0);
  const facturasPendientes = facturas.items.filter((f) => f.estatus === 'Pendiente').length;

  const licenciasPorVencer = operadores.items.filter((op) => {
    const dias = (new Date(op.vigenciaLicencia).getTime() - Date.now()) / 86400000;
    return dias <= 60;
  });

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';

  const proximosViajes = [...viajes.items]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaSalida.localeCompare(b.horaSalida))
    .slice(0, 6);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Resumen de trafico</h1>
          <p className="mt-1 text-sm text-ink-500">
            Vista general de la operacion diaria de BRECO Transportes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Viajes hoy" value={String(viajesHoy.length)} icon={Route} accent="red" hint={`${enTransito} en transito`} />
        <StatCard
          label="Unidades disponibles"
          value={`${unidadesDisponibles}/${unidades.items.length}`}
          icon={Truck}
          accent="blue"
          hint="Tractocamiones y rabones"
        />
        <StatCard
          label="Facturacion del dia"
          value={facturacionHoy.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          icon={Receipt}
          accent="green"
          hint={`${facturasPendientes} facturas pendientes`}
        />
        <StatCard
          label="Operadores"
          value={String(operadores.items.length)}
          icon={IdCard}
          accent="amber"
          hint={`${licenciasPorVencer.length} licencias por vencer`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-100">Proximos viajes</h2>
            <Link to="/programa" className="flex items-center gap-1 text-xs font-medium text-breco-500 hover:underline">
              Ver programa diario <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {proximosViajes.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-600">No hay viajes registrados.</p>
            )}
            {proximosViajes.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-2 rounded-xl border border-line-800 bg-bg-900/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-ink-100">
                    {v.folio} &middot; {clienteNombre(v.clienteId)}
                  </div>
                  <div className="text-xs text-ink-500">
                    {v.origen} &rarr; {v.destino} &middot; {v.fecha} {v.horaSalida}
                  </div>
                </div>
                <StatusBadge status={v.estatus} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Alertas</h2>
          <div className="space-y-3">
            {licenciasPorVencer.map((op) => (
              <div key={op.id} className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
                <div className="text-xs text-ink-300">
                  Licencia de <span className="font-medium text-ink-100">{op.nombre}</span> vence el{' '}
                  {op.vigenciaLicencia}
                </div>
              </div>
            ))}
            {unidades.items
              .filter((u) => u.estatus === 'Taller' || u.estatus === 'Fuera de servicio')
              .map((u) => (
                <div key={u.id} className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-breco-500" />
                  <div className="text-xs text-ink-300">
                    Unidad <span className="font-medium text-ink-100">{u.economico}</span> esta en{' '}
                    {u.estatus.toLowerCase()}
                  </div>
                </div>
              ))}
            {licenciasPorVencer.length === 0 &&
              unidades.items.every((u) => u.estatus !== 'Taller' && u.estatus !== 'Fuera de servicio') && (
                <p className="py-6 text-center text-sm text-ink-600">Sin alertas activas.</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
