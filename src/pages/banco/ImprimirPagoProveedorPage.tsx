import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
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

export function ImprimirPagoProveedorPage() {
  const { id } = useParams<{ id: string }>();
  const { pagosProveedor, proveedores, gastosViaje, compras, cuentasBancarias, empresa } = useData();

  const pago = pagosProveedor.items.find((p) => p.id === id);
  const proveedor = proveedores.items.find((p) => p.id === pago?.proveedorId);
  const cuenta = cuentasBancarias.items.find((c) => c.id === pago?.cuentaBancariaId);

  const todoCargado = !pagosProveedor.loading && !proveedores.loading && !gastosViaje.loading && !compras.loading && !cuentasBancarias.loading;

  useEffect(() => {
    if (!pago || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [pago, todoCargado]);

  if (!pago) {
    return <div style={pagina}>No se encontro el pago.</div>;
  }

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
          titulo="Pago a Proveedor"
          filas={[
            { etiqueta: 'Folio', valor: pago.folio },
            { etiqueta: 'Fecha', valor: pago.fecha },
            { etiqueta: 'Estatus', valor: pago.estatus },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Proveedor</p>
          <p style={{ margin: '2px 0 0' }}>{proveedor?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>{proveedor?.numero ?? ''}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Pagado desde</p>
          <p style={{ margin: '2px 0 0' }}>{cuenta ? `${cuenta.banco} - ${cuenta.numero}` : '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>
            {pago.formaPago} {pago.referencia ? `· Ref. ${pago.referencia}` : ''}
          </p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Gastos y compras liquidados</TituloSeccion>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Concepto</th>
              <th style={thCfdi}>Fecha</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe Aplicado</th>
            </tr>
          </thead>
          <tbody>
            {pago.aplicaciones.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={3}>
                  Sin gastos aplicados.
                </td>
              </tr>
            )}
            {pago.aplicaciones.map((a) => {
              const g = a.gastoId ? gastosViaje.items.find((gg) => gg.id === a.gastoId) : undefined;
              const c = a.compraId ? compras.items.find((cc) => cc.id === a.compraId) : undefined;
              return (
                <tr key={a.gastoId ?? a.compraId}>
                  <td style={tdCfdi}>{g ? g.concepto || g.tipo : c ? `Compra ${c.folio}` : (a.gastoId ?? a.compraId)}</td>
                  <td style={tdCfdi}>{g?.fecha ?? c?.fecha ?? '-'}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(a.importe)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CajaTotales filas={[{ etiqueta: 'Total Pagado', valor: money(pago.importe), destacado: true }]} />
      </div>
    </div>
  );
}
