import { useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Route,
  Receipt,
  CalendarClock,
  Boxes,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  DollarSign,
  Truck,
  CheckCircle2,
  ScanLine,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { inputClass, GhostButton } from '../components/ui/form';
import { ImportarFacturacionModal } from '../components/reportes/ImportarFacturacionModal';
import type { Cliente, Factura, FacturaSistema, Operador, Unidad, Viaje } from '../types';

type Area = 'viajes' | 'facturacion' | 'programa' | 'catalogos';

function isoHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function inicioDeMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function agrupar<T>(items: T[], clave: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const k = clave(item);
    const lista = mapa.get(k);
    if (lista) lista.push(item);
    else mapa.set(k, [item]);
  }
  return mapa;
}

function formatearMoneda(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

const areas: { key: Area; label: string; icon: typeof Route }[] = [
  { key: 'viajes', label: 'Viajes', icon: Route },
  { key: 'facturacion', label: 'Facturacion', icon: Receipt },
  { key: 'programa', label: 'Programa', icon: CalendarClock },
  { key: 'catalogos', label: 'Catalogos', icon: Boxes },
];

function ReportTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-600">Sin datos en este periodo.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line-800">
      <table className="w-full min-w-[480px] text-left text-xs">
        <thead className="bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line-800">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-ink-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeccionReporte({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-100">{title}</h3>
      {children}
    </div>
  );
}

function ReporteViajes({ viajes, clientes, unidades }: { viajes: Viaje[]; clientes: Cliente[]; unidades: Unidad[] }) {
  const clienteNombre = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadEconomico = (id: string) => unidades.find((u) => u.id === id)?.economico ?? 'N/D';

  const porCliente = agrupar(viajes, (v) => v.clienteId);
  const filasCliente = [...porCliente.entries()]
    .map(([clienteId, items]) => ({
      cliente: clienteNombre(clienteId),
      total: items.length,
      imp: items.filter((v) => v.importacion).length,
      exp: items.filter((v) => v.exportacion).length,
    }))
    .sort((a, b) => b.total - a.total);

  const porUnidad = agrupar(viajes, (v) => v.unidadId);
  const filasUnidad = [...porUnidad.entries()]
    .map(([unidadId, items]) => ({ unidad: unidadEconomico(unidadId), total: items.length }))
    .sort((a, b) => b.total - a.total);

  const cancelados = viajes.filter((v) => v.estatus === 'Cancelado').length;
  const entregados = viajes.filter((v) => v.estatus === 'Entregado').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total de viajes" value={String(viajes.length)} icon={Route} accent="blue" />
        <StatCard
          label="Importacion"
          value={String(viajes.filter((v) => v.importacion).length)}
          icon={ArrowDownToLine}
          accent="green"
        />
        <StatCard
          label="Exportacion"
          value={String(viajes.filter((v) => v.exportacion).length)}
          icon={ArrowUpFromLine}
          accent="amber"
        />
        <StatCard label="Cancelados" value={String(cancelados)} icon={Ban} accent="red" />
      </div>
      <SeccionReporte title={`Viajes por cliente (${filasCliente.length})`}>
        <ReportTable
          headers={['Cliente', 'Total', 'Imp', 'Exp']}
          rows={filasCliente.map((f) => [f.cliente, f.total, f.imp, f.exp])}
        />
      </SeccionReporte>
      <SeccionReporte title={`Viajes por unidad (${filasUnidad.length})`}>
        <ReportTable headers={['Unidad', 'Total viajes']} rows={filasUnidad.map((f) => [f.unidad, f.total])} />
      </SeccionReporte>
      <p className="text-xs text-ink-600">Entregados en el periodo: {entregados}</p>
    </div>
  );
}

