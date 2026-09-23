import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularTotalesArticulos, importeLinea } from '../../lib/almacen';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirMovimientoAlmacenPage() {
  const { id } = useParams<{ id: string }>();
  const { movimientosAlmacen, almacenes, tiposMovimientoAlmacen, proveedores, empresa } = useData();

  const movimiento = movimientosAlmacen.items.find((m) => m.id === id);
  const almacen = almacenes.items.find((a) => a.id === movimiento?.almacenId);
  const almacenDestino = almacenes.items.find((a) => a.id === movimiento?.almacenDestinoId);
  const tipo = tiposMovimientoAlmacen.items.find((t) => t.id === movimiento?.tipoMovimientoId);
  const proveedor = proveedores.items.find((p) => p.id === movimiento?.proveedorId);

  useEffect(() => {
    if (!movimiento) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [movimiento]);

  if (!movimiento) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el movimiento.
      </div>
    );
  }

  const totales = calcularTotalesArticulos(movimiento.lineas);

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
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Movimiento de Almacen</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}><strong>Folio:</strong> {movimiento.folio}</p>
          <p style={{ margin: 0 }}><strong>Fecha:</strong> {movimiento.fecha}</p>
          <p style={{ margin: 0 }}><strong>Estatus:</strong> {movimiento.estatus}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Tipo de Movimiento</h2>
          <p style={{ margin: 0 }}>{tipo?.nombre ?? 'N/D'} ({tipo?.naturaleza})</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Almacen</h2>
          <p style={{ margin: 0 }}>{almacen ? `${almacen.codigo} - ${almacen.nombre}` : 'N/D'}</p>
          {almacenDestino && <p style={{ margin: 0, color: '#555' }}>Destino: {almacenDestino.codigo} - {almacenDestino.nombre}</p>}
        </div>
        <div>
          <h2 style={sectionTitle}>Proveedor</h2>
          <p style={{ margin: 0 }}>{proveedor?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>Ref: {movimiento.referencia || '—'}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Articulos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad</th>
              <th style={thStyle}>Codigo</th>
              <th style={thStyle}>Articulo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Precio Unitario</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {movimiento.lineas.map((l) => (
              <tr key={l.id}>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{l.cantidad} {l.unidadMedida}</td>
                <td style={tdStyle}>{l.codigo}</td>
                <td style={tdStyle}>{l.descripcion}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(l.precioUnitario)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(importeLinea(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <div style={{ minWidth: 220 }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Subtotal</span><span>{money(totales.subtotal)}</span></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>IVA 16%</span><span>{money(totales.totalIva)}</span></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 0', fontWeight: 700, fontSize: 15 }}><span>Total</span><span>{money(totales.total)}</span></p>
          </div>
        </div>
      </div>

      {movimiento.observaciones && (
        <div>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{movimiento.observaciones}</p>
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#555', margin: '0 0 4px' };
const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '4px 6px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px' };
