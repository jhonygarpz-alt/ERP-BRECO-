import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';

export function ImprimirChecklistFisicomecanicoPage() {
  const { id } = useParams<{ id: string }>();
  const { checklistsFisicomecanicos, unidades, operadores, empresa } = useData();

  const checklist = checklistsFisicomecanicos.items.find((c) => c.id === id);
  const unidad = unidades.items.find((u) => u.id === checklist?.unidadId);
  const operador = operadores.items.find((o) => o.id === checklist?.operadorId);

  useEffect(() => {
    if (!checklist) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [checklist]);

  if (!checklist) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el checklist.
      </div>
    );
  }

  const secciones: string[] = [];
  checklist.items.forEach((i) => {
    if (!secciones.includes(i.seccion)) secciones.push(i.seccion);
  });

  const completados = checklist.items.filter((i) => i.completado).length;

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
            <p style={{ margin: 0, color: '#555' }}>Checklist Fisicomecanico Rapido</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Folio:</strong> {checklist.folio}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {checklist.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Resultado:</strong> {completados} de {checklist.items.length} puntos revisados
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Unidad</h2>
          <p style={{ margin: 0 }}>
            {unidad ? `${unidad.economico} - ${unidad.placas}` : '—'}
          </p>
        </div>
        <div>
          <h2 style={sectionTitle}>Operador</h2>
          <p style={{ margin: 0 }}>{operador?.nombre ?? '—'}</p>
        </div>
      </div>

      {secciones.map((seccion) => (
        <div key={seccion} style={{ marginBottom: 14 }}>
          <h2 style={{ ...sectionTitle, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>{seccion}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 28 }}>OK</th>
                <th style={thStyle}>Punto de revision</th>
                <th style={thStyle}>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {checklist.items
                .filter((i) => i.seccion === seccion)
                .map((i) => (
                  <tr key={i.id}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          border: '1.5px solid #333',
                          background: i.completado ? '#333' : 'transparent',
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <strong>{i.concepto}</strong>
                      <br />
                      <span style={{ color: '#666', fontSize: 11 }}>{i.descripcion}</span>
                    </td>
                    <td style={tdStyle}>{i.observaciones || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      {checklist.observacionesGenerales && (
        <div style={{ marginTop: 16 }}>
          <h2 style={sectionTitle}>Observaciones Generales</h2>
          <p style={{ margin: 0 }}>{checklist.observacionesGenerales}</p>
        </div>
      )}

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: 6, textAlign: 'center' }}>Firma del Operador</div>
        <div style={{ borderTop: '1px solid #333', paddingTop: 6, textAlign: 'center' }}>Firma de Quien Revisa</div>
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
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px', verticalAlign: 'top' };
