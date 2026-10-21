import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularTotalesArticulos, importeLinea } from '../../lib/almacen';
import {
  BarraAcciones,
  pagina,
  Recuadro,
  BloqueEtiquetasApiladas,
  TituloSeccion,
  tablaStyle,
  thCfdi,
  tdCfdi,
  CajaTotales,
} from '../../components/print/PrintKit';

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

  const todoCargado = !movimientosAlmacen.loading && !almacenes.loading && !tiposMovimientoAlmacen.loading && !proveedores.loading;

  useEffect(() => {
    if (!movimiento || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [movimiento, todoCargado]);

  if (!movimiento) {
    return <div style={pagina}>No se encontro el movimiento.</div>;
  }

  const totales = calcularTotalesArticulos(movimiento.lineas);
  const paginaCompacta = { ...pagina, padding: 16, fontSize: 9.5 };

  return (
    <div style={paginaCompacta}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 10, alignItems: 'stretch', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 9 }}>RFC: {empresa.value.rfc || '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#444' }}>{empresa.value.direccion || ''}</p>
          </div>
        </div>
        <BloqueEtiquetasApiladas
          columnas={2}
          titulo="Movimiento de Almacen"
          filas={[
            { etiqueta: 'Folio', valor: movimiento.folio },
            { etiqueta: 'Fecha', valor: movimiento.fecha },
            { etiqueta: 'Estatus', valor: movimiento.estatus },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Tipo de Movimiento</p>
          <p style={{ margin: '2px 0 0' }}>
            {tipo?.nombre ?? 'N/D'} ({tipo?.naturaleza})
          </p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Almacen</p>
          <p style={{ margin: '2px 0 0' }}>{almacen ? `${almacen.codigo} - ${almacen.nombre}` : 'N/D'}</p>
          {almacenDestino && (
            <p style={{ margin: '2px 0 0', color: '#555' }}>
              Destino: {almacenDestino.codigo} - {almacenDestino.nombre}
            </p>
          )}
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Proveedor</p>
          <p style={{ margin: '2px 0 0' }}>{proveedor?.nombre ?? '—'}</p>
          <p style={{ margin: '2px 0 0', color: '#555' }}>Ref: {movimiento.referencia || '—'}</p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Articulos</TituloSeccion>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Cantidad</th>
              <th style={thCfdi}>Codigo</th>
              <th style={thCfdi}>Articulo</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Precio Unitario</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {movimiento.lineas.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={5}>
                  Sin articulos capturados.
                </td>
              </tr>
            )}
            {movimiento.lineas.map((l) => (
              <tr key={l.id}>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>
                  {l.cantidad} {l.unidadMedida}
                </td>
                <td style={tdCfdi}>{l.codigo}</td>
                <td style={tdCfdi}>{l.descripcion}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.precioUnitario)}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(importeLinea(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          {movimiento.observaciones && (
            <Recuadro style={{ padding: '4px 8px', fontSize: 9 }}>
              <strong>Observaciones:</strong> {movimiento.observaciones}
            </Recuadro>
          )}
        </div>
        <CajaTotales
          filas={[
            { etiqueta: 'Subtotal', valor: money(totales.subtotal) },
            { etiqueta: 'IVA 16%', valor: money(totales.totalIva) },
            { etiqueta: 'Total', valor: money(totales.total), destacado: true },
          ]}
        />
      </div>
    </div>
  );
}
