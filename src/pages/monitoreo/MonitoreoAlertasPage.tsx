import { useEffect, useMemo, useState } from 'react';
import { Clock3, WifiOff, Printer } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularAlertas, type TipoAlerta } from '../../lib/monitoreoAlertas';
import { Select } from '../../components/ui/form';

const ICONO: Record<TipoAlerta, typeof Clock3> = { retraso: Clock3, sin_actualizacion: WifiOff };
const NOMBRE_TIPO: Record<TipoAlerta, string> = { retraso: 'Retraso en ETA', sin_actualizacion: 'Sin actualizacion de ubicacion' };

export function MonitoreoAlertasPage() {
  const { viajes, rutas, viajeUbicaciones, clientes } = useData();
  const [ahora, setAhora] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<'todas' | TipoAlerta>('todas');
  const [filtroSeveridad, setFiltroSeveridad] = useState<'todas' | 'alta' | 'media'>('todas');

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const alertas = useMemo(
    () => calcularAlertas(viajes.items, rutas.items, viajeUbicaciones.items, ahora),
    [viajes.items, rutas.items, viajeUbicaciones.items, ahora],
  );

  const filtradas = alertas.filter((a) => {
    if (filtroTipo !== 'todas' && a.tipo !== filtroTipo) return false;
    if (filtroSeveridad !== 'todas' && a.severidad !== filtroSeveridad) return false;
    return true;
  });

  function nombreCliente(viajeId: string) {
    const v = viajes.items.find((x) => x.id === viajeId);
    return clientes.items.find((c) => c.id === v?.clienteId)?.nombre ?? '';
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Alertas</h1>
        <p className="mt-1 text-sm text-ink-500">
          Condiciones detectadas automaticamente sobre viajes activos (retraso en ETA, sin actualizacion de ubicacion).
        </p>
      </div>

      <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
        Estas alertas se calculan con los datos reales del viaje (hora de salida, horas autorizadas de la Ruta, bitacora de
        ubicacion) -- no vienen de un sensor de GPS. Por eso no incluyen exceso de velocidad ni desviacion de ruta, que
        requerirían telemetria real que el sistema todavia no tiene conectada.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} className="w-56">
          <option value="todas">Todos los tipos</option>
          <option value="retraso">Retraso en ETA</option>
          <option value="sin_actualizacion">Sin actualizacion</option>
        </Select>
        <Select value={filtroSeveridad} onChange={(e) => setFiltroSeveridad(e.target.value as typeof filtroSeveridad)} className="w-44">
          <option value="todas">Toda severidad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
        </Select>
        <button
          type="button"
          onClick={() => window.open('#/monitoreo/reportes/alertas', '_blank')}
          className="ml-auto flex items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-400/5 px-4 py-2 text-sm font-medium text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10"
        >
          <Printer size={16} /> Ver reporte
        </button>
      </div>

      <div className="space-y-3">
        {filtradas.length === 0 && (
          <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
            Sin alertas activas.
          </div>
        )}
        {filtradas.map((a) => {
          const Icono = ICONO[a.tipo];
          const viaje = viajes.items.find((v) => v.id === a.viajeId);
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-line-800 bg-bg-800 p-4">
              <span className={`rounded-lg p-2.5 ${a.severidad === 'alta' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                <Icono size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-card-header font-medium text-ink-100">{NOMBRE_TIPO[a.tipo]}</p>
                  <span className="text-xs text-ink-600">{new Date(a.creadoEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-300">
                  Viaje {viaje?.folio ?? 'N/D'} -- {nombreCliente(a.viajeId)}
                </p>
                <p className="text-xs text-ink-600">{a.detalle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
