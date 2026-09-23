import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularReporteAlertas, calcularReporteIncidencias } from '../../lib/monitoreoReportes';
import { rangoUltimosDias, type FiltroFechas } from '../../lib/reportesTrafico';

const TITULOS: Record<string, string> = {
  incidencias: 'Incidencias por Periodo',
  alertas: 'Historial de Alertas',
};

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };

export function ImprimirReporteMonitoreoPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const { viajes, rutas, viajeUbicaciones, incidenciasViaje, empresa } = useData();

  const filtro: FiltroFechas = {
    desde: searchParams.get('desde') || rangoUltimosDias(30).desde,
    hasta: searchParams.get('hasta') || rangoUltimosDias(30).hasta,
  };

  const { headers, rows, notaTotal } = useMemo(() => {
    if (tipo === 'incidencias') {
      const filas = calcularReporteIncidencias(incidenciasViaje.items, viajes.items, filtro);
      return {
        headers: ['Folio', 'Fecha', 'Tipo', 'Descripcion', 'Severidad', 'Estatus'],
        rows: filas.map((f) => [f.folio, f.fecha, f.tipo, f.descripcion, f.severidad, f.estatus]),
        notaTotal: `${filas.length} incidencias en el periodo.`,
      };
    }
    if (tipo === 'alertas') {
      const filas = calcularReporteAlertas(viajes.items, rutas.items, viajeUbicaciones.items, filtro, new Date());
      return {
        headers: ['Folio', 'Fecha', 'Tipo', 'Mensaje', 'Detalle'],
        rows: filas.map((f) => [f.folio, f.fecha, f.tipo, f.mensaje, f.detalle]),
        notaTotal: `${filas.length} alertas en el periodo.`,
      };
    }
    return { headers: [], rows: [] as string[][], notaTotal: '' };
  }, [tipo, incidenciasViaje.items, viajes.items, rutas.items, viajeUbicaciones.items, filtro.desde, filtro.hasta]);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [tipo]);

  const titulo = (tipo && TITULOS[tipo]) || 'Reporte';

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
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{titulo}</h2>
          <p style={{ margin: 0, color: '#555' }}>
            Del {filtro.desde} al {filtro.hasta}
          </p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={td} colSpan={headers.length || 1}>
                Sin datos en el rango de fechas seleccionado.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {notaTotal && <p style={{ textAlign: 'right', margin: '8px 0 0', fontWeight: 600 }}>{notaTotal}</p>}
    </div>
  );
}
