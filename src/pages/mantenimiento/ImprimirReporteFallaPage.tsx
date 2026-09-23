import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';

export function ImprimirReporteFallaPage() {
  const { id } = useParams<{ id: string }>();
  const { reportesFalla, unidades, operadores, clasificacionesServicio, empresa } = useData();

  const reporte = reportesFalla.items.find((r) => r.id === id);
  const unidad = unidades.items.find((u) => u.id === reporte?.unidadId);
  const operador = operadores.items.find((o) => o.id === reporte?.operadorId);
  const clasificacion = clasificacionesServicio.items.find((c) => c.id === reporte?.clasificacionServicioId);

  useEffect(() => {
    if (!reporte) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [reporte]);

  if (!reporte) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el reporte de falla.
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
            <p style={{ margin: 0, color: '#555' }}>Reporte de Falla</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Folio:</strong> {reporte.folio}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {reporte.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong>{' '}
            <span
              style={{
                color: reporte.estatus === 'Cancelado' ? '#b91c1c' : reporte.estatus === 'Atendido' ? '#047857' : '#b45309',
                fontWeight: 700,
              }}
            >
              {reporte.estatus}
            </span>
          </p>
          {reporte.codigoFalla && (
            <p style={{ margin: 0 }}>
              <strong>Codigo:</strong> {reporte.codigoFalla}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Unidad</h2>
          <p style={{ margin: 0 }}>{unidad ? `${unidad.economico} - ${unidad.placas}` : '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>Sucursal: {reporte.sucursal || '—'}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Operador</h2>
          <p style={{ margin: 0 }}>{operador?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>Clasificacion: {clasificacion?.clasificacion ?? '—'}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Descripcion de la Falla</h2>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reporte.descripcion}</p>
      </div>

      {reporte.documentos.length > 0 && (
        <div>
          <h2 style={sectionTitle}>Documentos Digitalizados</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reporte.documentos.map((d) => (
              <li key={d.id}>{d.descripcion}</li>
            ))}
          </ul>
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
