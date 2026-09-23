import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, FileWarning, HelpCircle, Link2, RefreshCw, Save, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { hoyISO } from '../../lib/fechas';
import { autoMatchConciliacion, nuevaConciliacionId, resumenConciliacion, saldoCuenta } from '../../lib/banco';
import { descargarPlantillaConciliacion, leerMovimientosBancoExcel } from '../../lib/bancoImport';
import type { EstatusLineaConciliacion, LineaConciliacion, MovimientoBancario } from '../../types';
import { Field, GhostButton, Input, PrimaryButton, Select, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { ListaSeleccionModal } from '../../components/ui/ListaSeleccionModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const TABS: { key: 'Todos' | EstatusLineaConciliacion; label: string }[] = [
  { key: 'Todos', label: 'Movimientos del Banco' },
  { key: 'Conciliado', label: 'Conciliados' },
  { key: 'Pendiente', label: 'Pendientes' },
  { key: 'Sin coincidencia', label: 'Sin coincidencia' },
];

export function ConciliacionesPage() {
  const { cuentasBancarias, movimientosBancarios, conciliacionesBancarias } = useData();
  const cuentasActivas = cuentasBancarias.items.filter((c) => c.activa);

  const [cuentaId, setCuentaId] = useState(cuentasActivas[0]?.id ?? '');
  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [archivoNombre, setArchivoNombre] = useState('');
  const [lineas, setLineas] = useState<LineaConciliacion[]>([]);
  const [tab, setTab] = useState<'Todos' | EstatusLineaConciliacion>('Todos');
  const [autoOn, setAutoOn] = useState(true);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [vincularLinea, setVincularLinea] = useState<LineaConciliacion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ultimaConciliacion = conciliacionesBancarias.items
    .filter((c) => c.cuentaBancariaId === cuentaId)
    .slice()
    .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''))[0];

  const resumen = resumenConciliacion(lineas);
  const saldoSistema = cuentaId ? saldoCuenta(cuentaId, movimientosBancarios.items) : 0;

  const movimientosDisponibles = useMemo(
    () => movimientosBancarios.items.filter((m) => m.cuentaBancariaId === cuentaId && m.estatus === 'Activo'),
    [movimientosBancarios.items, cuentaId],
  );

  function movimientoDe(linea: LineaConciliacion): MovimientoBancario | undefined {
    return movimientosBancarios.items.find((m) => m.id === linea.movimientoBancarioId);
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !cuentaId) return;
    setError('');
    setGuardado(false);
    try {
      const { filas } = await leerMovimientosBancoExcel(file);
      const validas = filas.filter((f) => f.errores.length === 0);
      if (validas.length === 0) {
        setError('El archivo no tiene filas validas. Usa la plantilla descargable sin modificar los encabezados.');
        return;
      }
      const importadas = validas.map((f) => ({
        fecha: f.item.fecha,
        descripcion: f.item.descripcion,
        referencia: f.item.referencia,
        importe: f.item.importe,
        tipo: f.item.tipo,
      }));
      setLineas(autoMatchConciliacion(importadas, movimientosBancarios.items, cuentaId));
      setArchivoNombre(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    }
  }

  function ejecutarConciliacion() {
    if (!cuentaId || lineas.length === 0) return;
    const pendientesRaw = lineas
      .filter((l) => l.estatus !== 'Conciliado')
      .map((l) => ({ fecha: l.fecha, descripcion: l.descripcion, referencia: l.referencia, importe: l.importe, tipo: l.tipo }));
    const reMatched = autoMatchConciliacion(pendientesRaw, movimientosBancarios.items, cuentaId);
    let i = 0;
    setLineas((actuales) => actuales.map((l) => (l.estatus === 'Conciliado' ? l : reMatched[i++])));
  }

  function vincularManualmente(linea: LineaConciliacion, movimiento: MovimientoBancario) {
    setLineas((actuales) =>
      actuales.map((l) => (l.id === linea.id ? { ...l, movimientoBancarioId: movimiento.id, estatus: 'Conciliado' } : l)),
    );
    setVincularLinea(null);
  }

  function marcarSinCoincidencia(linea: LineaConciliacion) {
    setLineas((actuales) =>
      actuales.map((l) => (l.id === linea.id ? { ...l, movimientoBancarioId: undefined, estatus: 'Sin coincidencia' } : l)),
    );
  }

  function guardarConciliacion() {
    if (!cuentaId || lineas.length === 0) return;
    conciliacionesBancarias.add({
      id: nuevaConciliacionId(),
      cuentaBancariaId: cuentaId,
      desde,
      hasta,
      archivoNombre,
      saldoFinalBanco: saldoSistema,
      lineas,
    });
    lineas
      .filter((l) => l.estatus === 'Conciliado' && l.movimientoBancarioId)
      .forEach((l) => movimientosBancarios.update(l.movimientoBancarioId as string, { conciliado: true }));
    setGuardado(true);
  }

  const filtradas = tab === 'Todos' ? lineas : lineas.filter((l) => l.estatus === tab);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Conciliacion Bancaria</h1>
        <p className="mt-1 text-sm text-ink-500">Sube los movimientos de tu banco y emparejalos contra los Movimientos Bancarios del sistema.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 rounded-2xl border border-line-800 bg-bg-800 p-4 sm:grid-cols-3">
        <Field label="Cuenta Bancaria">
          <Select
            value={cuentaId}
            onChange={(e) => {
              setCuentaId(e.target.value);
              setLineas([]);
              setGuardado(false);
            }}
          >
            {cuentasActivas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco} - {c.numero}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Desde">
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </Field>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-3">
        <ToolbarButton type="button" onClick={() => inputRef.current?.click()} disabled={!cuentaId}>
          <Upload size={16} /> {archivoNombre || 'Cargar archivo de movimientos del banco'}
        </ToolbarButton>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleArchivo} />
        <GhostButton type="button" onClick={descargarPlantillaConciliacion}>
          <Download size={16} /> Descargar plantilla
        </GhostButton>
        <span className="ml-auto text-xs text-ink-600">Formatos soportados: .xlsx, .xls, .csv (usando la plantilla)</span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

      {lineas.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-line-800 bg-bg-800 p-3">
              <div className="text-xs text-ink-500">Movimientos en banco</div>
              <p className="mt-1 text-lg font-bold text-ink-100">{lineas.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 size={14} /> Conciliados
              </div>
              <p className="mt-1 text-lg font-bold text-ink-100">
                {resumen.conciliados} <span className="text-xs font-normal text-ink-500">({money(resumen.montoConciliado)})</span>
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Clock size={14} /> Pendientes
              </div>
              <p className="mt-1 text-lg font-bold text-ink-100">{resumen.pendientes}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <FileWarning size={14} /> Sin coincidencia
              </div>
              <p className="mt-1 text-lg font-bold text-ink-100">{resumen.sinCoincidencia}</p>
            </div>
            <div className="rounded-xl border border-line-800 bg-bg-800 p-3">
              <div className="text-xs text-ink-500">Saldo actual del sistema</div>
              <p className="mt-1 text-lg font-bold text-ink-100">{money(saldoSistema)}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  tab === t.key ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-500 hover:border-line-600'
                }`}
              >
                {t.label} ({t.key === 'Todos' ? lineas.length : lineas.filter((l) => l.estatus === t.key).length})
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Descripcion</th>
                    <th className="px-4 py-3 font-medium">Referencia</th>
                    <th className="px-4 py-3 font-medium">Importe</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Coincidencia en Sistema</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-ink-600">
                        Sin movimientos en este filtro.
                      </td>
                    </tr>
                  )}
                  {filtradas.map((l) => {
                    const match = movimientoDe(l);
                    return (
                      <tr key={l.id} className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40">
                        <td className="px-4 py-3 text-ink-300">{l.fecha}</td>
                        <td className="px-4 py-3 text-ink-300">{l.descripcion || '-'}</td>
                        <td className="px-4 py-3 text-ink-300">{l.referencia || '-'}</td>
                        <td className={`px-4 py-3 font-semibold ${l.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>{money(l.importe)}</td>
                        <td className="px-4 py-3 text-ink-300">{l.tipo}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={l.estatus}
                            tone={l.estatus === 'Conciliado' ? 'green' : l.estatus === 'Pendiente' ? 'amber' : 'red'}
                          />
                        </td>
                        <td className="px-4 py-3 text-ink-300">{match ? `${match.concepto} · ${match.beneficiario || match.referencia}` : '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {l.estatus !== 'Conciliado' && (
                              <button
                                type="button"
                                onClick={() => setVincularLinea(l)}
                                title="Vincular manualmente"
                                className="rounded-lg p-2 text-ink-500 hover:bg-bg-700 hover:text-breco-500"
                              >
                                <Link2 size={15} />
                              </button>
                            )}
                            {l.estatus === 'Pendiente' && (
                              <button
                                type="button"
                                onClick={() => marcarSinCoincidencia(l)}
                                title="Marcar sin coincidencia"
                                className="rounded-lg p-2 text-ink-500 hover:bg-bg-700 hover:text-red-400"
                              >
                                <HelpCircle size={15} />
                              </button>
                            )}
                            {match && (
                              <span title={`Ver movimiento ${match.concepto}`} className="rounded-lg p-2 text-ink-600">
                                <Eye size={15} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-800 bg-bg-900 p-3">
            <label className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} className="h-4 w-4 accent-breco-500" />
              Conciliacion automatica por importe y fecha (tolerancia de 3 dias)
            </label>
            <div className="flex items-center gap-2">
              <GhostButton type="button" onClick={ejecutarConciliacion} disabled={!autoOn}>
                <RefreshCw size={15} /> Ejecutar conciliacion
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarConciliacion}>
                <Save size={15} /> Guardar conciliacion
              </PrimaryButton>
            </div>
          </div>

          {guardado && (
            <p className="mt-2 text-right text-sm text-emerald-400">Conciliacion guardada. Los movimientos conciliados ya quedaron marcados.</p>
          )}
        </>
      )}

      {ultimaConciliacion && (
        <p className="mt-4 text-right text-xs text-ink-600">
          Ultima conciliacion guardada de esta cuenta: {ultimaConciliacion.creadoEn?.slice(0, 10) ?? '-'} ({ultimaConciliacion.lineas.length}{' '}
          movimientos)
        </p>
      )}

      {vincularLinea && (
        <ListaSeleccionModal
          title={`Vincular "${vincularLinea.descripcion || vincularLinea.referencia}" con un movimiento del sistema`}
          items={movimientosDisponibles.filter((m) => m.tipo === vincularLinea.tipo)}
          filtro={(m, t) => !t || m.concepto.toLowerCase().includes(t) || m.beneficiario.toLowerCase().includes(t) || m.referencia.toLowerCase().includes(t)}
          renderRow={(m) => (
            <>
              <td className="px-3 py-2 text-xs text-ink-500">{m.fecha}</td>
              <td className="px-3 py-2 text-ink-200">
                {m.concepto} · {m.beneficiario || m.referencia || '-'}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-ink-100">{money(m.importe)}</td>
            </>
          )}
          onSelect={(m) => vincularManualmente(vincularLinea, m)}
          onClose={() => setVincularLinea(null)}
        />
      )}
    </div>
  );
}
