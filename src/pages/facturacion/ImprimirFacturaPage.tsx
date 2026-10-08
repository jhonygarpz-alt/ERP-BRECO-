import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { calcularTotalesFactura, porcentajeDeTexto } from '../../lib/facturacion';
import { importeALetras } from '../../lib/numeroALetras';
import { CONFIG_AUTOTRANSPORTE_SAT, FORMA_PAGO_SAT, USO_CFDI_SAT } from '../../lib/catalogosSat';
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

/** Fecha+hora en el mismo formato (sin zona horaria) que el Edge Function manda al PAC, para que el QR CCP consulte exactamente el mismo dato que quedo timbrado. */
function fechaHoraIso(fecha: string, hora: string) {
  const h = hora && /^\d{2}:\d{2}/.test(hora) ? hora.slice(0, 5) : '00:00';
  return `${fecha}T${h}:00`;
}

export function ImprimirFacturaPage() {
  const { id } = useParams<{ id: string }>();
  const { facturas, clientes, viajes, unidades, operadores, cajas, rutas, destinatarios, conceptosFacturacion, empresa } = useData();

  const factura = facturas.items.find((f) => f.id === id);
  const cliente = clientes.items.find((c) => c.id === factura?.clienteId);
  const viajesIncluidos = (factura?.viajeIds ?? []).map((vid) => viajes.items.find((v) => v.id === vid)).filter((v): v is NonNullable<typeof v> => Boolean(v));
  const viajeCartaPorte = viajesIncluidos.find((v) => v.tipoDocumento === 'CartaPorte');
  const totales = factura ? calcularTotalesFactura(factura.lineas) : null;

  const unidad = viajeCartaPorte ? unidades.items.find((u) => u.id === (viajeCartaPorte.trayectos[0]?.unidadId || viajeCartaPorte.unidadId)) : undefined;
  const operador = viajeCartaPorte ? operadores.items.find((o) => o.id === (viajeCartaPorte.trayectos[0]?.operadorId || viajeCartaPorte.operadorId)) : undefined;
  const remolque1 = viajeCartaPorte ? cajas.items.find((c) => c.id === viajeCartaPorte.remolque1Id) : undefined;
  const rutaDelViaje = viajeCartaPorte ? rutas.items.find((r) => r.codigo === viajeCartaPorte.rutaCodigo) : undefined;
  const rutaOrigen = destinatarios.items.find((d) => d.id === rutaDelViaje?.origenId);
  const rutaDestino = destinatarios.items.find((d) => d.id === rutaDelViaje?.destinoId);
  const config = unidad ? CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === (viajeCartaPorte?.configVehicularClaveSat || unidad.tipo)) : undefined;
  const formaPago = FORMA_PAGO_SAT.find((f) => f.clave === factura?.formaPago);
  const usoCfdi = USO_CFDI_SAT.find((u) => u.clave === factura?.usoCfdi);

  useEffect(() => {
    if (!factura) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [factura]);

  if (!factura || !totales) {
    return <div style={pagina}>No se encontro la factura.</div>;
  }

  const importeLetra = importeALetras(totales.total, factura.moneda);
  const ivaTexto = factura.lineas.find((l) => l.traslada)?.traslada;
  const retTexto = factura.lineas.find((l) => l.retiene)?.retiene;
  const etiquetaIva = ivaTexto ? `IVA ${Math.round(porcentajeDeTexto(ivaTexto) * 100)}%` : 'IVA';
  const etiquetaRetencion = retTexto ? `Retencion IVA ${Math.round(porcentajeDeTexto(retTexto) * 100)}%` : 'Retenciones';
  const fechaOrigenCcp = viajeCartaPorte ? fechaHoraIso(viajeCartaPorte.fechaCarga || viajeCartaPorte.fecha, viajeCartaPorte.horaCarga) : '';

  const bloqueTimbre = (
    <>
      <BloqueTimbrado
        folioFiscal={factura.timbrado.folioFiscal}
        fechaHoraCertificacion={factura.timbrado.fechaHoraCertificacion}
        selloDigitalCfdi={factura.timbrado.selloDigitalCfdi}
        selloDigitalSat={factura.timbrado.selloDigitalSat}
        cadenaOriginal={factura.timbrado.cadenaOriginal}
        rfcEmisor={empresa.value.rfc}
        rfcReceptor={cliente?.rfc ?? ''}
        total={totales.total}
        cartaPorte={viajeCartaPorte ? { idCcp: factura.timbrado.idCcp, fechaOrigen: fechaOrigenCcp } : undefined}
      />
      <LeyendaCfdi folioFiscal={factura.timbrado.folioFiscal} simulado={factura.timbrado.simulado} cancelado={factura.timbrado.cancelado} />
    </>
  );

  return (
    <div style={pagina}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, alignItems: 'start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 64, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Empresa'}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 10.5 }}>RFC: {empresa.value.rfc || '—'}</p>
            {empresa.value.regimenFiscal && <p style={{ margin: '1px 0 0', fontSize: 10.5 }}>{empresa.value.regimenFiscal}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#444' }}>{empresa.value.direccion || ''}</p>
          </div>
        </div>
        <BloqueEtiquetasApiladas
          titulo={viajeCartaPorte ? 'Factura con Complemento 3.0' : 'Factura'}
          filas={[
            { etiqueta: 'Folio', valor: `${factura.sucursal} ${factura.folio}`.trim() },
            { etiqueta: 'Folio Fiscal', valor: factura.timbrado.folioFiscal },
            { etiqueta: 'No. Serie Certificado del Emisor', valor: factura.timbrado.noSerieCertificadoEmisor },
            { etiqueta: 'No. Serie Certificado del SAT', valor: factura.timbrado.noSerieCertificadoSat },
            { etiqueta: 'Fecha Hora Expedicion', valor: factura.timbrado.fechaHoraExpedicion || factura.fecha },
            { etiqueta: 'Fecha Hora Certificacion', valor: factura.timbrado.fechaHoraCertificacion },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '8px 12px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>Regimen Fiscal: {cliente?.regimenFiscal ?? '—'}</p>
          <p style={{ margin: '6px 0 0' }}>Direccion: {direccionCorta(cliente)}</p>
          <p style={{ margin: '1px 0 0' }}>Ciudad: {ciudadCorta(cliente)}</p>
        </Recuadro>
        <Recuadro style={{ padding: '8px 12px', fontSize: 10.5 }}>
          <p style={{ margin: '0 0 6px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 4 }}>
            {factura.metodoPago} - {factura.metodoPago === 'PUE' ? 'Pago en una sola exhibicion' : 'Pago en parcialidades o diferido'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Forma de Pago:</strong> {formaPago ? `${formaPago.clave} ${formaPago.descripcion}` : factura.formaPago || 'Por definir'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>
              <strong>Moneda</strong> {factura.moneda}
            </span>
            <span>
              <strong>Tipo Cambio</strong> {factura.tipoCambio.toFixed(2)}
            </span>
          </div>
          <p style={{ margin: '4px 0 0' }}>
            <strong>Tipo de Comprobante:</strong> I - Ingresos
          </p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Cantidad</th>
              <th style={thCfdi}>Clave de Medida SAT</th>
              <th style={thCfdi}>No Identificador</th>
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
                  <td style={tdCfdi}>{catalogo?.noIdentificacion || ''}</td>
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
            <div style={{ background: '#e5e5e5', textAlign: 'center', padding: '6px 8px', fontWeight: 700, fontSize: 10.5 }}>
              Detalle del complemento CARTA PORTE &nbsp;&nbsp; No.Viaje Cliente: {viajeCartaPorte.loadNumber || '—'} &nbsp;&nbsp; Viaje:{' '}
              {viajeCartaPorte.sucursal} - {viajeCartaPorte.folio}
              <br />
              IdCCP: {factura.timbrado.idCcp || '—'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid #333' }}>
              <div style={{ background: '#e5e5e5', textAlign: 'center', fontSize: 9.5, fontWeight: 700, padding: '4px 0', borderBottom: '1px solid #333' }}>
                Medio de transporte
              </div>
              <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 10.5 }}>01 - Autotransporte Federal</div>
            </div>
            <div>
              <div style={{ background: '#e5e5e5', textAlign: 'center', fontSize: 9.5, fontWeight: 700, padding: '4px 0', borderBottom: '1px solid #333' }}>
                Transporte Internacional
              </div>
              <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 10.5 }}>
                {viajeCartaPorte.importacion || viajeCartaPorte.exportacion ? 'SI' : 'NO'}
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
                  <th style={thCfdi}>TipoMaterial Peligroso</th>
                  <th style={thCfdi}>Peso</th>
                </tr>
              </thead>
              <tbody>
                {viajeCartaPorte.materialesCarga.length === 0 && (
                  <tr>
                    <td style={tdCfdi} colSpan={5}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid #333' }}>
              <div style={{ background: '#e5e5e5', textAlign: 'center', fontSize: 9.5, fontWeight: 700, padding: '4px 0', borderBottom: '1px solid #333' }}>
                Total Distancia Recorrida
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 11 }}>{viajeCartaPorte.kilometros} Km</div>
            </div>
            <div>
              <div style={{ background: '#e5e5e5', fontSize: 9.5, fontWeight: 700, padding: '4px 8px', borderBottom: '1px solid #333' }}>Observaciones</div>
              <div style={{ padding: '6px 8px', fontSize: 10, whiteSpace: 'pre-line' }}>{viajeCartaPorte.observaciones || '—'}</div>
            </div>
          </div>

          <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <TituloSeccion>AutoTransporte Federal</TituloSeccion>
            <table style={tablaStyle}>
              <thead>
                <tr>
                  <th style={thCfdi}>Tipo Permiso SCT</th>
                  <th style={thCfdi}>Economico</th>
                  <th style={thCfdi}>Permiso SCT</th>
                  <th style={thCfdi}>Aseguradora</th>
                  <th style={thCfdi}>PolizaSeguro</th>
                  <th style={thCfdi}>C.Vehicular</th>
                  <th style={thCfdi}>Placas</th>
                  <th style={thCfdi}>Modelo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdCfdi}>{unidad?.claveTipoPermisoSct || '—'}</td>
                  <td style={tdCfdi}>{unidad?.economico || '—'}</td>
                  <td style={tdCfdi}>{unidad?.numeroPermisoSct || '—'}</td>
                  <td style={tdCfdi}>{unidad?.aseguradora || '—'}</td>
                  <td style={tdCfdi}>{unidad?.noPoliza || '—'}</td>
                  <td style={tdCfdi}>{config ? config.clave : unidad?.tipo || '—'}</td>
                  <td style={tdCfdi}>{unidad?.placas || '—'}</td>
                  <td style={tdCfdi}>{unidad?.anio || '—'}</td>
                </tr>
              </tbody>
            </table>
            {remolque1 && (
              <div style={{ display: 'flex', borderTop: '1px solid #333' }}>
                <div style={{ padding: '6px 8px', fontSize: 9.5, borderRight: '1px solid #333' }}>
                  <strong>Remolque1ECO:</strong> {remolque1.economico}
                  <br />
                  <strong>Remolque1SAT:</strong> {remolque1.tipo}
                </div>
                <div style={{ padding: '6px 8px', fontSize: 9.5, borderRight: '1px solid #333', display: 'flex', alignItems: 'center' }}>
                  <strong>Placa:</strong>&nbsp;{remolque1.placas}
                </div>
                <div style={{ padding: '6px 8px', fontSize: 9.5, display: 'flex', alignItems: 'center' }}>
                  <strong>Contenedor1:</strong>&nbsp;{viajeCartaPorte.loadNumber || '—'}
                </div>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Recuadro style={{ padding: '6px 10px', fontSize: 10 }}>
            <strong>Importe con letra:</strong> {importeLetra}
          </Recuadro>
          <Recuadro style={{ padding: '6px 10px', fontSize: 10 }}>
            <strong>Uso del CFDI:</strong> {usoCfdi ? `${usoCfdi.clave} - ${usoCfdi.descripcion}` : factura.usoCfdi}
          </Recuadro>
        </div>
        <CajaTotales
          moneda={factura.moneda}
          filas={[
            { etiqueta: 'Subtotal', valor: money(totales.subtotal) },
            ...(totales.descuentoTotal > 0 ? [{ etiqueta: 'Descuento', valor: money(totales.descuentoTotal) }] : []),
            { etiqueta: etiquetaIva, valor: money(totales.totalIva) },
            ...(totales.totalRetenciones > 0 ? [{ etiqueta: etiquetaRetencion, valor: money(totales.totalRetenciones) }] : []),
            { etiqueta: 'Total a Pagar', valor: money(totales.total), destacado: true },
          ]}
        />
      </div>

      {!viajeCartaPorte && bloqueTimbre}

      {viajeCartaPorte && (
        <div style={{ pageBreakBefore: 'always', paddingTop: 16 }}>
          {bloqueTimbre}

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 10.5, fontWeight: 700, background: '#e5e5e5', padding: '5px 8px', borderRadius: 6 }}>
            CONDICIONES DEL CONTRATO DE TRANSPORTE QUE AMPARA ESTA CARTA DE PORTE
          </div>

          <div style={{ marginTop: 10, fontSize: 8.5, color: '#333', textAlign: 'justify' }}>
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
              las leyes y reglamentos exijan para llevar a cabo el servicio; en caso de no cumplirse con estos requisitos el
              "Transportista" esta obligado a rehusar el transporte de las mercancias.
            </p>
            <p>
              <strong>QUINTA.-</strong> Si por sospecha de falsedad en la declaracion del contenido de un bulto el "Transportista"
              deseare proceder a su reconocimiento, podra hacerlo ante testigos y con asistencia del "Expedidor", "Remitente" o
              "Usuario" o del consignatario. Si este ultimo no concurriere, se solicitara la presencia de un inspector de la
              Secretaria de Comunicaciones y Transportes, y se levantara el acta correspondiente. El "Transportista" tendra en
              todo caso, la obligacion de dejar los bultos en el estado en que se encontraban antes del reconocimiento.
            </p>
            <p>
              <strong>SEXTA.-</strong> El "Transportista" debera recoger y entregar la carga precisamente en los domicilios que
              senale el "Expedidor", "Remitente" o "Usuario", ajustandose a los terminos y condiciones convenidos. El
              "Transportista" solo esta obligado a llevar la carga al domicilio del consignatario para su entrega una sola vez.
              Si esta no fuera recibida, se dejara aviso de que la mercancia queda a disposicion del interesado en las bodegas
              que indique el "Transportista".
            </p>
            <p>
              <strong>SEPTIMA.-</strong> Si la carga no fuere retirada dentro de los 30 dias habiles siguientes a aquel en que
              hubiere sido puesta a disposicion del consignatario, el "Transportista" podra solicitar la venta en subasta
              publica con arreglo a lo que dispone el Codigo de Comercio.
            </p>
            <p>
              <strong>OCTAVA.-</strong> El "Transportista" y el "Expedidor", "Remitente" o "Usuario" negociaran libremente el
              precio del servicio, tomando en cuenta su tipo, caracteristica de los embarques, volumen, regularidad, clase de
              carga y sistema de pago.
            </p>
            <p>
              <strong>NOVENA.-</strong> Si el "Expedidor", "Remitente" o "Usuario" desea que el "Transportista" asuma la
              responsabilidad por el valor de las mercancias o efectos que el declare y que cubra toda clase de riesgos,
              inclusive los derivados de caso fortuito o de fuerza mayor, las partes deberan convenir un cargo adicional,
              equivalente al valor de la prima del seguro que se contrate, el cual se debera expresar en un CFDI con
              Complemento Carta Porte.
            </p>
            <p>
              <strong>DECIMA.-</strong> Cuando el importe del flete no incluya el cargo adicional, la responsabilidad del
              "Transportista" queda expresamente limitada a la cantidad equivalente a 15 Unidades de Medida y Actualizacion
              (UMAS) por tonelada o cuando se trate de embarques cuyo peso sea mayor de 200 kg., pero menor de 1000 kg; y 4
              UMAS por remesa cuando se trate de embarques con peso hasta de 200 kg.
            </p>
            <p>
              <strong>DECIMA PRIMERA.-</strong> El precio del transporte debera pagarse en origen, salvo convenio entre las
              partes de pago en destino. Cuando el transporte se hubiere concertado "Flete por Cobrar", la entrega de las
              mercancias o efectos se hara contra el pago del flete y el "Transportista" tendra derecho a retenerlos mientras
              no se le cubra el precio convenido.
            </p>
            <p>
              <strong>DECIMA SEGUNDA.-</strong> Si al momento de la entrega resultare algun faltante o averia, el consignatario
              podra formular su reclamacion por escrito al "Transportista", dentro de las 24 horas siguientes.
            </p>
            <p>
              <strong>DECIMA TERCERA.-</strong> El "Transportista" queda eximido de la obligacion de recibir mercancias o
              efectos para su transporte, en los siguientes casos:
              <br />
              a) Cuando se trate de carga que por su naturaleza, peso, volumen, embalaje defectuoso o cualquier otra
              circunstancia no pueda transportarse sin destruirse o sin causar dano a los demas articulos o al material
              rodante, salvo que la empresa de que se trate tenga el equipo adecuado.
              <br />
              b) Las mercancias cuyo transporte haya sido prohibido por disposiciones legales o reglamentarias. Cuando tales
              disposiciones no prohiban precisamente el transporte de determinadas mercancias, pero si ordenen la presentacion
              de ciertos documentos para que puedan ser transportadas, el "Expedidor", "Remitente" o "Usuario" estara obligado
              a entregar al "Transportista" los documentos correspondientes.
            </p>
            <p>
              <strong>DECIMA CUARTA.-</strong> Los casos no previstos en las presentes condiciones y las quejas derivadas de su
              aplicacion se someteran por la via administrativa a la Secretaria de Infraestructura, Comunicaciones y
              Transportes.
            </p>
            <p>
              <strong>DECIMA QUINTA.-</strong> Para el caso de que el "Expedidor", "Remitente" o "Usuario" contrate carro por
              entero, este aceptara la responsabilidad solidaria para con el "Transportista" mediante la figura de la
              corresponsabilidad que contempla el articulo 10 del Reglamento Sobre el Peso, Dimensiones y Capacidad de los
              Vehiculos de Autotransporte que Transitan en los Caminos y Puentes de Jurisdiccion Federal, por lo que el
              "Expedidor", "Remitente" o "Usuario" queda obligado a verificar que la carga y el vehiculo que la transporta,
              cumplan con el peso y dimensiones maximas establecidas en la NOM-012-SCT-2-2017, o la que la sustituya.
            </p>
            <p>
              Para el caso de incumplimiento e inobservancia a las disposiciones que regulan el peso y dimensiones, por parte
              del "Expedidor", "Remitente" o "Usuario", este sera corresponsable de las infracciones y multas que la
              Secretaria de Infraestructura, Comunicaciones y Transportes o la Guardia Nacional impongan al "Transportista",
              por cargar las unidades con exceso de peso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
