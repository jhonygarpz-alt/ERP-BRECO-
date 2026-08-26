import { Link } from 'react-router-dom';
import { Truck, Route, Receipt, IdCard, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAlertas } from '../lib/alertas';
import { StatCard } from '../components/ui/StatCard';
import { DonutChart } from '../components/ui/charts';
import { StatusBadge, type Tone } from '../components/ui/Badge';

const todayStr = new Date().toISOString().slice(0, 10);

const ESTATUS_UNIDAD_COLOR: Record<string, string> = {
  Disponible: '#34d399',
  'En viaje': '#60a5fa',
  'En uso': '#60a5fa',
  Taller: '#fbbf24',
  Mantenimiento: '#fbbf24',
  'Fuera de servicio': '#e11d2e',
};

function ultimosNDias(n: number): string[] {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
}

function tiempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Justo ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Ayer';
  return `Hace ${d} dias`;
}

export function Dashboard() {
  const { viajes, unidades, operadores, facturas, clientes, estatusViajes, empresa } = useData();
  const alertas = useAlertas();
  const estatusTono = (nombre: string): Tone | null =>
    (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const viajesHoy = viajes.items.filter((v) => v.fecha === todayStr);
  const enTransito = viajes.items.filter((v) => v.estatus === 'En transito').length;
  const unidadesDisponibles = unidades.items.filter((u) => u.estatus === 'Disponible').length;
  const facturacionHoy = facturas.items.filter((f) => f.fecha === todayStr).reduce((sum, f) => sum + f.importe, 0);
  const facturasPendientes = facturas.items.filter((f) => f.estatus === 'Pendiente').length;

  const licenciasPorVencer = operadores.items.filter((op) => {
    const dias = (new Date(op.vigenciaLicencia).getTime() - Date.now()) / 86400000;
    return dias <= 60;
  });

  const dias7 = ultimosNDias(7);
  const viajesPorDia = dias7.map((d) => viajes.items.filter((v) => v.fecha === d).length);
  const facturacionPorDia = dias7.map((d) =>
    facturas.items.filter((f) => f.fecha === d).reduce((s, f) => s + f.importe, 0),
  );

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';

  const proximosViajes = [...viajes.items]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaSalida.localeCompare(b.horaSalida))
    .slice(0, 6);

  const unidadesPorEstado = new Map<string, number>();
  for (const u of unidades.items) unidadesPorEstado.set(u.estatus, (unidadesPorEstado.get(u.estatus) ?? 0) + 1);
  const segmentosUnidades = [...unidadesPorEstado.entries()].map(([estatus, cantidad]) => ({
    label: estatus,
    value: cantidad,
    color: ESTATUS_UNIDAD_COLOR[estatus] ?? '#8992a6',
  }));

  const actividad = [
    ...viajes.items
      .filter((v) => v.creadoEn)
      .map((v) => ({
        id: `via-${v.id}`,
        icono: Route,
        texto: `Nuevo viaje ${v.folio}`,
        sub: `${unidadNombre(v.unidadId)} · ${clienteNombre(v.clienteId)}`,
        fecha: v.creadoEn as string,
      })),
    ...facturas.items
      .filter((f) => f.creadoEn)
      .map((f) => ({
        id: `fac-${f.id}`,
        icono: Receipt,
        texto: `Nueva factura ${f.folio}`,
        sub: clienteNombre(f.clienteId),
        fecha: f.creadoEn as string,
      })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 6);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Resumen de trafico</h1>
          <p className="mt-1 text-sm text-ink-500">Vista general de la operacion diaria de {empresa.value.nombre}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Viajes hoy"
          value={String(viajesHoy.length)}
          icon={Route}
          accent="red"
          hint={`${enTransito} en transito`}
          sparkline={viajesPorDia}
        />
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
          sparkline={facturacionPorDia}
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
                <StatusBadge status={v.estatus} tone={estatusTono(v.estatus)} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Alertas</h2>
          <div className="space-y-3">
            {alertas.length === 0 && <p className="py-6 text-center text-sm text-ink-600">Sin alertas activas.</p>}
            {alertas.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  a.nivel === 'alto' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                <AlertTriangle
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${a.nivel === 'alto' ? 'text-breco-500' : 'text-amber-400'}`}
                />
                <div>
                  <div className="text-xs text-ink-100">{a.mensaje}</div>
                  <div className="text-[11px] text-ink-500">{a.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Unidades por estado</h2>
          {unidades.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-600">Sin unidades registradas.</p>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart
                segments={segmentosUnidades}
                centerValue={String(unidades.items.length)}
                centerLabel="Total unidades"
              />
              <div className="flex-1 space-y-2">
                {segmentosUnidades
                  .sort((a, b) => b.value - a.value)
                  .map((s) => (
                    <div key={s.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-ink-300">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-medium text-ink-100">{s.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-5 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Actividad reciente</h2>
          <div className="space-y-1">
            {actividad.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-600">Sin actividad registrada todavia.</p>
            )}
            {actividad.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-bg-700/50">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bg-700 text-ink-400">
                  <a.icono size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink-100">{a.texto}</div>
                  <div className="truncate text-xs text-ink-500">{a.sub}</div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 text-xs text-ink-600">
                  <Clock size={11} />
                  {tiempoRelativo(a.fecha)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
