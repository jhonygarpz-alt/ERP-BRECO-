import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirViajePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conImporteReal = searchParams.get('modo') !== 'cero';
  const { viajes, clientes, unidades, operadores, cajas, empresa } = useData();

  const viaje = viajes.items.find((v) => v.id === id);
  const cliente = clientes.items.find((c) => c.id === viaje?.clienteId);
  const trayectos = viaje?.trayectos.length ? viaje.trayectos : [];
  const primerOperador = operadores.items.find((o) => o.id === (trayectos[0]?.operadorId || viaje?.operadorId));
  const remolque1 = cajas.items.find((c) => c.id === viaje?.remolque1Id);
  const dolly = cajas.items.find((c) => c.id === viaje?.dollyId);
  const remolque2 = cajas.items.find((c) => c.id === viaje?.remolque2Id);
  const totalConceptos = conImporteReal ? (viaje?.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0) ?? 0) : 0;

  useEffect(() => {
    if (!viaje) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [viaje]);

  if (!viaje) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif' }}>
        No se encontro el viaje.
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {empresa.value.logoDataUrl && (
            <img src={empresa.value.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Viaje {viaje.folio}</p>
            {!conImporteReal && <p style={{ margin: 0, color: '#555', fontStyle: 'italic' }}>Copia sin importes</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {viaje.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong> {viaje.estatus}
          </p>
          {viaje.loadNumber && (
            <p style={{ margin: 0 }}>
              <strong>Numero de Viaje del Cliente:</strong> {viaje.loadNumber}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Cliente</h2>
          <p style={{ margin: 0 }}>{cliente?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{cliente?.rfc ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Ruta</h2>
          <p style={{ margin: 0 }}>
            {viaje.rutaCodigo && `${viaje.rutaCodigo} — `}
            {viaje.rutaDescripcion || `${viaje.origen || '—'} → ${viaje.destino || '—'}`}
          </p>
          {viaje.kilometros > 0 && <p style={{ margin: 0, color: '#555' }}>{viaje.kilometros} km</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Operador</h2>
          <p style={{ margin: 0 }}>{primerOperador?.nombre ?? '—'}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Remolque / Dolly</h2>
          <p style={{ margin: 0 }}>{remolque1?.economico ?? '—'}</p>
          {dolly && <p style={{ margin: 0 }}>Dolly: {dolly.economico}</p>}
          {remolque2 && <p style={{ margin: 0 }}>Remolque 2: {remolque2.economico}</p>}
        </div>
        <div>
          <h2 style={sectionTitle}>Carga / Entrega</h2>
          <p style={{ margin: 0 }}>Cargar en: {viaje.cargarEn || '—'}</p>
          <p style={{ margin: 0 }}>Descargar en: {viaje.descargarEn || '—'}</p>
        </div>
      </div>

      {trayectos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Trayectos</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Operador</th>
                <th style={thStyle}>Camion</th>
                <th style={thStyle}>Origen</th>
                <th style={thStyle}>Destino</th>
              </tr>
            </thead>
            <tbody>
              {trayectos.map((t) => (
                <tr key={t.id}>
                  <td style={tdStyle}>{operadores.items.find((o) => o.id === t.operadorId)?.nombre ?? '—'}</td>
                  <td style={tdStyle}>{unidades.items.find((u) => u.id === t.unidadId)?.economico ?? '—'}</td>
                  <td style={tdStyle}>{t.origen}</td>
                  <td style={tdStyle}>{t.destino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viaje.materialesCarga.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Mercancias</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Cantidad</th>
                <th style={thStyle}>Empaque</th>
                <th style={thStyle}>Descripcion</th>
                <th style={thStyle}>Peso</th>
              </tr>
            </thead>
            <tbody>
              {viaje.materialesCarga.map((m) => (
                <tr key={m.id}>
                  <td style={tdStyle}>{m.cantidad}</td>
                  <td style={tdStyle}>{m.unidadEmpaque}</td>
                  <td style={tdStyle}>{m.descripcion}</td>
                  <td style={tdStyle}>
                    {m.peso} {m.unidadPeso}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: 'right', margin: '4px 0 0' }}>
            <strong>Peso total:</strong> {viaje.pesoCargaTotal} {viaje.pesoCargaUnidad}
          </p>
        </div>
      )}

      {viaje.conceptosFacturacionViaje.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Conceptos de Facturacion</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Concepto</th>
                <th style={thStyle}>Unidad de Medida</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {viaje.conceptosFacturacionViaje.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>{c.concepto}</td>
                  <td style={tdStyle}>{c.unidadMedida}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{money(conImporteReal ? c.importe : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: 'right', margin: '4px 0 0' }}>
            <strong>Total:</strong> {money(totalConceptos)}
          </p>
        </div>
      )}

      {viaje.observaciones && (
        <div>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0 }}>{viaje.observaciones}</p>
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
const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '4px 6px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px' };
