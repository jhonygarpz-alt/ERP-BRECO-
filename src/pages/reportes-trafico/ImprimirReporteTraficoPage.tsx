import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import {
  calcularEstatusViajes,
  calcularIngresosPorOperador,
  calcularListadoViajes,
  calcularViajesPendientesFacturar,
  calcularViajesPorUnidad,
  money,
  rangoUltimosDias,
  type FiltroFechas,
} from '../../lib/reportesTrafico';

const TITULOS: Record<string, string> = {
  'listado-viajes': '01. Listado de Viajes',
  'pendientes-facturar': '02. Viajes Pendientes de Facturar',
  'ingresos-operador': '07. Ingresos por Operador',
  'viajes-unidad': '08. Viajes por Unidad',
  'estatus-viajes': '14. Estatus de Viajes',
};

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };

export function ImprimirReporteTraficoPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const { viajes, facturas, clientes, operadores, unidades, empresa } = useData();

  const filtro: FiltroFechas = {
    desde: searchParams.get('desde') || rangoUltimosDias(30).desde,
    hasta: searchParams.get('hasta') || rangoUltimosDias(30).hasta,
  };

  const { headers, rows, notaTotal } = useMemo(() => {
    switch (tipo) {
      case 'listado-viajes': {
        const filas = calcularListadoViajes(viajes.items, clientes.items, operadores.items, unidades.items, filtro);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Estatus'],
          rows: filas.map((f) => [f.folio, f.fecha, f.cliente, f.operador, f.unidad, f.origen, f.destino, f.estatus]),
          notaTotal: `${filas.length} viajes en el periodo.`,
        };
      }
      case 'pendientes-facturar': {
        const filas = calcularViajesPendientesFacturar(viajes.items, facturas.items, clientes.items, filtro);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Origen', 'Destino', 'Estatus'],
          rows: filas.map((f) => [f.folio, f.fecha, f.cliente, f.origen, f.destino, f.estatus]),
          notaTotal: `${filas.length} viajes pendientes de facturar.`,
        };
      }
      case 'ingresos-operador': {
        const filas = calcularIngresosPorOperador(viajes.items, operadores.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.ingreso, 0);
        return {
          headers: ['Operador', 'Viajes', 'Ingreso'],
          rows: filas.map((f) => [f.operador, String(f.viajes), money(f.ingreso)]),
          notaTotal: `Total del periodo: ${money(total)}`,
        };
      }
      case 'viajes-unidad': {
        const filas = calcularViajesPorUnidad(viajes.items, unidades.items, filtro);
        const totalViajes = filas.reduce((acc, f) => acc + f.viajes, 0);
        const totalKm = filas.reduce((acc, f) => acc + f.kilometros, 0);
        return {
          headers: ['Unidad', 'Viajes', 'Kilometros'],
          rows: filas.map((f) => [f.unidad, String(f.viajes), f.kilometros.toLocaleString('es-MX')]),
          notaTotal: `${totalViajes} viajes · ${totalKm.toLocaleString('es-MX')} km en el periodo.`,
        };
      }
      case 'estatus-viajes': {
        const filas = calcularEstatusViajes(viajes.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.cantidad, 0);
        return {
          headers: ['Estatus', 'Cantidad', 'Porcentaje'],
          rows: filas.map((f) => [f.estatus, String(f.cantidad), total > 0 ? `${((f.cantidad / total) * 100).toFixed(1)}%` : '0%']),
          notaTotal: `${total} viajes en el periodo.`,
        };
      }
      default:
        return { headers: [], rows: [] as string[][], notaTotal: '' };
    }
  }, [tipo, viajes.items, facturas.items, clientes.items, operadores.items, unidades.items, filtro.desde, filtro.hasta]);

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
