import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import {
  calcularAnticiposOperador,
  calcularAnticiposVsGastos,
  calcularCartasPorteRevision,
  calcularCombustibleConciliado,
  calcularDetalladoViajes,
  calcularEstatusViajes,
  calcularIngresosPorOperador,
  calcularIngresosPorUnidad,
  calcularJustInTime,
  calcularListadoViajes,
  calcularListadoViajesConcentrado,
  calcularInventarioEquipoEnViajes,
  calcularRendimientoPorUnidad,
  calcularSalidasDiarias,
  calcularVencimientosUnidades,
  calcularViajesPendientesFacturar,
  calcularViajesPorUnidad,
  calcularViajesUsoTrafico,
  money,
  rangoUltimosDias,
  type FiltroFechas,
} from '../../lib/reportesTrafico';

const TITULOS: Record<string, string> = {
  'listado-viajes': '01. Listado de Viajes',
  'pendientes-facturar': '02. Viajes Pendientes de Facturar',
  'salidas-diarias': '03. Salidas Diarias con Importes',
  'combustible-conciliado': '04. Combustible Conciliado',
  'ingresos-unidad': '05. Ingresos Generados por Unidad',
  'ingresos-operador': '07. Ingresos por Operador',
  'viajes-unidad': '08. Viajes por Unidad',
  'rendimiento-unidad': '10. Rendimiento por Unidad',
  'detallado-viajes': '11. Detallado de Viajes',
  'anticipos-operador': '12. Relacion de Anticipos',
  'cartas-porte-revision': '13. Cartas Porte a Revision',
  'estatus-viajes': '14. Estatus de Viajes',
  'viajes-concentrado': '16. Listado de Viajes Concentrado',
  'vencimientos-unidades': '17. Vencimientos de Unidades',
  'viajes-uso-trafico': '18. Relacion de Viajes para Uso de Trafico',
  'inventario-equipo': '19. Inventario de Equipo en Viajes',
  'anticipos-vs-gastos': '20. Anticipos vs Gastos por Viaje',
  'just-in-time': '21. Just in Time Detallado',
};

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const td: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '6px 8px' };

export function ImprimirReporteTraficoPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const { viajes, facturas, clientes, operadores, unidades, gastosViaje, cajas, empresa } = useData();

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
      case 'ingresos-unidad': {
        const filas = calcularIngresosPorUnidad(viajes.items, unidades.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.ingreso, 0);
        return {
          headers: ['Unidad', 'Viajes', 'Ingreso'],
          rows: filas.map((f) => [f.unidad, String(f.viajes), money(f.ingreso)]),
          notaTotal: `Total del periodo: ${money(total)}`,
        };
      }
      case 'detallado-viajes': {
        const filas = calcularDetalladoViajes(viajes.items, clientes.items, operadores.items, unidades.items, gastosViaje.items, filtro);
        const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
        const totalGastos = filas.reduce((acc, f) => acc + f.gastos, 0);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Origen', 'Destino', 'Km', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus'],
          rows: filas.map((f) => [
            f.folio,
            f.fecha,
            f.cliente,
            f.operador,
            f.unidad,
            f.origen,
            f.destino,
            f.kilometros.toLocaleString('es-MX'),
            money(f.ingreso),
            money(f.gastos),
            money(f.utilidad),
            f.estatus,
          ]),
          notaTotal: `${filas.length} viajes · Ingreso: ${money(totalIngreso)} · Gastos: ${money(totalGastos)} · Utilidad: ${money(totalIngreso - totalGastos)}`,
        };
      }
      case 'vencimientos-unidades': {
        const filas = calcularVencimientosUnidades(unidades.items, filtro);
        return {
          headers: ['Unidad', 'Documento', 'Fecha de Vencimiento', 'Dias', 'Estatus'],
          rows: filas.map((f) => [
            f.unidad,
            f.documento,
            f.fechaVencimiento,
            f.dias < 0 ? `Vencio hace ${Math.abs(f.dias)} dias` : `Vence en ${f.dias} dias`,
            f.estatus,
          ]),
          notaTotal: `${filas.length} documentos en el rango.`,
        };
      }
      case 'salidas-diarias': {
        const filas = calcularSalidasDiarias(viajes.items, filtro);
        const totalViajes = filas.reduce((acc, f) => acc + f.viajes, 0);
        const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
        return {
          headers: ['Fecha', 'Viajes', 'Ingreso'],
          rows: filas.map((f) => [f.fecha, String(f.viajes), money(f.ingreso)]),
          notaTotal: `${totalViajes} viajes · Total: ${money(totalIngreso)}`,
        };
      }
      case 'combustible-conciliado': {
        const filas = calcularCombustibleConciliado(gastosViaje.items, viajes.items, unidades.items, filtro);
        const conDescuadre = filas.filter((f) => !f.conciliado).length;
        return {
          headers: ['Fecha', 'Unidad', 'Litros', 'Precio/Litro', 'Monto Calculado', 'Monto Capturado', 'Diferencia', 'Conciliado'],
          rows: filas.map((f) => [
            f.fecha,
            f.unidad,
            f.litros.toLocaleString('es-MX'),
            money(f.precioLitro),
            money(f.montoCalculado),
            money(f.montoCapturado),
            money(f.diferencia),
            f.conciliado ? 'Si' : 'No',
          ]),
          notaTotal: `${filas.length} cargas de combustible · ${conDescuadre} con descuadre.`,
        };
      }
      case 'rendimiento-unidad': {
        const filas = calcularRendimientoPorUnidad(viajes.items, gastosViaje.items, unidades.items, filtro);
        return {
          headers: ['Unidad', 'Kilometros', 'Litros', 'Rendimiento Real (km/l)', 'Config. Cargado', 'Config. Vacio'],
          rows: filas.map((f) => [
            f.unidad,
            f.kilometros.toLocaleString('es-MX'),
            f.litros.toLocaleString('es-MX'),
            f.rendimientoReal.toLocaleString('es-MX'),
            f.rendimientoConfigCargado.toLocaleString('es-MX'),
            f.rendimientoConfigVacio.toLocaleString('es-MX'),
          ]),
          notaTotal: `${filas.length} unidades con actividad en el periodo.`,
        };
      }
      case 'anticipos-operador': {
        const filas = calcularAnticiposOperador(gastosViaje.items, viajes.items, operadores.items, filtro);
        const total = filas.reduce((acc, f) => acc + f.monto, 0);
        return {
          headers: ['Fecha', 'Viaje', 'Operador', 'Monto', 'Referencia'],
          rows: filas.map((f) => [f.fecha, f.folioViaje, f.operador, money(f.monto), f.referencia]),
          notaTotal: `${filas.length} anticipos · Total: ${money(total)}`,
        };
      }
      case 'cartas-porte-revision': {
        const filas = calcularCartasPorteRevision(viajes.items, clientes.items, unidades.items, operadores.items, cajas.items, filtro);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Datos Faltantes', 'Detalle'],
          rows: filas.map((f) => [f.folio, f.fecha, f.cliente, String(f.faltantesCount), f.faltantes]),
          notaTotal: `${filas.length} Cartas Porte con datos faltantes.`,
        };
      }
      case 'viajes-concentrado': {
        const filas = calcularListadoViajesConcentrado(viajes.items, clientes.items, operadores.items, unidades.items, cajas.items, gastosViaje.items, filtro);
        const totalIngreso = filas.reduce((acc, f) => acc + f.ingreso, 0);
        const totalGastos = filas.reduce((acc, f) => acc + f.gastos, 0);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Operador', 'Unidad', 'Remolques', 'Origen', 'Destino', 'Km', 'Ingreso', 'Gastos', 'Utilidad', 'Estatus'],
          rows: filas.map((f) => [
            f.folio,
            f.fecha,
            f.cliente,
            f.operador,
            f.unidad,
            f.remolques,
            f.origen,
            f.destino,
            f.kilometros.toLocaleString('es-MX'),
            money(f.ingreso),
            money(f.gastos),
            money(f.utilidad),
            f.estatus,
          ]),
          notaTotal: `${filas.length} viajes · Ingreso: ${money(totalIngreso)} · Gastos: ${money(totalGastos)}`,
        };
      }
      case 'viajes-uso-trafico': {
        const filas = calcularViajesUsoTrafico(viajes.items, operadores.items, unidades.items, filtro);
        return {
          headers: ['Folio', 'Tramo', 'Fecha', 'Operador', 'Unidad', 'Origen', 'Destino', 'Cita', 'Hora Salida', 'Estatus'],
          rows: filas.map((f) => [
            f.folio,
            String(f.trayectoNum),
            f.fecha,
            f.operador,
            f.unidad,
            f.origen,
            f.destino,
            f.cita,
            f.horaSalida,
            f.estatus,
          ]),
          notaTotal: `${filas.length} tramos en el periodo.`,
        };
      }
      case 'inventario-equipo': {
        const filas = calcularInventarioEquipoEnViajes(viajes.items, unidades.items, cajas.items, filtro);
        return {
          headers: ['Folio', 'Fecha', 'Unidad', 'Remolque 1', 'Dolly', 'Remolque 2', 'Estatus'],
          rows: filas.map((f) => [f.folio, f.fecha, f.unidad, f.remolque1, f.dolly, f.remolque2, f.estatus]),
          notaTotal: `${filas.length} viajes con equipo asignado.`,
        };
      }
      case 'anticipos-vs-gastos': {
        const filas = calcularAnticiposVsGastos(viajes.items, gastosViaje.items, clientes.items, filtro);
        const totalAnticipo = filas.reduce((acc, f) => acc + f.anticipo, 0);
        const totalGastos = filas.reduce((acc, f) => acc + f.totalGastos, 0);
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Anticipo', 'Otros Gastos', 'Total Gastos', 'Diferencia'],
          rows: filas.map((f) => [f.folio, f.fecha, f.cliente, money(f.anticipo), money(f.otrosGastos), money(f.totalGastos), money(f.diferencia)]),
          notaTotal: `${filas.length} viajes · Anticipo: ${money(totalAnticipo)} · Gastos: ${money(totalGastos)}`,
        };
      }
      case 'just-in-time': {
        const filas = calcularJustInTime(viajes.items, clientes.items, filtro);
        const cumplieron = filas.filter((f) => f.cumplio === true).length;
        return {
          headers: ['Folio', 'Fecha', 'Cliente', 'Cita', 'Hora Salida', 'Diferencia (min)', 'Cumplio'],
          rows: filas.map((f) => [
            f.folio,
            f.fecha,
            f.cliente,
            f.cita,
            f.horaSalida,
            f.diferenciaMin === null ? '—' : String(f.diferenciaMin),
            f.cumplio === null ? '—' : f.cumplio ? 'Si' : 'No',
          ]),
          notaTotal: `${cumplieron} de ${filas.length} viajes salieron a tiempo.`,
        };
      }
      default:
        return { headers: [], rows: [] as string[][], notaTotal: '' };
    }
  }, [tipo, viajes.items, facturas.items, clientes.items, operadores.items, unidades.items, gastosViaje.items, cajas.items, filtro.desde, filtro.hasta]);

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
