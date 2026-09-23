import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { rangoMesActual, type FiltroFechas } from '../../lib/reportesTrafico';
import { estadoCuentaCliente } from '../../lib/cobranza';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ListaSeleccionModal } from '../../components/ui/ListaSeleccionModal';
import { Field, Input, ToolbarButton } from '../../components/ui/form';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function CobranzaEstadosCuentaPage() {
  const { clientes, facturas, pagosCliente, notasCredito } = useData();
  const [clienteId, setClienteId] = useState('');
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoMesActual());

  const cliente = clientes.items.find((c) => c.id === clienteId);

  const resultado = useMemo(() => {
    if (!cliente) return null;
    return estadoCuentaCliente(cliente, facturas.items, pagosCliente.items, notasCredito.items, filtro.desde, filtro.hasta);
  }, [cliente, facturas.items, pagosCliente.items, notasCredito.items, filtro]);

  const movimientos = resultado?.movimientos ?? [];
  const facturasVencidas = movimientos.filter((m) => m.vencida);

  function handleExportarExcel() {
    if (!cliente || !resultado) return;
    exportarExcel(
      `estado-de-cuenta-${cliente.numeroCliente}`,
      ['Fecha', 'Tipo', 'Documento', 'Cargo', 'Abono', 'Saldo', 'Dias Transcurridos', 'Vencimiento', 'Estatus'],
      movimientos.map((m) => [
        m.fecha,
        m.tipo,
        m.documento,
        money(m.cargo),
        money(m.abono),
        money(m.saldo),
        m.tipo === 'Factura' ? String(m.diasTranscurridos ?? 0) : '',
        m.tipo === 'Factura' ? (m.fechaVencimiento ?? '') : '',
        m.tipo === 'Factura' ? (m.vencida ? 'VENCIDA' : 'VIGENTE') : '',
      ]),
    );
  }

  function handleImprimir() {
    if (!cliente) return;
    window.open(`#/cobranza/estados-cuenta/imprimir/${cliente.id}?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Estados de Cuenta por Cliente</h1>
        <p className="mt-1 text-sm text-ink-500">Movimientos de facturas, pagos y notas de credito de un cliente, con saldo corrido.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-6 rounded-2xl border border-line-800 bg-bg-800 p-4">
        <Field label="Cliente">
          <div className="flex items-center gap-2">
            <Input readOnly value={cliente ? `${cliente.numeroCliente} - ${cliente.nombre}` : ''} placeholder="Sin cliente seleccionado" className="max-w-md" />
            <ToolbarButton type="button" onClick={() => setClientePickerOpen(true)}>
              ...
            </ToolbarButton>
          </div>
        </Field>
        {cliente && (
          <div className="text-sm">
            <span className="block text-xs uppercase tracking-wide text-ink-500">Dias de Credito del Cliente</span>
            <span className="text-base font-semibold text-ink-100">{cliente.diasCredito} dias</span>
          </div>
        )}
      </div>

      {!cliente ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
          Selecciona un cliente para ver su estado de cuenta.
        </div>
      ) : (
        <>
          <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

          {facturasVencidas.length > 0 && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {facturasVencidas.length} factura{facturasVencidas.length === 1 ? '' : 's'} vencida{facturasVencidas.length === 1 ? '' : 's'} por un
              total de {money(facturasVencidas.reduce((acc, m) => acc + m.saldo, 0))}.
            </div>
          )}

          {movimientos.length === 0 ? (
            <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
              Sin movimientos en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Documento</th>
                      <th className="px-4 py-3 font-medium">Cargo</th>
                      <th className="px-4 py-3 font-medium">Abono</th>
                      <th className="px-4 py-3 font-medium">Saldo</th>
                      <th className="px-4 py-3 font-medium">Dias de Credito</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                      <th className="px-4 py-3 font-medium">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m, i) => (
                      <tr key={i} className={`border-b border-line-800/70 last:border-0 hover:bg-bg-700/40 ${m.vencida ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-3 text-ink-300">{m.fecha}</td>
                        <td className="px-4 py-3 text-ink-300">{m.tipo}</td>
                        <td className="px-4 py-3 text-ink-300">{m.documento}</td>
                        <td className="px-4 py-3 text-ink-300">{m.cargo > 0 ? money(m.cargo) : '-'}</td>
                        <td className="px-4 py-3 text-ink-300">{m.abono > 0 ? money(m.abono) : '-'}</td>
                        <td className="px-4 py-3 text-ink-300">{money(m.saldo)}</td>
                        <td className="px-4 py-3 text-ink-300">{m.tipo === 'Factura' ? `${m.diasTranscurridos} dias` : '-'}</td>
                        <td className="px-4 py-3 text-ink-300">{m.tipo === 'Factura' ? m.fechaVencimiento : '-'}</td>
                        <td className="px-4 py-3">
                          {m.tipo === 'Factura' ? (
                            <span className={`font-semibold ${m.vencida ? 'text-red-400' : 'text-emerald-400'}`}>
                              {m.vencida ? 'VENCIDA' : 'VIGENTE'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="mt-3 text-right text-base font-semibold text-ink-100">Saldo final: {money(resultado?.saldoFinal ?? 0)}</p>
        </>
      )}

      {clientePickerOpen && (
        <ListaSeleccionModal
          title="Buscar cliente"
          items={clientes.items}
          filtro={(c, t) => !t || c.nombre.toLowerCase().includes(t) || c.numeroCliente.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{c.numeroCliente}</td>
              <td className="px-3 py-2 text-ink-200">{c.nombre}</td>
            </>
          )}
          onSelect={(c) => {
            setClienteId(c.id);
            setClientePickerOpen(false);
          }}
          onClose={() => setClientePickerOpen(false)}
        />
      )}
    </div>
  );
}
