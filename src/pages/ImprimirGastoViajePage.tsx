import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirGastoViajePage() {
  const { id } = useParams<{ id: string }>();
  const { gastosViaje, viajes, clientes, operadores, proveedores, empresa } = useData();

  const gasto = gastosViaje.items.find((g) => g.id === id);
  const viaje = viajes.items.find((v) => v.id === gasto?.viajeId);
  const cliente = clientes.items.find((c) => c.id === viaje?.clienteId);
  const operador = operadores.items.find((o) => o.id === gasto?.operadorId);
  const proveedor = proveedores.items.find((p) => p.id === gasto?.proveedorId);

  useEffect(() => {
    if (!gasto) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [gasto]);

  if (!gasto) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el gasto.
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
            <p style={{ margin: 0, color: '#555' }}>Gasto de Viaje</p>
            {empresa.value.razonSocial && <p style={{ margin: 0, color: '#555', fontSize: 11 }}>{empresa.value.razonSocial}</p>}
            {empresa.value.direccion && <p style={{ margin: 0, color: '#555', fontSize: 11 }}>{empresa.value.direccion}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {gasto.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong>{' '}
            <span style={{ color: gasto.estatus === 'Cancelado' ? '#b91c1c' : '#047857', fontWeight: 700 }}>{gasto.estatus}</span>
          </p>
          {gasto.numeroReferencia && (
            <p style={{ margin: 0 }}>
              <strong>Referencia:</strong> {gasto.numeroReferencia}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Viaje</h2>
          <p style={{ margin: 0 }}>{viaje?.folio ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{cliente?.nombre ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Operador</h2>
          <p style={{ margin: 0 }}>{operador?.nombre ?? '—'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Tipo de gasto</h2>
          <p style={{ margin: 0 }}>{gasto.tipo}</p>
          <p style={{ margin: 0, color: '#555' }}>{gasto.concepto}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Proveedor</h2>
          <p style={{ margin: 0 }}>{proveedor?.nombre ?? '—'}</p>
        </div>
      </div>

      {gasto.tipo === 'Combustible' && (gasto.litros || gasto.precioLitro) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Detalle de combustible</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Combustible</th>
                <th style={thStyle}>Litros</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Precio / litro</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>{gasto.combustibleTipo ?? '—'}</td>
                <td style={tdStyle}>{gasto.litros ?? 0}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(gasto.precioLitro ?? 0)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(gasto.monto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#555' }}>Moneda: {gasto.moneda}</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>Total: {money(gasto.monto)}</p>
          {gasto.generaPasivo && <p style={{ margin: 0, color: '#555' }}>Genera pasivo en Cuentas por Pagar</p>}
        </div>
      </div>

      {gasto.notas && (
        <div>
          <h2 style={sectionTitle}>Notas</h2>
          <p style={{ margin: 0 }}>{gasto.notas}</p>
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
