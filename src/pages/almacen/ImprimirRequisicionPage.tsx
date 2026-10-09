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

export function ImprimirRequisicionPage() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones, proveedores, almacenes, empresa } = useData();

  const requisicion = requisiciones.items.find((r) => r.id === id);
  const proveedor = proveedores.items.find((p) => p.id === requisicion?.proveedorId);
  const almacen = almacenes.items.find((a) => a.id === requisicion?.almacenId);

  const todoCargado = !requisiciones.loading && !proveedores.loading && !almacenes.loading;

  useEffect(() => {
    if (!requisicion || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [requisicion, todoCargado]);

  if (!requisicion) {
    return <div style={pagina}>No se encontro la requisicion.</div>;
  }

  const totales = calcularTotalesArticulos(requisicion.lineas);
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
          titulo="Requisicion"
          filas={[
            { etiqueta: 'Folio', valor: requisicion.folio },
            { etiqueta: 'Fecha', valor: requisicion.fecha },
            { etiqueta: 'Estatus', valor: requisicion.estatus },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Proveedor</p>
          <p style={{ margin: '2px 0 0' }}>{proveedor?.nombre ?? '—'}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Almacen</p>
          <p style={{ margin: '2px 0 0' }}>{almacen ? `${almacen.codigo} - ${almacen.nombre}` : '—'}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Referencia</p>
          <p style={{ margin: '2px 0 0' }}>{requisicion.referencia || '—'}</p>
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
              <th style={thCfdi}>Unidad</th>
              <th style={thCfdi}>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {requisicion.lineas.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={7}>
                  Sin articulos capturados.
                </td>
              </tr>
            )}
            {requisicion.lineas.map((l) => (
              <tr key={l.id}>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{l.cantidad}</td>
                <td style={tdCfdi}>{l.codigo}</td>
                <td style={tdCfdi}>{l.descripcion}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.precioUnitario)}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(importeLinea(l))}</td>
                <td style={tdCfdi}>{l.unidadMedida}</td>
                <td style={tdCfdi}>{l.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          {requisicion.observaciones && (
            <Recuadro style={{ padding: '4px 8px', fontSize: 9 }}>
              <strong>Observaciones:</strong> {requisicion.observaciones}
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

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: 3, textAlign: 'center', fontSize: 9 }}>Solicita</div>
        <div style={{ borderTop: '1px solid #333', paddingTop: 3, textAlign: 'center', fontSize: 9 }}>Autoriza</div>
      </div>
    </div>
  );
}
