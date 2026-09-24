import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { CONFIG_AUTOTRANSPORTE_SAT, TIPO_PERMISO_SCT } from '../lib/catalogosSat';
import { calcularTotalesConceptosViaje } from '../lib/facturacion';
import { importeALetras } from '../lib/numeroALetras';
import { pesoBrutoVehicular } from '../lib/cartaPorte';
import { useQrDataUrl } from '../lib/useQrDataUrl';
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

function pesoCargaEnKg(peso: number, unidad: string): number {
  if (unidad === 'TONELADAS') return peso * 1000;
  if (unidad === 'LIBRAS') return peso * 0.453592;
  return peso;
}

export function ImprimirViajePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conImporteReal = searchParams.get('modo') !== 'cero';
  const { viajes, clientes, unidades, operadores, cajas, rutas, destinatarios, conceptosFacturacion, empresa } = useData();

  const viaje = viajes.items.find((v) => v.id === id);

  useEffect(() => {
    if (!viaje) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [viaje]);

  if (!viaje) {
    return <div style={pagina}>No se encontro el viaje.</div>;
  }

  if (viaje.tipoDocumento === 'CartaPorte') {
    return (
      <VistaCartaPorte
        viaje={viaje}
        cliente={clientes.items.find((c) => c.id === viaje.clienteId)}
        unidad={unidades.items.find((u) => u.id === (viaje.trayectos[0]?.unidadId || viaje.unidadId))}
        remolque1={cajas.items.find((c) => c.id === viaje.remolque1Id)}
        remolque2={cajas.items.find((c) => c.id === viaje.remolque2Id)}
        dolly={cajas.items.find((c) => c.id === viaje.dollyId)}
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
      dolly={cajas.items.find((c) => c.id === viaje.dollyId)}
      remolque2={cajas.items.find((c) => c.id === viaje.remolque2Id)}
      empresa={empresa.value}
    />
  );
}

function VistaCartaPorte({
  viaje,
  cliente,
  unidad,
  remolque1,
  remolque2,
  dolly,
  operador,
  rutaOrigen,
  rutaDestino,
  conceptosCatalogo,
  empresa,
}: {
  viaje: Viaje;
  cliente?: Cliente;
  unidad?: Unidad;
  remolque1?: Caja;
  remolque2?: Caja;
  dolly?: Caja;
  operador?: Operador;
  rutaOrigen?: Destinatario;
  rutaDestino?: Destinatario;
  conceptosCatalogo: ConceptoFacturacion[];
  empresa: Empresa;
}) {
  const totales = calcularTotalesConceptosViaje(viaje.conceptosFacturacionViaje);
  const importeLetra = importeALetras(totales.total, viaje.moneda === 'DOLARES' ? 'USD' : 'MXN');
  const config = CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === (viaje.configVehicularClaveSat || unidad?.tipo));
  const permiso = TIPO_PERMISO_SCT.find((p) => p.clave === unidad?.claveTipoPermisoSct);
  const qrDataUrl = useQrDataUrl(viaje.timbrado.folioFiscal);
  const internacional = viaje.importacion || viaje.exportacion;

  return (
    <div style={pagina}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {empresa.logoDataUrl && <img src={empresa.logoDataUrl} alt="" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{empresa.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 10.5 }}>RFC: {empresa.rfc || '—'}</p>
            {empresa.regimenFiscal && <p style={{ margin: '1px 0 0', fontSize: 10.5 }}>{empresa.regimenFiscal}</p>}
            <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#444' }}>{empresa.direccion || ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <CajaEtiqueta etiqueta="Carta Porte con Complemento" valor={viaje.folio} />
          <CajaEtiqueta etiqueta="Version Complemento Carta Porte" valor="3.1" tono="claro" />
          <CajaEtiqueta etiqueta="IdCCP" valor={viaje.timbrado.idCcp} tono="claro" />
          <CajaEtiqueta etiqueta="No. Serie Certificado del Emisor" valor={viaje.timbrado.noSerieCertificadoEmisor} tono="claro" />
          <CajaEtiqueta etiqueta="Fecha Hora Expedicion" valor={viaje.timbrado.fechaHoraExpedicion || viaje.fecha} tono="claro" />
          <CajaEtiqueta etiqueta="Total Distancia Recorrida" valor={`${viaje.kilometros} Km`} tono="claro" />
        </div>
      </div>

      <Recuadro style={{ padding: '8px 12px', marginBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>Cliente: {cliente?.nombre ?? '—'}</p>
        <p style={{ margin: '1px 0 0' }}>RFC: {cliente?.rfc ?? '—'}</p>
        <p style={{ margin: '4px 0 0' }}>Direccion: {direccionCorta(cliente)}</p>
        <p style={{ margin: '1px 0 0' }}>Ciudad: {ciudadCorta(cliente)}</p>
      </Recuadro>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Detalle de mercancias</TituloSeccion>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Bienes Transportados</th>
              <th style={thCfdi}>Clave Unidad</th>
              <th style={thCfdi}>Cantidad</th>
              <th style={thCfdi}>Peso (Kg)</th>
              <th style={thCfdi}>Material Peligroso</th>
              <th style={thCfdi}>Embalaje</th>
            </tr>
          </thead>
          <tbody>
            {viaje.materialesCarga.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={6}>
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
                <td style={tdCfdi}>{m.peso}</td>
                <td style={tdCfdi}>{m.materialPeligroso ? `SI (${m.claveMaterialPeligroso || 'sin clave'})` : 'NO'}</td>
                <td style={tdCfdi}>{m.claveEmbalajeSat ? `${m.claveEmbalajeSat} - ${m.descripcionEmbalajeSat || ''}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {viaje.materialesCarga.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 10, borderTop: '1px solid #ddd' }}>
            <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
              <strong>Peso Bruto Total:</strong> {viaje.pesoCargaTotal} {viaje.pesoCargaUnidad}
            </div>
            <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
              <strong>Numero de Mercancias:</strong> {viaje.materialesCarga.length}
            </div>
            <div style={{ padding: '5px 10px' }}>
              <strong>Moneda:</strong> {viaje.moneda === 'DOLARES' ? 'USD' : 'MXN'}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Detalle del complemento Carta Porte</TituloSeccion>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 10.5 }}>
          <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
            <strong>Medio de transporte:</strong> 01 - Autotransporte Federal
          </div>
          <div style={{ padding: '5px 10px' }}>
            <strong>Transporte Internacional:</strong> {internacional ? 'SI' : 'NO'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '8px 10px', fontSize: 10.5 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Origen</p>
          <p style={{ margin: '2px 0 0' }}>Fecha y hora de salida: {viaje.fechaCarga || viaje.fecha} {viaje.horaCarga}</p>
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
        <Recuadro style={{ padding: '8px 10px', fontSize: 10.5 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Destino</p>
          <p style={{ margin: '2px 0 0' }}>Fecha y hora de prog. llegada: {viaje.fechaEntrega || viaje.fecha} {viaje.horaEntregaReal}</p>
          <p style={{ margin: '1px 0 0' }}>Distancia recorrida: {viaje.kilometros} Km</p>
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

      <div style={{ marginBottom: 10, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Conceptos de Cobro</TituloSeccion>
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
            {viaje.conceptosFacturacionViaje.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={6}>
                  Sin conceptos capturados.
                </td>
              </tr>
            )}
            {viaje.conceptosFacturacionViaje.map((c) => {
              const catalogo = conceptosCatalogo.find((cc) => cc.id === c.conceptoFacturacionId);
              return (
                <tr key={c.id}>
                  <td style={tdCfdi}>1</td>
                  <td style={tdCfdi}>{catalogo?.claveUnidad || '—'}</td>
                  <td style={tdCfdi}>{catalogo?.claveProdServ || '—'}</td>
                  <td style={tdCfdi}>{c.concepto}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(c.importe)}</td>
                  <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(c.importe)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viaje.observaciones && (
        <Recuadro style={{ padding: '6px 10px', marginBottom: 10, fontSize: 10 }}>
          <strong>Observaciones:</strong> {viaje.observaciones}
        </Recuadro>
      )}

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
              <th style={thCfdi}>Año/Modelo</th>
              <th style={thCfdi}>Peso Bruto Vehicular</th>
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
              <td style={tdCfdi}>{unidad?.anio || '—'}</td>
              <td style={tdCfdi}>{pesoBrutoVehicular(unidad, remolque1, remolque2, pesoCargaEnKg(viaje.pesoCargaTotal, viaje.pesoCargaUnidad))} Ton</td>
            </tr>
          </tbody>
        </table>
        {(remolque1 || remolque2 || dolly) && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[remolque1, remolque2, dolly].filter(Boolean).length}, 1fr)`, fontSize: 10, borderTop: '1px solid #ddd' }}>
            {remolque1 && (
              <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
                <strong>Remolque1:</strong> {remolque1.tipo} &middot; {remolque1.placas}
              </div>
            )}
            {remolque2 && (
              <div style={{ padding: '5px 10px', borderRight: '1px solid #ddd' }}>
                <strong>Remolque2:</strong> {remolque2.tipo} &middot; {remolque2.placas}
              </div>
            )}
            {dolly && (
              <div style={{ padding: '5px 10px' }}>
                <strong>Dolly:</strong> {dolly.economico} &middot; {dolly.placas}
              </div>
            )}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <Recuadro style={{ padding: '6px 10px', flex: 1, fontSize: 10 }}>
          <strong>Importe con letra:</strong> {importeLetra}
        </Recuadro>
        <CajaTotales
          moneda={viaje.moneda === 'DOLARES' ? 'USD' : 'MXN'}
          filas={[
            { etiqueta: 'Subtotal', valor: money(totales.subtotal) },
            { etiqueta: 'IVA', valor: money(totales.totalIva) },
            { etiqueta: 'Retenciones', valor: money(totales.totalRetencionIva + totales.totalIsr) },
            { etiqueta: 'Total a Pagar', valor: money(totales.total), destacado: true },
          ]}
        />
      </div>

      <BloqueTimbrado
        folioFiscal={viaje.timbrado.folioFiscal}
        fechaHoraExpedicion={viaje.timbrado.fechaHoraExpedicion}
        fechaHoraCertificacion={viaje.timbrado.fechaHoraCertificacion}
        noSerieCertificadoEmisor={viaje.timbrado.noSerieCertificadoEmisor}
        noSerieCertificadoSat={viaje.timbrado.noSerieCertificadoSat}
        selloDigitalCfdi={viaje.timbrado.selloDigitalCfdi}
        selloDigitalSat={viaje.timbrado.selloDigitalSat}
        cadenaOriginal={viaje.timbrado.cadenaOriginal}
        qrDataUrl={qrDataUrl}
      />
      <LeyendaCfdi folioFiscal={viaje.timbrado.folioFiscal} simulado={viaje.timbrado.simulado} cancelado={viaje.timbrado.cancelado} />
    </div>
  );
}

function VistaViajeSimple({
  viaje,
  conImporteReal,
  cliente,
  operadores,
  unidades,
  remolque1,
  dolly,
  remolque2,
  empresa,
}: {
  viaje: Viaje;
  conImporteReal: boolean;
  cliente?: Cliente;
  operadores: { id: string; nombre: string }[];
  unidades: { id: string; economico: string }[];
  remolque1?: { economico: string };
  dolly?: { economico: string };
  remolque2?: { economico: string };
  empresa: Empresa;
}) {
  const trayectos = viaje.trayectos.length ? viaje.trayectos : [];
  const primerOperador = operadores.find((o) => o.id === (trayectos[0]?.operadorId || viaje.operadorId));
  const totalConceptos = conImporteReal ? viaje.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0) : 0;

  return (
    <div style={pagina}>
      <BarraAcciones />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {empresa.logoDataUrl && <img src={empresa.logoDataUrl} alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{empresa.nombre || 'Sistema de Trafico'}</h1>
            <p style={{ margin: 0, color: '#555' }}>Viaje {viaje.folio}</p>
            {!conImporteReal && <p style={{ margin: 0, color: '#555', fontStyle: 'italic' }}>Copia sin importes</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>
            <strong>Fecha:</strong> {viaje.fecha}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Estatus:</strong> {viaje.estatus}
          </p>
          {viaje.loadNumber && (
            <p style={{ margin: 0 }}>
              <strong>Numero de Viaje del Cliente:</strong> {viaje.loadNumber}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Cliente</h2>
          <p style={{ margin: 0 }}>{cliente?.nombre ?? '—'}</p>
          <p style={{ margin: 0, color: '#555' }}>{cliente?.rfc ?? ''}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Ruta</h2>
          <p style={{ margin: 0 }}>
            {viaje.rutaCodigo && `${viaje.rutaCodigo} — `}
            {viaje.rutaDescripcion || `${viaje.origen || '—'} → ${viaje.destino || '—'}`}
          </p>
          {viaje.kilometros > 0 && <p style={{ margin: 0, color: '#555' }}>{viaje.kilometros} km</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={sectionTitle}>Operador</h2>
          <p style={{ margin: 0 }}>{primerOperador?.nombre ?? '—'}</p>
        </div>
        <div>
          <h2 style={sectionTitle}>Remolque / Dolly</h2>
          <p style={{ margin: 0 }}>{remolque1?.economico ?? '—'}</p>
          {dolly && <p style={{ margin: 0 }}>Dolly: {dolly.economico}</p>}
          {remolque2 && <p style={{ margin: 0 }}>Remolque 2: {remolque2.economico}</p>}
        </div>
        <div>
          <h2 style={sectionTitle}>Carga / Entrega</h2>
          <p style={{ margin: 0 }}>Cargar en: {viaje.cargarEn || '—'}</p>
          <p style={{ margin: 0 }}>Descargar en: {viaje.descargarEn || '—'}</p>
        </div>
      </div>

      {trayectos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Trayectos</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Operador</th>
                <th style={thStyle}>Camion</th>
                <th style={thStyle}>Origen</th>
                <th style={thStyle}>Destino</th>
              </tr>
            </thead>
            <tbody>
              {trayectos.map((t) => (
                <tr key={t.id}>
                  <td style={tdStyle}>{operadores.find((o) => o.id === t.operadorId)?.nombre ?? '—'}</td>
                  <td style={tdStyle}>{unidades.find((u) => u.id === t.unidadId)?.economico ?? '—'}</td>
                  <td style={tdStyle}>{t.origen}</td>
                  <td style={tdStyle}>{t.destino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viaje.materialesCarga.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Mercancias</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Cantidad</th>
                <th style={thStyle}>Empaque</th>
                <th style={thStyle}>Descripcion</th>
                <th style={thStyle}>Peso</th>
              </tr>
            </thead>
            <tbody>
              {viaje.materialesCarga.map((m) => (
                <tr key={m.id}>
                  <td style={tdStyle}>{m.cantidad}</td>
                  <td style={tdStyle}>{m.unidadEmpaque}</td>
                  <td style={tdStyle}>{m.descripcion}</td>
                  <td style={tdStyle}>
                    {m.peso} {m.unidadPeso}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: 'right', margin: '4px 0 0' }}>
            <strong>Peso total:</strong> {viaje.pesoCargaTotal} {viaje.pesoCargaUnidad}
          </p>
        </div>
      )}

      {viaje.conceptosFacturacionViaje.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Conceptos de Facturacion</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Concepto</th>
                <th style={thStyle}>Unidad de Medida</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {viaje.conceptosFacturacionViaje.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>{c.concepto}</td>
                  <td style={tdStyle}>{c.unidadMedida}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{money(conImporteReal ? c.importe : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: 'right', margin: '4px 0 0' }}>
            <strong>Total:</strong> {money(totalConceptos)}
          </p>
        </div>
      )}

      {viaje.observaciones && (
        <div>
          <h2 style={sectionTitle}>Observaciones</h2>
          <p style={{ margin: 0 }}>{viaje.observaciones}</p>
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#555',
  margin: '0 0 4px',
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #999', padding: '4px 6px', fontSize: 11, textTransform: 'uppercase', color: '#555' };
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #ddd', padding: '4px 6px' };
