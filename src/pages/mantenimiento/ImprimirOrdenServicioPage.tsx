import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { tiempoRealHoras, totalManoObra } from '../../lib/mantenimiento';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirOrdenServicioPage() {
  const { id } = useParams<{ id: string }>();
  const { ordenesServicio, unidades, proveedores, mecanicos, reportesFalla, empresa } = useData();

  const orden = ordenesServicio.items.find((o) => o.id === id);
  const unidad = unidades.items.find((u) => u.id === orden?.unidadId);
  const proveedor = proveedores.items.find((p) => p.id === orden?.proveedorId);
  const quienRealiza = mecanicos.items.find((m) => m.id === orden?.quienRealizaId);

  useEffect(() => {
    if (!orden) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [orden]);

  if (!orden) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro la orden de servicio.
      </div>
    );
  }

  const mecanicosAsignados = orden.mecanicosIds
    .map((mid) => mecanicos.items.find((m) => m.id === mid)?.nombre)
    .filter(Boolean)
    .join(', ');

  const reportesRelacionados = orden.reporteFallaIds
    .map((rid) => reportesFalla.items.find((r) => r.id === rid)?.folio)
    .filter(Boolean)
    .join(', ');

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif', fontSize: 12 }}>
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
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Orden de Servicio</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Folio:</strong> {orden.folio}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {orden.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong> {orden.estatus}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Unidad</h2>
          <p style={{ margin: 0 }}>{unidad ? `${unidad.economico} - ${unidad.placas}` : '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>Km al momento: {orden.kilometrajeAlMomento.toLocaleString('es-MX')}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Tipo</h2>
          <p style={{ margin: 0 }}>
            {orden.tipo} · {orden.tipoServicio}
          </p>
          {orden.tipo === 'Externo' && <p style={{ margin: 0, color: '#555' }}>Proveedor: {proveedor?.nombre ?? '—'}</p>}
        </div>
        <div>
          <h2 style={sectionTitle}>Lugar / Responsable</h2>
          <p style={{ margin: 0 }}>{orden.lugarReparacion || '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{quienRealiza?.nombre ?? '—'}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Servicios de la Orden</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Codigo</th>
              <th style={thStyle}>Descripcion</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Mano de Obra</th>
              <th style={thStyle}>Inicio</th>
              <th style={thStyle}>Final</th>
              <th style={thStyle}>Tiempo Real</th>
            </tr>
          </thead>
          <tbody>
            {orden.lineas.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  Sin servicios registrados.
                </td>
              </tr>
            )}
            {orden.lineas.map((l) => (
              <tr key={l.id}>
                <td style={tdStyle}>{l.codigo || '-'}</td>
                <td style={tdStyle}>{l.descripcion}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{money(l.manoObra)}</td>
                <td style={tdStyle}>
                  {l.fechaInicio} {l.horaInicio}
                </td>
                <td style={tdStyle}>
                  {l.fechaFinal} {l.horaFinal}
                </td>
                <td style={tdStyle}>{tiempoRealHoras(l)} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign: 'right', margin: '6px 0 0', fontWeight: 700 }}>Total mano de obra: {money(totalManoObra(orden.lineas))}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Mecanicos / Ayudantes</h2>
          <p style={{ margin: 0 }}>{mecanicosAsignados || '—'}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Reportes de Falla Relacionados</h2>
          <p style={{ margin: 0 }}>{reportesRelacionados || '—'}</p>
        </div>
      </div>

      {orden.notas && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={sectionTitle}>Nota</h2>
          <p style={{ margin: 0 }}>{orden.notas}</p>
        </div>
      )}

      {orden.observaciones && (
        <div>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{orden.observaciones}</p>
        </div>
      )}

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: 6, textAlign: 'center' }}>Firma de Quien Realiza</div>
        <div style={{ borderTop: '1px solid #333', paddingTop: 6, textAlign: 'center' }}>Firma de Autorizacion</div>
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
