import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { estadoCuentaCliente } from '../../lib/cobranza';
import { rangoUltimosDias } from '../../lib/reportesTrafico';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };

export function ImprimirEstadoCuentaPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const [searchParams] = useSearchParams();
  const { clientes, facturas, pagosCliente, notasCredito, empresa } = useData();

  const cliente = clientes.items.find((c) => c.id === clienteId);
  const desde = searchParams.get('desde') || rangoUltimosDias(30).desde;
  const hasta = searchParams.get('hasta') || rangoUltimosDias(30).hasta;

  const resultado = useMemo(
    () => (cliente ? estadoCuentaCliente(cliente, facturas.items, pagosCliente.items, notasCredito.items, desde, hasta) : null),
    [cliente, facturas.items, pagosCliente.items, notasCredito.items, desde, hasta],
  );

  useEffect(() => {
    if (!cliente) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [cliente]);

  if (!cliente) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el cliente.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif', fontSize: 13 }}>
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Imprimir
        </button>
        <button onClick={() => window.close()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Sistema de Trafico'}</h1>
            {empresa.value.rfc && <p style={{ margin: 0, color: '#555' }}>RFC: {empresa.value.rfc}</p>}
            {empresa.value.direccion && <p style={{ margin: 0, color: '#555' }}>{empresa.value.direccion}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Estado de Cuenta</h2>
          <p style={{ margin: 0, color: '#555' }}>
            {cliente.nombre} ({cliente.numeroCliente})
          </p>
          <p style={{ margin: 0, color: '#555' }}>
            Del {desde} al {hasta}
          </p>
          <p style={{ margin: 0, color: '#555' }}>Dias de Credito del Cliente: {cliente.diasCredito}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Fecha', 'Tipo', 'Documento', 'Cargo', 'Abono', 'Saldo', 'Dias de Credito', 'Vencimiento', 'Estatus'].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(resultado?.movimientos.length ?? 0) === 0 ? (
            <tr>
              <td style={td} colSpan={9}>
                Sin movimientos en el rango de fechas seleccionado.
              </td>
            </tr>
          ) : (
            resultado?.movimientos.map((m, i) => (
              <tr key={i} style={m.vencida ? { background: '#fef2f2' } : undefined}>
                <td style={td}>{m.fecha}</td>
                <td style={td}>{m.tipo}</td>
                <td style={td}>{m.documento}</td>
                <td style={td}>{m.cargo > 0 ? money(m.cargo) : '-'}</td>
                <td style={td}>{m.abono > 0 ? money(m.abono) : '-'}</td>
                <td style={td}>{money(m.saldo)}</td>
                <td style={td}>{m.tipo === 'Factura' ? `${m.diasTranscurridos} dias` : '-'}</td>
                <td style={td}>{m.tipo === 'Factura' ? m.fechaVencimiento : '-'}</td>
                <td style={{ ...td, color: m.vencida ? '#b91c1c' : m.tipo === 'Factura' ? '#047857' : '#111', fontWeight: m.tipo === 'Factura' ? 700 : 400 }}>
                  {m.tipo === 'Factura' ? (m.vencida ? 'VENCIDA' : 'VIGENTE') : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p style={{ textAlign: 'right', margin: '8px 0 0', fontWeight: 700, fontSize: 15 }}>Saldo final: {money(resultado?.saldoFinal ?? 0)}</p>
    </div>
  );
}
