import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { abonosAplicadosAFactura } from '../../lib/cobranza';
import { useQrDataUrl } from '../../lib/useQrDataUrl';
import {
  BarraAcciones,
  pagina,
  Recuadro,
  CajaEtiqueta,
  tablaStyle,
  thCfdi,
  tdCfdi,
  CajaTotales,
  BloqueTimbrado,
  LeyendaCfdi,
} from '../../components/print/PrintKit';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirPagoClientePage() {
  const { id } = useParams<{ id: string }>();
  const { pagosCliente, clientes, facturas, empresa } = useData();

  const pago = pagosCliente.items.find((p) => p.id === id);
  const cliente = clientes.items.find((c) => c.id === pago?.clienteId);
  const qrDataUrl = useQrDataUrl(pago?.timbrado.folioFiscal ?? '');

  useEffect(() => {
    if (!pago) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [pago]);

  if (!pago) {
    return <div style={pagina}>No se encontro el pago.</div>;
  }

  const totalMontoFacturas = pago.aplicaciones.reduce((acc, a) => acc + a.importe, 0);

  return (
    <div style={pagina}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 10.5 }}>RFC: {empresa.value.rfc || '—'}</p>
            {empresa.value.regimenFiscal && <p style={{ margin: '1px 0 0', fontSize: 10.5 }}>{empresa.value.regimenFiscal}</p>}
            <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#444' }}>{empresa.value.direccion || ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <CajaEtiqueta etiqueta="Folio / Tipo de Documento" valor={`${pago.folio} - P-Pago`} />
          <CajaEtiqueta etiqueta="Folio Fiscal" valor={pago.timbrado.folioFiscal} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del Emisor" valor={pago.timbrado.noSerieCertificadoEmisor} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del SAT" valor={pago.timbrado.noSerieCertificadoSat} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Timbrado" valor={pago.timbrado.fechaHoraExpedicion || pago.fechaCobro} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Certificacion" valor={pago.timbrado.fechaHoraCertificacion} tono="claro" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '8px 12px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
        </Recuadro>
        <CajaEtiqueta etiqueta="Uso del CFDI" valor="CP01 - PAGOS" tono="claro" />
        <CajaEtiqueta etiqueta="Regimen Fiscal" valor={empresa.value.regimenFiscal || '—'} tono="claro" />
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Cantidad</th>
              <th style={thCfdi}>Clave de Medida</th>
              <th style={thCfdi}>Clave de Producto o Servicio</th>
              <th style={thCfdi}>Descripcion</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Precio Unitario</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdCfdi}>1</td>
              <td style={tdCfdi}>ACT - ACTIVIDAD</td>
              <td style={tdCfdi}>84111506 - SERVICIOS DE FACTURACION</td>
              <td style={tdCfdi}>PAGO</td>
              <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(0)}</td>
              <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 0, marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <CeldaDato etiqueta="Forma de Pago" valor={pago.formaPago} />
        <CeldaDato etiqueta="Fecha Pago" valor={pago.fechaCobro} />
        <CeldaDato etiqueta="Monto" valor={money(pago.importeDepositado)} />
        <CeldaDato etiqueta="Numero de Operacion" valor={pago.referenciaBancaria || '—'} />
        <CeldaDato etiqueta="Moneda" valor={pago.moneda} borde={false} />
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Factura</th>
              <th style={thCfdi}>UUID</th>
              <th style={thCfdi}>Moneda</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Saldo Anterior</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe Pagado</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Saldo Insoluto</th>
            </tr>
          </thead>
          <tbody>
            {pago.aplicaciones.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={6}>
                  Sin facturas aplicadas.
                </td>
              </tr>
            )}
            {pago.aplicaciones.map((a) => {
              const factura = facturas.items.find((f) => f.id === a.facturaId);
              const saldoInsoluto = factura ? Math.max(0, factura.importe - abonosAplicadosAFactura(factura.id, pagosCliente.items)) : 0;
              const saldoAnterior = saldoInsoluto + a.importe;
              return (
                <tr key={a.facturaId}>
                  <td style={tdCfdi}>{factura?.folio ?? a.facturaId}</td>
                  <td style={tdCfdi}>{factura?.timbrado.folioFiscal || '—'}</td>
                  <td style={tdCfdi}>{factura?.moneda ?? pago.moneda}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(saldoAnterior)}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(a.importe)}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(saldoInsoluto)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pago.concepto && (
        <Recuadro style={{ padding: '6px 10px', marginBottom: 10, fontSize: 10 }}>
          <strong>Concepto:</strong> {pago.concepto}
        </Recuadro>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <CajaTotales
          moneda={pago.moneda}
          filas={[
            { etiqueta: 'Total Monto Facturas', valor: money(totalMontoFacturas), destacado: true },
            { etiqueta: 'Importe Depositado', valor: money(pago.importeDepositado) },
            ...(pago.saldoAFavor > 0 ? [{ etiqueta: 'Saldo a Favor', valor: money(pago.saldoAFavor) }] : []),
          ]}
        />
      </div>

      <BloqueTimbrado
        folioFiscal={pago.timbrado.folioFiscal}
        fechaHoraExpedicion={pago.timbrado.fechaHoraExpedicion}
        fechaHoraCertificacion={pago.timbrado.fechaHoraCertificacion}
        noSerieCertificadoEmisor={pago.timbrado.noSerieCertificadoEmisor}
        noSerieCertificadoSat={pago.timbrado.noSerieCertificadoSat}
        selloDigitalCfdi={pago.timbrado.selloDigitalCfdi}
        selloDigitalSat={pago.timbrado.selloDigitalSat}
        cadenaOriginal={pago.timbrado.cadenaOriginal}
        qrDataUrl={qrDataUrl}
      />
      <LeyendaCfdi folioFiscal={pago.timbrado.folioFiscal} simulado={pago.timbrado.simulado} cancelado={pago.timbrado.cancelado} />

      <p style={{ textAlign: 'center', fontSize: 8.5, color: '#888', marginTop: 10 }}>Version CFDI 4.0 &middot; Version Complemento de Pago 2.0</p>
    </div>
  );
}

function CeldaDato({ etiqueta, valor, borde = true }: { etiqueta: string; valor: string; borde?: boolean }) {
  return (
    <div style={{ padding: '6px 10px', borderRight: borde ? '1px solid #ddd' : undefined, fontSize: 10 }}>
      <div style={{ fontSize: 8.5, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>{etiqueta}</div>
      <div>{valor}</div>
    </div>
  );
}
