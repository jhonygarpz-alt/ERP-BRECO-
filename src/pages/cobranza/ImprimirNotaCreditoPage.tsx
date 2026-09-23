import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirNotaCreditoPage() {
  const { id } = useParams<{ id: string }>();
  const { notasCredito, clientes, facturas, empresa } = useData();

  const nota = notasCredito.items.find((n) => n.id === id);
  const cliente = clientes.items.find((c) => c.id === nota?.clienteId);

  useEffect(() => {
    if (!nota) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [nota]);

  if (!nota) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro la nota de credito.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif', fontSize: 13 }}>
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
        >
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
        >
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
          {empresa.value.logoDataUrl && (
            <img src={empresa.value.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Nota de Credito</p>
            {empresa.value.razonSocial && <p style={{ margin: 0, color: '#555', fontSize: 11 }}>{empresa.value.razonSocial}</p>}
            {empresa.value.direccion && <p style={{ margin: 0, color: '#555', fontSize: 11 }}>{empresa.value.direccion}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Folio:</strong> {nota.folio}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {nota.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong>{' '}
            <span style={{ color: nota.estatus === 'Cancelada' ? '#b91c1c' : '#047857', fontWeight: 700 }}>{nota.estatus}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Cliente</h2>
          <p style={{ margin: 0 }}>{cliente?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{cliente?.numeroCliente ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Uso del CFDI</h2>
          <p style={{ margin: 0 }}>{nota.usoCfdi}</p>
          <p style={{ margin: 0, color: '#555' }}>Metodo de Pago: {nota.metodoPago}</p>
        </div>
      </div>

      {nota.facturaIds.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Facturas relacionadas</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Documento</th>
              </tr>
            </thead>
            <tbody>
              {nota.facturaIds.map((fid) => {
                const f = facturas.items.find((ff) => ff.id === fid);
                return (
                  <tr key={fid}>
                    <td style={tdStyle}>{f?.folio ?? fid}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Conceptos</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Concepto</th>
              <th style={thStyle}>Unidad Medida</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Importe</th>
              <th style={thStyle}>Traslada</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Importe IVA</th>
            </tr>
          </thead>
          <tbody>
            {nota.lineas.map((l) => (
              <tr key={l.id}>
                <td style={tdStyle}>{l.concepto}</td>
                <td style={tdStyle}>{l.unidadMedida}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(l.importe)}</td>
                <td style={tdStyle}>{l.traslada || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(l.importeIva)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#555' }}>Moneda: {nota.moneda}</p>
          <p style={{ margin: 0, color: '#555' }}>Subtotal: {money(nota.subtotal)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>Total: {money(nota.total)}</p>
        </div>
      </div>

      {nota.observaciones && (
        <div>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0 }}>{nota.observaciones}</p>
        </div>
      )}
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

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #999',
  padding: '4px 6px',
  fontSize: 11,
  textTransform: 'uppercase',
  color: '#555',
};
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px' };
