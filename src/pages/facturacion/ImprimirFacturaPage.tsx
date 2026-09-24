import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularTotalesFactura } from '../../lib/facturacion';
import { importeALetras } from '../../lib/numeroALetras';
import { useQrDataUrl } from '../../lib/useQrDataUrl';
import { CONFIG_AUTOTRANSPORTE_SAT, TIPO_PERMISO_SCT } from '../../lib/catalogosSat';
import {
  BarraAcciones,
  pagina,
  Recuadro,
  CajaEtiqueta,
  TituloSeccion,
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

function direccionCorta(d?: { calle: string; numeroExterior: string; colonia: string }) {
  if (!d) return '';
  return [d.calle, d.numeroExterior, d.colonia].filter(Boolean).join(' ');
}

function ciudadCorta(d?: { municipio: string; estado: string; pais: string; cp: string }) {
  if (!d) return '';
  return [d.municipio, d.estado, d.pais].filter(Boolean).join(', ') + (d.cp ? `, C.P. ${d.cp}` : '');
}

export function ImprimirFacturaPage() {
  const { id } = useParams<{ id: string }>();
  const { facturas, clientes, viajes, unidades, operadores, cajas, rutas, destinatarios, conceptosFacturacion, empresa } = useData();

  const factura = facturas.items.find((f) => f.id === id);
  const cliente = clientes.items.find((c) => c.id === factura?.clienteId);
  const viajesIncluidos = (factura?.viajeIds ?? []).map((vid) => viajes.items.find((v) => v.id === vid)).filter((v): v is NonNullable<typeof v> => Boolean(v));
  const viajeCartaPorte = viajesIncluidos.find((v) => v.tipoDocumento === 'CartaPorte');
  const totales = factura ? calcularTotalesFactura(factura.lineas) : null;
  const qrDataUrl = useQrDataUrl(factura?.timbrado.folioFiscal ?? '');

  const unidad = viajeCartaPorte ? unidades.items.find((u) => u.id === (viajeCartaPorte.trayectos[0]?.unidadId || viajeCartaPorte.unidadId)) : undefined;
  const operador = viajeCartaPorte ? operadores.items.find((o) => o.id === (viajeCartaPorte.trayectos[0]?.operadorId || viajeCartaPorte.operadorId)) : undefined;
  const remolque1 = viajeCartaPorte ? cajas.items.find((c) => c.id === viajeCartaPorte.remolque1Id) : undefined;
  const rutaDelViaje = viajeCartaPorte ? rutas.items.find((r) => r.codigo === viajeCartaPorte.rutaCodigo) : undefined;
  const rutaOrigen = destinatarios.items.find((d) => d.id === rutaDelViaje?.origenId);
  const rutaDestino = destinatarios.items.find((d) => d.id === rutaDelViaje?.destinoId);
  const config = unidad ? CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === (viajeCartaPorte?.configVehicularClaveSat || unidad.tipo)) : undefined;
  const permiso = unidad ? TIPO_PERMISO_SCT.find((p) => p.clave === unidad.claveTipoPermisoSct) : undefined;

  useEffect(() => {
    if (!factura) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [factura]);

  if (!factura || !totales) {
    return <div style={pagina}>No se encontro la factura.</div>;
  }

  const importeLetra = importeALetras(totales.total, factura.moneda);

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
          <CajaEtiqueta etiqueta={viajeCartaPorte ? 'Factura con Complemento' : 'Factura'} valor={factura.folio} />
          <CajaEtiqueta etiqueta="Folio Fiscal" valor={factura.timbrado.folioFiscal} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del Emisor" valor={factura.timbrado.noSerieCertificadoEmisor} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del SAT" valor={factura.timbrado.noSerieCertificadoSat} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Expedicion" valor={factura.timbrado.fechaHoraExpedicion || factura.fecha} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Certificacion" valor={factura.timbrado.fechaHoraCertificacion} tono="claro" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '8px 12px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
          <p style={{ margin: '4px 0 0' }}>Direccion: {direccionCorta(cliente)}</p>
          <p style={{ margin: '1px 0 0' }}>Ciudad: {ciudadCorta(cliente)}</p>
        </Recuadro>
        <Recuadro style={{ padding: '8px 12px', fontSize: 10.5 }}>
          <p style={{ margin: 0 }}>
            <strong>Metodo de Pago:</strong> {factura.metodoPago}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Forma de Pago:</strong> {factura.formaPago || 'Por definir'}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Uso del CFDI:</strong> {factura.usoCfdi}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Condiciones:</strong> {factura.condicionesPago}
          </p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Cantidad</th>
              <th style={thCfdi}>Clave de Medida SAT</th>
              <th style={thCfdi}>Clave Producto</th>
              <th style={thCfdi}>Concepto</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>P.U.</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((l) => {
              const catalogo = conceptosFacturacion.items.find((cc) => cc.id === l.conceptoFacturacionId);
              return (
                <tr key={l.id}>
                  <td style={tdCfdi}>{l.cantidad}</td>
                  <td style={tdCfdi}>{catalogo?.claveUnidad || l.unidadMedida || '—'}</td>
                  <td style={tdCfdi}>{catalogo?.claveProdServ || '—'}</td>
                  <td style={tdCfdi}>{l.concepto}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.precioUnitario)}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.importe)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viajeCartaPorte && (
        <>
          <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <TituloSeccion>Detalle del complemento Carta Porte</TituloSeccion>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 10.5 }}>
              <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
                <strong>Medio de transporte:</strong> 01 - Autotransporte Federal
              </div>
              <div style={{ padding: '5px 10px' }}>
                <strong>Transporte Internacional:</strong> {viajeCartaPorte.importacion || viajeCartaPorte.exportacion ? 'SI' : 'NO'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Recuadro style={{ padding: '8px 10px', fontSize: 10.5 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Origen</p>
              <p style={{ margin: '2px 0 0' }}>
                Fecha y hora de salida: {viajeCartaPorte.fechaCarga || viajeCartaPorte.fecha} {viajeCartaPorte.horaCarga}
              </p>
              {rutaOrigen ? (
                <>
                  <p style={{ margin: '2px 0 0' }}>
                    {rutaOrigen.rfc} {rutaOrigen.nombre}
                  </p>
                  <p style={{ margin: '1px 0 0' }}>{direccionCorta(rutaOrigen)}</p>
                  <p style={{ margin: '1px 0 0' }}>{ciudadCorta(rutaOrigen)}</p>
                </>
              ) : (
                <p style={{ margin: '2px 0 0' }}>{viajeCartaPorte.origen || viajeCartaPorte.cargarEn || '—'}</p>
              )}
            </Recuadro>
            <Recuadro style={{ padding: '8px 10px', fontSize: 10.5 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Destino</p>
              <p style={{ margin: '2px 0 0' }}>
                Fecha y hora de prog. llegada: {viajeCartaPorte.fechaEntrega || viajeCartaPorte.fecha} {viajeCartaPorte.horaLlegadaEstimada}
              </p>
              {rutaDestino ? (
                <>
                  <p style={{ margin: '2px 0 0' }}>
                    {rutaDestino.rfc} {rutaDestino.nombre}
                  </p>
                  <p style={{ margin: '1px 0 0' }}>{direccionCorta(rutaDestino)}</p>
                  <p style={{ margin: '1px 0 0' }}>{ciudadCorta(rutaDestino)}</p>
                </>
              ) : (
                <p style={{ margin: '2px 0 0' }}>{viajeCartaPorte.destino || viajeCartaPorte.descargarEn || '—'}</p>
              )}
            </Recuadro>
          </div>

          <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <TituloSeccion>Detalle de mercancias</TituloSeccion>
            <table style={tablaStyle}>
              <thead>
                <tr>
                  <th style={thCfdi}>Bienes Transportados</th>
                  <th style={thCfdi}>Clave Unidad</th>
                  <th style={thCfdi}>Cantidad</th>
                  <th style={thCfdi}>Material Peligroso</th>
                  <th style={thCfdi}>Peso</th>
                  <th style={thCfdi}>Valor</th>
                  <th style={thCfdi}>Moneda</th>
                </tr>
              </thead>
              <tbody>
                {viajeCartaPorte.materialesCarga.length === 0 && (
                  <tr>
                    <td style={tdCfdi} colSpan={7}>
                      Sin mercancias capturadas.
                    </td>
                  </tr>
                )}
                {viajeCartaPorte.materialesCarga.map((m) => (
                  <tr key={m.id}>
                    <td style={tdCfdi}>
                      {m.claveProdServCP ? `${m.claveProdServCP} ` : ''}
                      {m.descripcion}
                    </td>
                    <td style={tdCfdi}>{m.claveUnidadSat || m.unidadEmpaque}</td>
                    <td style={tdCfdi}>{m.cantidad}</td>
                    <td style={tdCfdi}>{m.materialPeligroso ? `SI (${m.claveMaterialPeligroso || 'sin clave'})` : 'NO'}</td>
                    <td style={tdCfdi}>
                      {m.peso} {m.unidadPeso}
                    </td>
                    <td style={tdCfdi}>0</td>
                    <td style={tdCfdi}>{factura.moneda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '5px 10px', borderTop: '1px solid #ddd', fontSize: 10 }}>
              <strong>Kms Recorridos:</strong> {viajeCartaPorte.kilometros} Km
            </div>
          </div>

          <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <TituloSeccion>AutoTransporte Federal</TituloSeccion>
            <table style={tablaStyle}>
              <thead>
                <tr>
                  <th style={thCfdi}>Tipo Permiso SCT</th>
                  <th style={thCfdi}>Permiso SCT</th>
                  <th style={thCfdi}>Aseguradora</th>
                  <th style={thCfdi}>Poliza Seguro</th>
                  <th style={thCfdi}>Config Vehicular</th>
                  <th style={thCfdi}>Placas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdCfdi}>{unidad?.claveTipoPermisoSct ? `${unidad.claveTipoPermisoSct} - ${permiso?.descripcion ?? ''}` : '—'}</td>
                  <td style={tdCfdi}>{unidad?.numeroPermisoSct || '—'}</td>
                  <td style={tdCfdi}>{unidad?.aseguradora || '—'}</td>
                  <td style={tdCfdi}>{unidad?.noPoliza || '—'}</td>
                  <td style={tdCfdi}>{config ? `${config.clave} - ${config.descripcion}` : unidad?.tipo || '—'}</td>
                  <td style={tdCfdi}>{unidad?.placas || '—'}</td>
                </tr>
              </tbody>
            </table>
            {remolque1 && (
              <div style={{ padding: '5px 10px', borderTop: '1px solid #ddd', fontSize: 10 }}>
                <strong>Remolque1:</strong> {remolque1.economico} ({remolque1.placas})
              </div>
            )}
          </div>

          <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <TituloSeccion>Figuras de transporte</TituloSeccion>
            <table style={tablaStyle}>
              <thead>
                <tr>
                  <th style={thCfdi}>RFC</th>
                  <th style={thCfdi}>Nombre</th>
                  <th style={thCfdi}>Licencia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdCfdi}>{operador?.rfc || '—'}</td>
                  <td style={tdCfdi}>{operador?.nombre || '—'}</td>
                  <td style={tdCfdi}>{operador?.licencia || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {factura.observaciones && (
        <Recuadro style={{ padding: '6px 10px', marginBottom: 10, fontSize: 10 }}>
          <strong>Observaciones:</strong> {factura.observaciones}
        </Recuadro>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '6px 10px', flex: 1, fontSize: 10 }}>
          <p style={{ margin: 0 }}>
            <strong>Importe con letra:</strong> {importeLetra}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Tipo de Comprobante:</strong> I - Ingresos &nbsp;&nbsp; <strong>Tipo Cambio:</strong> {factura.tipoCambio}
          </p>
        </Recuadro>
        <CajaTotales
          moneda={factura.moneda}
          filas={[
            { etiqueta: 'Subtotal', valor: money(totales.subtotal) },
            { etiqueta: 'Descuento', valor: money(totales.descuentoTotal) },
            { etiqueta: 'IVA', valor: money(totales.totalIva) },
            { etiqueta: 'Retenciones', valor: `-${money(totales.totalRetenciones)}` },
            { etiqueta: 'Total a Pagar', valor: money(totales.total), destacado: true },
          ]}
        />
      </div>

      <BloqueTimbrado
        folioFiscal={factura.timbrado.folioFiscal}
        fechaHoraExpedicion={factura.timbrado.fechaHoraExpedicion}
        fechaHoraCertificacion={factura.timbrado.fechaHoraCertificacion}
        noSerieCertificadoEmisor={factura.timbrado.noSerieCertificadoEmisor}
        noSerieCertificadoSat={factura.timbrado.noSerieCertificadoSat}
        selloDigitalCfdi={factura.timbrado.selloDigitalCfdi}
        selloDigitalSat={factura.timbrado.selloDigitalSat}
        cadenaOriginal={factura.timbrado.cadenaOriginal}
        qrDataUrl={qrDataUrl}
      />
      <LeyendaCfdi folioFiscal={factura.timbrado.folioFiscal} simulado={factura.timbrado.simulado} cancelado={factura.timbrado.cancelado} />

      {viajeCartaPorte && (
        <div style={{ marginTop: 16, fontSize: 8.5, color: '#333', textAlign: 'justify', pageBreakBefore: 'always', paddingTop: 16 }}>
          <h2 style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Condiciones del Contrato de Transporte que ampara esta Carta de Porte
          </h2>
          <p>
            <strong>PRIMERA.-</strong> Para los efectos del presente contrato de transporte se denomina "Transportista" al que
            realiza el servicio de transportacion y Expedidor, Remitente o "Usuario" al que contrate el servicio o remita la
            mercancia.
          </p>
          <p>
            <strong>SEGUNDA.-</strong> El Expedidor, Remitente o "Usuario" es responsable de que la informacion proporcionada al
            "Transportista" sea veraz y que la documentacion que entregue para efectos del transporte sea la correcta.
          </p>
          <p>
            <strong>TERCERA.-</strong> El Expedidor, Remitente o "Usuario" debe declarar al "Transportista" el tipo de
            mercancia o efectos de que se trate, peso, medidas y/o numero de la carga que entrega para su transporte y, en su
            caso, el valor de la misma.
          </p>
          <p>
            <strong>CUARTA.-</strong> El Expedidor, Remitente o "Usuario" debera entregar al "Transportista" los documentos que
            las leyes y reglamentos exijan para llevar a cabo el servicio; de no cumplirse, el "Transportista" esta obligado a
            rehusar el transporte de las mercancias.
          </p>
          <p>
            <strong>QUINTA.-</strong> El "Transportista" debera recoger y entregar la carga precisamente en los domicilios que
            senale el Expedidor, Remitente o "Usuario", ajustandose a los terminos y condiciones convenidos.
          </p>
          <p>
            <strong>SEXTA.-</strong> El "Transportista" y el Expedidor, Remitente o "Usuario" negociaran libremente el precio
            del servicio, tomando en cuenta su tipo, caracteristica de los embarques, volumen, regularidad, clase de carga y
            sistema de pago.
          </p>
          <p>
            <strong>SEPTIMA.-</strong> El precio del transporte debera pagarse en origen, salvo convenio entre las partes de
            pago en destino.
          </p>
          <p>
            <strong>OCTAVA.-</strong> Si al momento de la entrega resultare algun faltante o averia, el consignatario podra
            formular su reclamacion por escrito al "Transportista", dentro de las 24 horas siguientes.
          </p>
          <p>
            <strong>NOVENA.-</strong> Para el caso de que el Expedidor, Remitente o "Usuario" contrate carro por entero, este
            acepta la responsabilidad solidaria para con el "Transportista", quedando obligado a verificar que la carga y el
            vehiculo que la transporta cumplan con el peso y dimensiones maximas establecidos en la normatividad vigente
            (NOM-012-SCT-2).
          </p>
        </div>
      )}
    </div>
  );
}
