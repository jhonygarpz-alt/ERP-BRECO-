import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { importeALetras } from '../../lib/numeroALetras';
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

export function ImprimirNotaCreditoPage() {
  const { id } = useParams<{ id: string }>();
  const { notasCredito, clientes, facturas, empresa } = useData();

  const nota = notasCredito.items.find((n) => n.id === id);
  const cliente = clientes.items.find((c) => c.id === nota?.clienteId);
  const facturasRelacionadas = (nota?.facturaIds ?? []).map((fid) => facturas.items.find((f) => f.id === fid)).filter((f): f is NonNullable<typeof f> => Boolean(f));
  const totalIva = nota?.lineas.reduce((acc, l) => acc + l.importeIva, 0) ?? 0;
  const qrDataUrl = useQrDataUrl(nota?.timbrado.folioFiscal ?? '');

  useEffect(() => {
    if (!nota) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [nota]);

  if (!nota) {
    return <div style={pagina}>No se encontro la nota de credito.</div>;
  }

  const importeLetra = importeALetras(nota.total, nota.moneda);
  const uuidsRelacionados = facturasRelacionadas.map((f) => f.timbrado.folioFiscal).filter(Boolean);

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
          <CajaEtiqueta etiqueta="Nota de Credito" valor={nota.folio} />
          <CajaEtiqueta etiqueta="Folio Fiscal" valor={nota.timbrado.folioFiscal} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del Emisor" valor={nota.timbrado.noSerieCertificadoEmisor} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del SAT" valor={nota.timbrado.noSerieCertificadoSat} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Expedicion" valor={nota.timbrado.fechaHoraExpedicion || nota.fecha} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Certificacion" valor={nota.timbrado.fechaHoraCertificacion} tono="claro" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <CajaEtiqueta etiqueta="Tipo de Comprobante" valor="E - Egresos" tono="claro" />
        <CajaEtiqueta etiqueta="Uso del CFDI" valor={nota.usoCfdi} tono="claro" />
        <CajaEtiqueta etiqueta="Tipo de Relacion" valor="01 - Nota de credito de los documentos relacionados" tono="claro" />
        <CajaEtiqueta etiqueta="Moneda" valor={nota.moneda} tono="claro" />
        <CajaEtiqueta etiqueta="Tipo Cambio" valor={nota.tipoCambio} tono="claro" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '8px 12px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
        </Recuadro>
        <Recuadro style={{ padding: '8px 12px', fontSize: 10.5 }}>
          <p style={{ margin: 0 }}>
            <strong>Metodo de Pago:</strong> {nota.metodoPago}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Forma de Pago:</strong> {nota.formaPago || 'Por definir'}
          </p>
        </Recuadro>
      </div>

      <Recuadro style={{ padding: '6px 10px', marginBottom: 10, fontSize: 10 }}>
        <strong>UUID Relacionado(s):</strong> {uuidsRelacionados.length > 0 ? uuidsRelacionados.join(', ') : '—'}
      </Recuadro>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Concepto</th>
              <th style={thCfdi}>Unidad de Medida</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe</th>
              <th style={thCfdi}>Traslada</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe IVA</th>
            </tr>
          </thead>
          <tbody>
            {nota.lineas.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={5}>
                  Sin conceptos capturados.
                </td>
              </tr>
            )}
            {nota.lineas.map((l) => (
              <tr key={l.id}>
                <td style={tdCfdi}>{l.concepto}</td>
                <td style={tdCfdi}>{l.unidadMedida}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.importe)}</td>
                <td style={tdCfdi}>{l.traslada || '—'}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.importeIva)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nota.observaciones && (
        <Recuadro style={{ padding: '6px 10px', marginBottom: 10, fontSize: 10 }}>
          <strong>Observaciones:</strong> {nota.observaciones}
        </Recuadro>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '6px 10px', flex: 1, fontSize: 10 }}>
          <strong>Importe con letra:</strong> {importeLetra}
        </Recuadro>
        <CajaTotales
          moneda={nota.moneda}
          filas={[
            { etiqueta: 'Subtotal', valor: money(nota.subtotal) },
            { etiqueta: 'IVA', valor: money(totalIva) },
            { etiqueta: 'Total a Pagar', valor: money(nota.total), destacado: true },
          ]}
        />
      </div>

      <BloqueTimbrado
        folioFiscal={nota.timbrado.folioFiscal}
        fechaHoraExpedicion={nota.timbrado.fechaHoraExpedicion}
        fechaHoraCertificacion={nota.timbrado.fechaHoraCertificacion}
        noSerieCertificadoEmisor={nota.timbrado.noSerieCertificadoEmisor}
        noSerieCertificadoSat={nota.timbrado.noSerieCertificadoSat}
        selloDigitalCfdi={nota.timbrado.selloDigitalCfdi}
        selloDigitalSat={nota.timbrado.selloDigitalSat}
        cadenaOriginal={nota.timbrado.cadenaOriginal}
        qrDataUrl={qrDataUrl}
      />
      <LeyendaCfdi folioFiscal={nota.timbrado.folioFiscal} simulado={nota.timbrado.simulado} cancelado={nota.timbrado.cancelado} />
    </div>
  );
}
