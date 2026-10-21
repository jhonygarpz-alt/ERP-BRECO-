import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { CONFIG_AUTOTRANSPORTE_SAT } from '../lib/catalogosSat';
import { calcularTotalesConceptosViaje } from '../lib/facturacion';
import { importeALetras } from '../lib/numeroALetras';
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
  ACENTO,
  ACENTO_TINTE,
} from '../components/print/PrintKit';
import type { Caja, Cliente, ConceptoFacturacion, Destinatario, Empresa, Operador, Unidad, Viaje } from '../types';

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

export function ImprimirViajePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conImporteReal = searchParams.get('modo') !== 'cero';
  const { viajes, clientes, unidades, operadores, cajas, rutas, destinatarios, conceptosFacturacion, empresa } = useData();

  const viaje = viajes.items.find((v) => v.id === id);

  // La tabla de unidades carga fotos (base64) y puede tardar mas que el resto de
  // los catalogos -- si se imprime en cuanto llega el viaje, sin esperar a que
  // tambien terminen de cargar unidad/operador/remolque/rutas, el PDF sale con
  // esos campos vacios aunque el dato si exista en la base de datos.
  const todoCargado =
    !viajes.loading &&
    !clientes.loading &&
    !unidades.loading &&
    !operadores.loading &&
    !cajas.loading &&
    !rutas.loading &&
    !destinatarios.loading &&
    !conceptosFacturacion.loading;

  useEffect(() => {
    if (!viaje || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [viaje, todoCargado]);

  if (!viaje) {
    return <div style={pagina}>No se encontro el viaje.</div>;
  }

  if (viaje.tipoDocumento === 'CartaPorte') {
    return (
      <VistaCartaPorte
        viaje={viaje}
        conImporteReal={conImporteReal}
        cliente={clientes.items.find((c) => c.id === viaje.clienteId)}
        unidad={unidades.items.find((u) => u.id === (viaje.trayectos[0]?.unidadId || viaje.unidadId))}
        remolque1={cajas.items.find((c) => c.id === viaje.remolque1Id)}
        operador={operadores.items.find((o) => o.id === (viaje.trayectos[0]?.operadorId || viaje.operadorId))}
        rutaOrigen={destinatarios.items.find((d) => d.id === rutas.items.find((r) => r.codigo === viaje.rutaCodigo)?.origenId)}
        rutaDestino={destinatarios.items.find((d) => d.id === rutas.items.find((r) => r.codigo === viaje.rutaCodigo)?.destinoId)}
        conceptosCatalogo={conceptosFacturacion.items}
        empresa={empresa.value}
      />
    );
  }

  return (
    <VistaViajeSimple
      viaje={viaje}
      conImporteReal={conImporteReal}
      cliente={clientes.items.find((c) => c.id === viaje.clienteId)}
      operadores={operadores.items}
      unidades={unidades.items}
      remolque1={cajas.items.find((c) => c.id === viaje.remolque1Id)}
      conceptosCatalogo={conceptosFacturacion.items}
      empresa={empresa.value}
    />
  );
}

/** Carta Porte: misma estructura, componentes y colores que ImprimirFacturaPage
 * (un viaje de Carta Porte se timbra directo, sin pasar por una Factura, asi
 * que trae su propio bloque de timbrado). */
function VistaCartaPorte({
  viaje,
  conImporteReal,
  cliente,
  unidad,
  remolque1,
  operador,
  rutaOrigen,
  rutaDestino,
  conceptosCatalogo,
  empresa,
}: {
  viaje: Viaje;
  conImporteReal: boolean;
  cliente?: Cliente;
  unidad?: Unidad;
  remolque1?: Caja;
  operador?: Operador;
  rutaOrigen?: Destinatario;
  rutaDestino?: Destinatario;
  conceptosCatalogo: ConceptoFacturacion[];
  empresa: Empresa;
}) {
  const totales = calcularTotalesConceptosViaje(viaje.conceptosFacturacionViaje);
  const monedaTexto = viaje.moneda === 'DOLARES' ? 'USD' : 'MXN';
  const importeLetra = importeALetras(conImporteReal ? totales.total : 0, monedaTexto);
  const config = CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === (viaje.configVehicularClaveSat || unidad?.tipo));
  const internacional = viaje.importacion || viaje.exportacion;
  const fechaOrigenCcp = fechaHoraIso(viaje.fechaCarga || viaje.fecha, viaje.horaCarga);

  const paginaCompacta = { ...pagina, padding: 16, fontSize: 9.5 };

  return (
    <div style={paginaCompacta}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 10, alignItems: 'stretch', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {empresa.logoDataUrl && <img src={empresa.logoDataUrl} alt="" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{empresa.razonSocial || empresa.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 9 }}>RFC: {empresa.rfc || '—'}</p>
            {empresa.regimenFiscal && <p style={{ margin: '1px 0 0', fontSize: 9 }}>{empresa.regimenFiscal}</p>}
            <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#444' }}>{empresa.direccion || ''}</p>
            {!conImporteReal && <p style={{ margin: '2px 0 0', fontSize: 8.5, fontStyle: 'italic' }}>Copia sin importes</p>}
          </div>
        </div>
        <BloqueEtiquetasApiladas
          columnas={2}
          titulo="Carta Porte con Complemento 3.1"
          filas={[
            { etiqueta: 'Folio', valor: `${viaje.sucursal} ${viaje.folio}`.trim() },
            { etiqueta: 'Folio Fiscal', valor: viaje.timbrado.folioFiscal },
            { etiqueta: 'Serie Cert. Emisor', valor: viaje.timbrado.noSerieCertificadoEmisor },
            { etiqueta: 'Serie Cert. SAT', valor: viaje.timbrado.noSerieCertificadoSat },
            { etiqueta: 'Fecha Expedicion', valor: viaje.timbrado.fechaHoraExpedicion || viaje.fecha },
            { etiqueta: 'Fecha Certificacion', valor: viaje.timbrado.fechaHoraCertificacion },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>Regimen Fiscal: {cliente?.regimenFiscal ?? '—'}</p>
          <p style={{ margin: '3px 0 0' }}>Direccion: {direccionCorta(cliente)}</p>
          <p style={{ margin: '1px 0 0' }}>Ciudad: {ciudadCorta(cliente)}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: '0 0 3px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3 }}>
            Datos del Viaje
          </p>
          <p style={{ margin: 0 }}>
            <strong>No. Viaje Cliente:</strong> {viaje.loadNumber || '—'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span>
              <strong>Moneda</strong> {viaje.moneda}
            </span>
            <span>
              <strong>Distancia</strong> {viaje.kilometros} Km
            </span>
          </div>
          <p style={{ margin: '2px 0 0' }}>
            <strong>Estatus:</strong> {viaje.estatus}
          </p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
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
            {viaje.conceptosFacturacionViaje.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={7}>
                  Sin conceptos capturados.
                </td>
              </tr>
            )}
            {viaje.conceptosFacturacionViaje.map((c) => {
              const catalogo = conceptosCatalogo.find((cc) => cc.id === c.conceptoFacturacionId);
              return (
                <tr key={c.id}>
                  <td style={tdCfdi}>1</td>
                  <td style={tdCfdi}>{catalogo?.claveUnidad || c.unidadMedida || '—'}</td>
                  <td style={tdCfdi}>{catalogo?.noIdentificacion || ''}</td>
                  <td style={tdCfdi}>{catalogo?.claveProdServ || '—'}</td>
                  <td style={tdCfdi}>{c.concepto}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(conImporteReal ? c.importe : 0)}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(conImporteReal ? c.importe : 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: ACENTO, color: '#fff', textAlign: 'center', padding: '3px 8px', fontWeight: 700, fontSize: 9 }}>
          Detalle del complemento CARTA PORTE &nbsp;&nbsp; No.Viaje Cliente: {viaje.loadNumber || '—'} &nbsp;&nbsp; Viaje:{' '}
          {viaje.sucursal} - {viaje.folio}
          <br />
          IdCCP: {viaje.timbrado.idCcp || '—'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid #333' }}>
          <div style={{ background: ACENTO_TINTE, textAlign: 'center', fontSize: 8.5, fontWeight: 700, padding: '2px 0', borderBottom: '1px solid #333' }}>
            Medio de transporte
          </div>
          <div style={{ textAlign: 'center', padding: '3px 0', fontSize: 9 }}>01 - Autotransporte Federal</div>
        </div>
        <div>
          <div style={{ background: ACENTO_TINTE, textAlign: 'center', fontSize: 8.5, fontWeight: 700, padding: '2px 0', borderBottom: '1px solid #333' }}>
            Transporte Internacional
          </div>
          <div style={{ textAlign: 'center', padding: '3px 0', fontSize: 9 }}>{internacional ? 'SI' : 'NO'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px', fontSize: 9 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Origen</p>
          <p style={{ margin: '2px 0 0' }}>
            Fecha y hora de salida: {viaje.fechaCarga || viaje.fecha} {viaje.horaCarga}
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
            <p style={{ margin: '2px 0 0' }}>{viaje.origen || viaje.cargarEn || '—'}</p>
          )}
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px', fontSize: 9 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Destino</p>
          <p style={{ margin: '2px 0 0' }}>
            Fecha y hora de prog. llegada: {viaje.fechaEntrega || viaje.fecha} {viaje.horaLlegadaEstimada}
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
            <p style={{ margin: '2px 0 0' }}>{viaje.destino || viaje.descargarEn || '—'}</p>
          )}
        </Recuadro>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
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
            {viaje.materialesCarga.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={5}>
                  Sin mercancias capturadas.
                </td>
              </tr>
            )}
            {viaje.materialesCarga.map((m) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid #333' }}>
          <div style={{ background: ACENTO_TINTE, textAlign: 'center', fontSize: 8.5, fontWeight: 700, padding: '2px 0', borderBottom: '1px solid #333' }}>
            Total Distancia Recorrida
          </div>
          <div style={{ textAlign: 'center', padding: '4px 0', fontSize: 9.5 }}>{viaje.kilometros} Km</div>
        </div>
        <div>
          <div style={{ background: ACENTO_TINTE, fontSize: 8.5, fontWeight: 700, padding: '2px 8px', borderBottom: '1px solid #333' }}>Observaciones</div>
          <div style={{ padding: '3px 8px', fontSize: 9, whiteSpace: 'pre-line' }}>{viaje.observaciones || '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
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
            <div style={{ padding: '3px 8px', fontSize: 9, borderRight: '1px solid #333' }}>
              <strong>Remolque1ECO:</strong> {remolque1.economico}
              <br />
              <strong>Remolque1SAT:</strong> {remolque1.tipo}
            </div>
            <div style={{ padding: '3px 8px', fontSize: 9, borderRight: '1px solid #333', display: 'flex', alignItems: 'center' }}>
              <strong>Placa:</strong>&nbsp;{remolque1.placas}
            </div>
            <div style={{ padding: '3px 8px', fontSize: 9, display: 'flex', alignItems: 'center' }}>
              <strong>Contenedor1:</strong>&nbsp;{viaje.loadNumber || '—'}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '4px 8px', flex: 1, fontSize: 9 }}>
          <strong>Importe con letra:</strong> {importeLetra}
        </Recuadro>
        <CajaTotales
          moneda={monedaTexto}
          filas={[
            { etiqueta: 'Subtotal', valor: money(conImporteReal ? totales.subtotal : 0) },
            { etiqueta: 'IVA', valor: money(conImporteReal ? totales.totalIva : 0) },
            { etiqueta: 'Retenciones', valor: money(conImporteReal ? totales.totalRetencionIva + totales.totalIsr : 0) },
            { etiqueta: 'Total a Pagar', valor: money(conImporteReal ? totales.total : 0), destacado: true },
          ]}
        />
      </div>

      <BloqueTimbrado
        folioFiscal={viaje.timbrado.folioFiscal}
        fechaHoraCertificacion={viaje.timbrado.fechaHoraCertificacion}
        selloDigitalCfdi={viaje.timbrado.selloDigitalCfdi}
        selloDigitalSat={viaje.timbrado.selloDigitalSat}
        cadenaOriginal={viaje.timbrado.cadenaOriginal}
        rfcEmisor={empresa.rfc}
        rfcReceptor={cliente?.rfc ?? ''}
        total={totales.total}
        cartaPorte={{ idCcp: viaje.timbrado.idCcp, fechaOrigen: fechaOrigenCcp }}
      />
      <LeyendaCfdi folioFiscal={viaje.timbrado.folioFiscal} simulado={viaje.timbrado.simulado} cancelado={viaje.timbrado.cancelado} />

      <div style={{ pageBreakBefore: 'always', paddingTop: 16 }}>
        <div style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', background: ACENTO, padding: '5px 8px', borderRadius: 6 }}>
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
    </div>
  );
}

/** Viaje normal (sin Carta Porte): misma base visual que la factura
 * (encabezado, recuadros, tablas) pero sin bloque de timbrado/sellos
 * digitales -- un viaje normal no es un CFDI. */
function VistaViajeSimple({
  viaje,
  conImporteReal,
  cliente,
  operadores,
  unidades,
  remolque1,
  conceptosCatalogo,
  empresa,
}: {
  viaje: Viaje;
  conImporteReal: boolean;
  cliente?: Cliente;
  operadores: Operador[];
  unidades: Unidad[];
  remolque1?: Caja;
  conceptosCatalogo: ConceptoFacturacion[];
  empresa: Empresa;
}) {
  const trayectos = viaje.trayectos;
  const primerOperador = operadores.find((o) => o.id === (trayectos[0]?.operadorId || viaje.operadorId));
  const primeraUnidad = unidades.find((u) => u.id === (trayectos[0]?.unidadId || viaje.unidadId));
  const totalConceptos = viaje.conceptosFacturacionViaje.reduce((acc, c) => acc + (conImporteReal ? c.importe || 0 : 0), 0);

  const paginaCompacta = { ...pagina, padding: 16, fontSize: 9.5 };

  return (
    <div style={paginaCompacta}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 10, alignItems: 'stretch', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {empresa.logoDataUrl && <img src={empresa.logoDataUrl} alt="" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{empresa.razonSocial || empresa.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 9 }}>RFC: {empresa.rfc || '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#444' }}>{empresa.direccion || ''}</p>
            {!conImporteReal && <p style={{ margin: '2px 0 0', fontSize: 8.5, fontStyle: 'italic' }}>Copia sin importes</p>}
          </div>
        </div>
        <BloqueEtiquetasApiladas
          columnas={2}
          titulo="Viaje"
          filas={[
            { etiqueta: 'Folio', valor: `${viaje.sucursal} ${viaje.folio}`.trim() },
            { etiqueta: 'Fecha', valor: viaje.fecha },
            { etiqueta: 'Estatus', valor: viaje.estatus },
            { etiqueta: 'No. Viaje Cliente', valor: viaje.loadNumber },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
          <p style={{ margin: '3px 0 0' }}>Direccion: {direccionCorta(cliente)}</p>
          <p style={{ margin: '1px 0 0' }}>Ciudad: {ciudadCorta(cliente)}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: '0 0 3px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: 3 }}>
            Datos del Viaje
          </p>
          <p style={{ margin: 0 }}>
            <strong>Ruta:</strong>{' '}
            {viaje.rutaDescripcion || `${viaje.origen || viaje.cargarEn || '—'} → ${viaje.destino || viaje.descargarEn || '—'}`}
          </p>
          <p style={{ margin: '1px 0 0' }}>
            <strong>Operador:</strong> {primerOperador?.nombre ?? '—'}
          </p>
          <p style={{ margin: '1px 0 0' }}>
            <strong>Unidad:</strong> {primeraUnidad?.economico ?? '—'}
            {remolque1 && <> &middot; Remolque: {remolque1.economico}</>}
          </p>
          {viaje.kilometros > 0 && (
            <p style={{ margin: '1px 0 0' }}>
              <strong>Distancia:</strong> {viaje.kilometros} Km
            </p>
          )}
        </Recuadro>
      </div>

      {trayectos.length > 1 && (
        <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
          <TituloSeccion>Trayectos</TituloSeccion>
          <table style={tablaStyle}>
            <thead>
              <tr>
                <th style={thCfdi}>Operador</th>
                <th style={thCfdi}>Unidad</th>
                <th style={thCfdi}>Origen</th>
                <th style={thCfdi}>Destino</th>
              </tr>
            </thead>
            <tbody>
              {trayectos.map((t) => (
                <tr key={t.id}>
                  <td style={tdCfdi}>{operadores.find((o) => o.id === t.operadorId)?.nombre ?? '—'}</td>
                  <td style={tdCfdi}>{unidades.find((u) => u.id === t.unidadId)?.economico ?? '—'}</td>
                  <td style={tdCfdi}>{t.origen}</td>
                  <td style={tdCfdi}>{t.destino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viaje.materialesCarga.length > 0 && (
        <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
          <TituloSeccion>Mercancias</TituloSeccion>
          <table style={tablaStyle}>
            <thead>
              <tr>
                <th style={thCfdi}>Cantidad</th>
                <th style={thCfdi}>Empaque</th>
                <th style={thCfdi}>Descripcion</th>
                <th style={thCfdi}>Peso</th>
              </tr>
            </thead>
            <tbody>
              {viaje.materialesCarga.map((m) => (
                <tr key={m.id}>
                  <td style={tdCfdi}>{m.cantidad}</td>
                  <td style={tdCfdi}>{m.unidadEmpaque}</td>
                  <td style={tdCfdi}>{m.descripcion}</td>
                  <td style={tdCfdi}>
                    {m.peso} {m.unidadPeso}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Conceptos de Facturacion</TituloSeccion>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Clave de Medida SAT</th>
              <th style={thCfdi}>Clave Producto</th>
              <th style={thCfdi}>Concepto</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {viaje.conceptosFacturacionViaje.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={4}>
                  Sin conceptos capturados.
                </td>
              </tr>
            )}
            {viaje.conceptosFacturacionViaje.map((c) => {
              const catalogo = conceptosCatalogo.find((cc) => cc.id === c.conceptoFacturacionId);
              return (
                <tr key={c.id}>
                  <td style={tdCfdi}>{catalogo?.claveUnidad || c.unidadMedida || '—'}</td>
                  <td style={tdCfdi}>{catalogo?.claveProdServ || '—'}</td>
                  <td style={tdCfdi}>{c.concepto}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(conImporteReal ? c.importe : 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viaje.observaciones && (
        <Recuadro style={{ padding: '4px 8px', marginBottom: 6, fontSize: 9 }}>
          <strong>Observaciones:</strong> {viaje.observaciones}
        </Recuadro>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CajaTotales
          moneda={viaje.moneda === 'DOLARES' ? 'USD' : 'MXN'}
          filas={[{ etiqueta: 'Total', valor: money(totalConceptos), destacado: true }]}
        />
      </div>
    </div>
  );
}