function ReporteFacturacion({ facturas, clientes }: { facturas: Factura[]; clientes: Cliente[] }) {
  const clienteNombre = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? 'N/D';
  const importeTotal = facturas.reduce((acc, f) => acc + f.importe, 0);
  const pendientes = facturas.filter((f) => f.estatus === 'Pendiente').length;
  const pagadas = facturas.filter((f) => f.estatus === 'Pagado').length;

  const porCliente = agrupar(facturas, (f) => f.clienteId);
  const filasCliente = [...porCliente.entries()]
    .map(([clienteId, items]) => ({
      cliente: clienteNombre(clienteId),
      total: items.length,
      importe: items.reduce((acc, f) => acc + f.importe, 0),
    }))
    .sort((a, b) => b.importe - a.importe);

  const porDia = agrupar(facturas, (f) => f.fecha);
  const filasDia = [...porDia.entries()]
    .map(([fecha, items]) => ({ fecha, total: items.length, importe: items.reduce((acc, f) => acc + f.importe, 0) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total de facturas" value={String(facturas.length)} icon={Receipt} accent="blue" />
        <StatCard label="Importe total" value={formatearMoneda(importeTotal)} icon={DollarSign} accent="green" />
        <StatCard label="Pendientes" value={String(pendientes)} icon={ArrowRightLeft} accent="amber" />
        <StatCard label="Pagadas" value={String(pagadas)} icon={CheckCircle2} accent="green" />
      </div>
      <SeccionReporte title={`Facturacion por cliente (${filasCliente.length})`}>
        <ReportTable
          headers={['Cliente', 'Facturas', 'Importe']}
          rows={filasCliente.map((f) => [f.cliente, f.total, formatearMoneda(f.importe)])}
        />
      </SeccionReporte>
      <SeccionReporte title="Facturacion por dia">
        <ReportTable
          headers={['Fecha', 'Facturas', 'Importe']}
          rows={filasDia.map((f) => [f.fecha, f.total, formatearMoneda(f.importe)])}
        />
      </SeccionReporte>
    </div>
  );
}

function ReporteFacturacionSistema({ registros }: { registros: FacturaSistema[] }) {
  if (registros.length === 0) {
    return (
      <SeccionReporte title="Facturacion por Sistema (importado de Excel/imagen)">
        <p className="py-6 text-center text-sm text-ink-600">
          Todavia no se ha importado nada para este periodo. Usa el boton "Importar" de arriba.
        </p>
      </SeccionReporte>
    );
  }

  const totalTarifa = registros.reduce((acc, r) => acc + r.totalTarifa, 0);
  const totalFactura = registros.reduce((acc, r) => acc + r.totalFactura, 0);

  const porCliente = agrupar(registros, (r) => r.cliente || 'N/D');
  const filasCliente = [...porCliente.entries()]
    .map(([cliente, items]) => ({
      cliente,
      total: items.length,
      totalTarifa: items.reduce((acc, r) => acc + r.totalTarifa, 0),
    }))
    .sort((a, b) => b.totalTarifa - a.totalTarifa);

  const porUnidad = agrupar(registros, (r) => r.economicoTracto || 'N/D');
  const filasUnidad = [...porUnidad.entries()]
    .map(([unidad, items]) => ({ unidad, total: items.length }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Registros importados" value={String(registros.length)} icon={Receipt} accent="blue" />
        <StatCard label="Total Tarifa" value={formatearMoneda(totalTarifa)} icon={DollarSign} accent="green" />
        <StatCard label="Total Factura" value={formatearMoneda(totalFactura)} icon={DollarSign} accent="amber" />
      </div>
      <SeccionReporte title={`Facturacion por Sistema por cliente (${filasCliente.length})`}>
        <ReportTable
          headers={['Cliente', 'Registros', 'Total Tarifa']}
          rows={filasCliente.map((f) => [f.cliente, f.total, formatearMoneda(f.totalTarifa)])}
        />
      </SeccionReporte>
      <SeccionReporte title={`Facturacion por Sistema por unidad (${filasUnidad.length})`}>
        <ReportTable headers={['Unidad', 'Registros']} rows={filasUnidad.map((f) => [f.unidad, f.total])} />
      </SeccionReporte>
    </div>
  );
}

function ReportePrograma({ viajes, totalUnidades }: { viajes: Viaje[]; totalUnidades: number }) {
  const porDia = agrupar(viajes, (v) => v.fecha);
  const dias = [...porDia.keys()].sort();
  const filasDia = dias.map((fecha) => {
    const items = porDia.get(fecha) ?? [];
    return {
      fecha,
      total: items.length,
      transito: items.filter((v) => v.estatus === 'En transito').length,
      entregado: items.filter((v) => v.estatus === 'Entregado').length,
      cancelado: items.filter((v) => v.estatus === 'Cancelado').length,
      unidadesActivas: new Set(items.map((v) => v.unidadId)).size,
    };
  });

  const promedioViajesDia = dias.length ? (viajes.length / dias.length).toFixed(1) : '0';
  const unidadesActivasTotal = new Set(viajes.map((v) => v.unidadId)).size;
  const cobertura = totalUnidades > 0 ? Math.round((unidadesActivasTotal / totalUnidades) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Dias con operacion" value={String(dias.length)} icon={CalendarClock} accent="blue" />
        <StatCard label="Promedio de viajes / dia" value={promedioViajesDia} icon={BarChart3} accent="green" />
        <StatCard label="Unidades activas en el periodo" value={String(unidadesActivasTotal)} icon={Truck} accent="amber" />
        <StatCard label="Cobertura de flota" value={`${cobertura}%`} icon={Truck} accent="red" hint={`de ${totalUnidades} unidades`} />
      </div>
      <SeccionReporte title="Operacion por dia">
        <ReportTable
          headers={['Fecha', 'Viajes', 'En transito', 'Entregados', 'Cancelados', 'Unidades activas']}
          rows={filasDia.map((f) => [f.fecha, f.total, f.transito, f.entregado, f.cancelado, f.unidadesActivas])}
        />
      </SeccionReporte>
    </div>
  );
}

function ReporteCatalogos({
  viajes,
  unidades,
  operadores,
}: {
  viajes: Viaje[];
  unidades: Unidad[];
  operadores: Operador[];
}) {
  const viajesPorUnidad = agrupar(viajes, (v) => v.unidadId);
  const filasUnidades = unidades
    .map((u) => ({ economico: u.economico, estatus: u.estatus, total: viajesPorUnidad.get(u.id)?.length ?? 0 }))
    .sort((a, b) => b.total - a.total);

  const viajesPorOperador = agrupar(viajes, (v) => v.operadorId);
  const filasOperadores = operadores
    .map((o) => ({ nombre: o.nombre, estatus: o.estatus, total: viajesPorOperador.get(o.id)?.length ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <SeccionReporte title="Utilizacion de unidades">
        <ReportTable
          headers={['Unidad', 'Estatus actual', 'Viajes en el periodo']}
          rows={filasUnidades.map((f) => [f.economico, f.estatus, f.total])}
        />
      </SeccionReporte>
      <SeccionReporte title="Actividad de operadores">
        <ReportTable
          headers={['Operador', 'Estatus actual', 'Viajes en el periodo']}
          rows={filasOperadores.map((f) => [f.nombre, f.estatus, f.total])}
        />
      </SeccionReporte>
    </div>
  );
}

export function ReportesOperativosPage() {
  const { viajes, facturas, facturasSistema, clientes, unidades, operadores } = useData();
  const { hasPermission } = useAuth();
  const puedeImportar = hasPermission('Reportes', 'crear');
  const [area, setArea] = useState<Area>('viajes');
  const [desde, setDesde] = useState(sumarDias(isoHoy(), -6));
  const [hasta, setHasta] = useState(isoHoy());
  const [importarOpen, setImportarOpen] = useState(false);

  const viajesRango = useMemo(
    () => viajes.items.filter((v) => v.fecha >= desde && v.fecha <= hasta),
    [viajes.items, desde, hasta],
  );
  const facturasRango = useMemo(
    () => facturas.items.filter((f) => f.fecha >= desde && f.fecha <= hasta),
    [facturas.items, desde, hasta],
  );
  const facturasSistemaRango = useMemo(
    () => facturasSistema.items.filter((f) => f.fechaOrigen >= desde && f.fechaOrigen <= hasta),
    [facturasSistema.items, desde, hasta],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Reportes Operativos</h1>
        <p className="mt-1 text-sm text-ink-500">
          Consulta el estatus operativo de cualquier periodo, por area.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line-800 bg-bg-800 p-4">
        <div>
          <label className="mb-1 block text-xs text-ink-500">Desde</label>
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className={`${inputClass} w-40`} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-500">Hasta</label>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={`${inputClass} w-40`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton
            type="button"
            onClick={() => {
              setDesde(isoHoy());
              setHasta(isoHoy());
            }}
          >
            Hoy
          </GhostButton>
          <GhostButton
            type="button"
            onClick={() => {
              setDesde(sumarDias(isoHoy(), -6));
              setHasta(isoHoy());
            }}
          >
            Ultimos 7 dias
          </GhostButton>
          <GhostButton
            type="button"
            onClick={() => {
              setDesde(sumarDias(isoHoy(), -29));
              setHasta(isoHoy());
            }}
          >
            Ultimos 30 dias
          </GhostButton>
          <GhostButton
            type="button"
            onClick={() => {
              setDesde(inicioDeMes());
              setHasta(isoHoy());
            }}
          >
            Este mes
          </GhostButton>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {areas.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setArea(key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
                area === key
                  ? 'border-breco-500/50 bg-breco-500/10 font-semibold text-white'
                  : 'border-line-800 bg-bg-800 text-ink-400 hover:text-ink-100'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        {area === 'facturacion' && puedeImportar && (
          <GhostButton type="button" onClick={() => setImportarOpen(true)}>
            <ScanLine size={16} />
            Importar Excel o Imagen
          </GhostButton>
        )}
      </div>

      {area === 'viajes' && <ReporteViajes viajes={viajesRango} clientes={clientes.items} unidades={unidades.items} />}
      {area === 'facturacion' && (
        <div className="space-y-8">
          <ReporteFacturacion facturas={facturasRango} clientes={clientes.items} />
          <ReporteFacturacionSistema registros={facturasSistemaRango} />
        </div>
      )}
      {area === 'programa' && <ReportePrograma viajes={viajesRango} totalUnidades={unidades.items.length} />}
      {area === 'catalogos' && (
        <ReporteCatalogos viajes={viajesRango} unidades={unidades.items} operadores={operadores.items} />
      )}

      {importarOpen && (
        <ImportarFacturacionModal onClose={() => setImportarOpen(false)} onImportado={() => facturasSistema.reload()} />
      )}
    </div>
  );
}
