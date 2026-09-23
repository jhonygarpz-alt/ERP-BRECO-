import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirPagoProveedorPage() {
  const { id } = useParams<{ id: string }>();
  const { pagosProveedor, proveedores, gastosViaje, cuentasBancarias, empresa } = useData();

  const pago = pagosProveedor.items.find((p) => p.id === id);
  const proveedor = proveedores.items.find((p) => p.id === pago?.proveedorId);
  const cuenta = cuentasBancarias.items.find((c) => c.id === pago?.cuentaBancariaId);

  useEffect(() => {
    if (!pago) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [pago]);

  if (!pago) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el pago.
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #111',
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Pago a Proveedor</p>
            {empresa.value.razonSocial && <p style={{ margin: 0, color: '#555', fontSize: 11 }}>{empresa.value.razonSocial}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Folio:</strong> {pago.folio}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {pago.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong>{' '}
            <span style={{ color: pago.estatus === 'Cancelado' ? '#b91c1c' : '#047857', fontWeight: 700 }}>{pago.estatus}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Proveedor</h2>
          <p style={{ margin: 0 }}>{proveedor?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{proveedor?.numero ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Pagado desde</h2>
          <p style={{ margin: 0 }}>{cuenta ? `${cuenta.banco} - ${cuenta.numero}` : '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>
            {pago.formaPago} {pago.referencia ? `· Ref. ${pago.referencia}` : ''}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Gastos liquidados</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Concepto</th>
              <th style={thStyle}>Fecha</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Importe Aplicado</th>
            </tr>
          </thead>
          <tbody>
            {pago.aplicaciones.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={3}>
                  Sin gastos aplicados.
                </td>
              </tr>
            )}
            {pago.aplicaciones.map((a) => {
              const g = gastosViaje.items.find((gg) => gg.id === a.gastoId);
              return (
                <tr key={a.gastoId}>
                  <td style={tdStyle}>{g?.concepto ?? a.gastoId}</td>
                  <td style={tdStyle}>{g?.fecha ?? '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{money(a.importe)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Total Pagado: {money(pago.importe)}</p>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#555',
  margin: '0 0 4px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #999',
  padding: '4px 6px',
  fontSize: 11,
  textTransform: 'uppercase',
  color: '#555',
};
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px' };
