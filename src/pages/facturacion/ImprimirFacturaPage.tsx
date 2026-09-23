import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularTotalesFactura } from '../../lib/facturacion';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirFacturaPage() {
  const { id } = useParams<{ id: string }>();
  const { facturas, clientes, viajes, empresa } = useData();

  const factura = facturas.items.find((f) => f.id === id);
  const cliente = clientes.items.find((c) => c.id === factura?.clienteId);
  const viajesIncluidos = (factura?.viajeIds ?? []).map((vid) => viajes.items.find((v) => v.id === vid)).filter(Boolean);
  const totales = factura ? calcularTotalesFactura(factura.lineas) : null;

  useEffect(() => {
    if (!factura) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [factura]);

  if (!factura) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro la factura.
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
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Sistema de Trafico'}</h1>
            {empresa.value.rfc && <p style={{ margin: 0, color: '#555' }}>RFC: {empresa.value.rfc}</p>}
            {empresa.value.direccion && <p style={{ margin: 0, color: '#555' }}>{empresa.value.direccion}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Factura {factura.folio}</h2>
          <p style={{ margin: 0, color: '#555' }}>Fecha: {factura.fecha}</p>
          <p style={{ margin: 0, color: '#555' }}>Estatus: {factura.estatus}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Cliente</h2>
          <p style={{ margin: 0 }}>{cliente?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{cliente?.rfc ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Condiciones</h2>
          <p style={{ margin: 0 }}>
            {factura.condicionesPago} &middot; {factura.metodoPago} &middot; Uso CFDI {factura.usoCfdi}
          </p>
          <p style={{ margin: 0, color: '#555' }}>Moneda: {factura.moneda === 'MXN' ? 'PESOS' : 'DOLARES'}</p>
        </div>
      </div>

      {viajesIncluidos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Viajes incluidos</h2>
          <p style={{ margin: 0 }}>{viajesIncluidos.map((v) => v!.folio).join(', ')}</p>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>Cantidad</th>
            <th style={th}>Concepto</th>
            <th style={{ ...th, textAlign: 'right' }}>Precio Unitario</th>
            <th style={{ ...th, textAlign: 'right' }}>Importe</th>
            <th style={{ ...th, textAlign: 'right' }}>IVA</th>
          </tr>
        </thead>
        <tbody>
          {factura.lineas.map((l) => (
            <tr key={l.id}>
              <td style={td}>{l.cantidad}</td>
              <td style={td}>{l.concepto}</td>
              <td style={{ ...td, textAlign: 'right' }}>{money(l.precioUnitario)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{money(l.importe)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{money(l.importeIva)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totales && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 260 }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Subtotal</span> <span>{money(totales.subtotal)}</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Descuento</span> <span>{money(totales.descuentoTotal)}</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>IVA</span> <span>{money(totales.totalIva)}</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Retenciones</span> <span>-{money(totales.totalRetenciones)}</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 0', fontSize: 16, fontWeight: 700, borderTop: '1px solid #111', paddingTop: 4 }}>
              <span>Total</span> <span>{money(totales.total)}</span>
            </p>
          </div>
        </div>
      )}

      {factura.observaciones && (
        <div style={{ marginTop: 16 }}>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0 }}>{factura.observaciones}</p>
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#555', margin: '0 0 4px' };
const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };
