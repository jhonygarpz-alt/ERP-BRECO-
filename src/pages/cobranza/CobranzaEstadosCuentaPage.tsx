import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { rangoMesActual, type FiltroFechas } from '../../lib/reportesTrafico';
import { estadoCuentaCliente } from '../../lib/cobranza';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';
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

  function handleExportarExcel() {
    if (!cliente || !resultado) return;
    exportarExcel(
      `estado-de-cuenta-${cliente.numeroCliente}`,
      ['Fecha', 'Tipo', 'Documento', 'Cargo', 'Abono', 'Saldo'],
      resultado.movimientos.map((m) => [m.fecha, m.tipo, m.documento, money(m.cargo), money(m.abono), money(m.saldo)]),
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

      <div className="mb-4 rounded-2xl border border-line-800 bg-bg-800 p-4">
        <Field label="Cliente">
          <div className="flex items-center gap-2">
            <Input readOnly value={cliente ? `${cliente.numeroCliente} - ${cliente.nombre}` : ''} placeholder="Sin cliente seleccionado" className="max-w-md" />
            <ToolbarButton type="button" onClick={() => setClientePickerOpen(true)}>
              ...
            </ToolbarButton>
          </div>
        </Field>
      </div>

      {!cliente ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 py-12 text-center text-sm text-ink-600">
          Selecciona un cliente para ver su estado de cuenta.
        </div>
      ) : (
        <>
          <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

          <ReporteTabla
            headers={['Fecha', 'Tipo', 'Documento', 'Cargo', 'Abono', 'Saldo']}
            rows={(resultado?.movimientos ?? []).map((m) => [
              m.fecha,
              m.tipo,
              m.documento,
              m.cargo > 0 ? money(m.cargo) : '-',
              m.abono > 0 ? money(m.abono) : '-',
              money(m.saldo),
            ])}
          />
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
