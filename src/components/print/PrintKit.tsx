import type { CSSProperties, ReactNode } from 'react';
import { useQrDataUrl } from '../../lib/useQrDataUrl';

/*
 * Piezas reutilizables para los formatos de impresion "estilo CFDI"
 * (Carta Porte, Factura, Nota de Credito, Complemento de Pago, etc.):
 * mismos recuadros, barras de seccion y tablas en todos, para que se vean
 * como un solo sistema de documentos en vez de cada uno con su propio
 * estilo.
 */

export const pagina: CSSProperties = {
  background: '#fff',
  color: '#111',
  minHeight: '100vh',
  padding: 28,
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 11.5,
};

/**
 * Acento de marca para que los formatos impresos no se vean puro blanco y
 * negro -- mismo acento que ya elige cada empresa en Configuracion > Temas
 * (variable --color-breco-*, con data-accent en <html>), asi que estos
 * documentos salen con el color de marca de cada empresa automaticamente.
 * El fallback fijo es el azul default por si la ventana de impresion
 * llegara a pintar antes de que la app ponga data-accent.
 */
export const ACENTO = 'var(--color-breco-600, #0058b0)';
export const ACENTO_BORDE = 'var(--color-breco-500, #0071e3)';
export const ACENTO_TINTE = 'var(--color-breco-glow, rgba(0, 113, 227, 0.14))';

export function BarraAcciones() {
  // Las clases de Tailwind (en vez de un style inline) son las que permiten
  // que "print:hidden" realmente oculte la barra al imprimir: un style
  // inline (display:flex) siempre le gana en especificidad a cualquier
  // regla de hoja de estilos, incluida @media print, asi que los botones
  // se seguian viendo (y reservando el espacio) en el PDF impreso.
  return (
    <div className="mb-3 flex justify-end gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="cursor-pointer rounded-lg border border-[#999] bg-white px-3.5 py-1.5"
      >
        Imprimir
      </button>
      <button
        onClick={() => window.close()}
        className="cursor-pointer rounded-lg border border-[#999] bg-white px-3.5 py-1.5"
      >
        Cerrar
      </button>
    </div>
  );
}

export function Recuadro({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ border: '1px solid #333', borderRadius: 10, ...style }}>{children}</div>;
}

/** Caja con una barra superior oscura (la etiqueta) y el valor debajo -- el "badge" que se usa para folio/fecha/tipo de documento, etc. */
export function CajaEtiqueta({ etiqueta, valor, tono = 'oscuro' }: { etiqueta: string; valor: ReactNode; tono?: 'oscuro' | 'claro' }) {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 6, overflow: 'hidden', textAlign: 'center' }}>
      <div
        style={{
          background: tono === 'oscuro' ? ACENTO : ACENTO_TINTE,
          color: tono === 'oscuro' ? '#fff' : '#111',
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          padding: '3px 8px',
        }}
      >
        {etiqueta}
      </div>
      <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, wordBreak: 'break-word' }}>{valor || ' '}</div>
    </div>
  );
}

/**
 * Caja de "ficha" del encabezado: un solo recuadro con renglones apilados de
 * etiqueta (barra gris) + valor (banda blanca), sin redondear cada renglon
 * por separado -- el badge del folio fiscal / series de certificado /
 * fechas que se usa en la esquina superior derecha de las representaciones
 * impresas de CFDI (Factura, Nota de Credito, Pago).
 */
export function BloqueEtiquetasApiladas({
  titulo,
  filas,
  columnas = 1,
}: {
  /** Barra oscura superior (ej. "FACTURA CON COMPLEMENTO 3.0"); opcional. */
  titulo?: string;
  filas: { etiqueta: string; valor: ReactNode }[];
  /** 2 columnas acomoda el doble de renglones en la mitad de alto -- para que esta caja no quede mucho mas alta que el bloque de logo/empresa de al lado y deje un hueco en blanco debajo. */
  columnas?: 1 | 2;
}) {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 6, overflow: 'hidden' }}>
      {titulo && (
        <div
          style={{
            background: ACENTO,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            padding: '3px 6px',
          }}
        >
          {titulo}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
        {filas.map((f, i) => (
          <div key={i} style={{ borderLeft: columnas === 2 && i % 2 === 1 ? '1px solid #333' : undefined }}>
            <div
              style={{
                background: ACENTO_TINTE,
                fontSize: 8,
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 0.2,
                padding: '1.5px 6px',
                borderTop: '1px solid #333',
              }}
            >
              {f.etiqueta}
            </div>
            <div style={{ padding: '2px 6px', fontSize: 9.5, fontWeight: 600, textAlign: 'center', wordBreak: 'break-word' }}>
              {f.valor || ' '}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barra completa de titulo de seccion (ej. "Detalle del complemento CARTA PORTE"). */
export function TituloSeccion({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: ACENTO,
        color: '#fff',
        textAlign: 'center',
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        padding: '2.5px 8px',
        borderBottom: '1px solid #333',
      }}
    >
      {children}
    </div>
  );
}

export const tablaStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 9.5 };
export const thCfdi: CSSProperties = {
  textAlign: 'left',
  padding: '2.5px 6px',
  background: ACENTO_TINTE,
  fontSize: 8.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${ACENTO_BORDE}`,
};
export const tdCfdi: CSSProperties = { padding: '2.5px 6px', borderBottom: '1px solid #ddd' };

export function FilaEtiquetaValor({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <p style={{ margin: '1px 0' }}>
      <strong>{etiqueta}:</strong> {valor || '—'}
    </p>
  );
}

export function CajaTotales({
  filas,
  moneda,
}: {
  filas: { etiqueta: string; valor: string; destacado?: boolean }[];
  moneda?: string;
}) {
  return (
    <div style={{ marginLeft: 'auto', width: 220, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
      {filas.map((f, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '2.5px 8px',
            background: f.destacado ? ACENTO : i % 2 === 0 ? '#fff' : '#f7f7f7',
            color: f.destacado ? '#fff' : '#111',
            fontWeight: f.destacado ? 700 : 400,
            fontSize: f.destacado ? 10.5 : 9.5,
            borderTop: i === 0 ? undefined : '1px solid #ddd',
          }}
        >
          <span>{f.etiqueta}</span>
          <span>{f.valor}</span>
        </div>
      ))}
      {moneda && (
        <div style={{ padding: '2px 8px', fontSize: 8.5, color: '#666', textAlign: 'right' }}>Moneda: {moneda}</div>
      )}
    </div>
  );
}

/**
 * Arma la URL oficial del SAT para el QR "de ingreso" (todo CFDI) que
 * permite consultar el comprobante en verificacfdi.facturaelectronica.sat.gob.mx
 * -- antes este bloque solo metia el UUID pelado al QR, que no es un enlace
 * valido; ahora arma la URL real con los parametros que exige el SAT.
 */
function urlQrIngreso(folioFiscal: string, rfcEmisor: string, rfcReceptor: string, total: number, selloDigitalCfdi: string): string {
  const params = new URLSearchParams({
    id: folioFiscal,
    re: rfcEmisor,
    rr: rfcReceptor,
    tt: total.toFixed(6),
    fe: (selloDigitalCfdi || '').trim().slice(-8),
  });
  return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?${params.toString()}`;
}

/**
 * Arma la URL oficial del SAT para el segundo QR que exige el Complemento
 * Carta Porte (QR CCP), distinto del QR de ingreso del CFDI: usa el
 * servicio de verificacion especifico de Carta Porte con el IdCCP y las
 * fechas de salida de origen / certificacion del comprobante.
 */
function urlQrCcp(idCcp: string, fechaOrigen: string, fechaTimbrado: string): string {
  const params = new URLSearchParams({ IdCCP: idCcp, FechaOrig: fechaOrigen, FechaTimb: fechaTimbrado });
  return `https://verificacfdi.facturaelectronica.sat.gob.mx/verificaccp/default.aspx?${params.toString()}`;
}

/** Sello/QR de timbrado: si no hay folio fiscal (CFDI aun no timbrado) deja la caja vacia con la leyenda correspondiente, en vez de inventar datos. */
export function BloqueTimbrado({
  folioFiscal,
  fechaHoraCertificacion,
  selloDigitalCfdi,
  selloDigitalSat,
  cadenaOriginal,
  rfcEmisor,
  rfcReceptor,
  total,
  cartaPorte,
}: {
  folioFiscal: string;
  fechaHoraCertificacion: string;
  selloDigitalCfdi: string;
  selloDigitalSat: string;
  cadenaOriginal: string;
  /** Para armar el QR de ingreso (default: todo CFDI lo exige). */
  rfcEmisor: string;
  rfcReceptor: string;
  total: number;
  /** Si el CFDI trae Complemento Carta Porte, agrega el segundo QR (QR CCP) a la izquierda. */
  cartaPorte?: { idCcp: string; fechaOrigen: string };
}) {
  const qrIngresoUrl = useQrDataUrl(folioFiscal ? urlQrIngreso(folioFiscal, rfcEmisor, rfcReceptor, total, selloDigitalCfdi) : '');
  const qrCcpUrl = useQrDataUrl(
    folioFiscal && cartaPorte ? urlQrCcp(cartaPorte.idCcp, cartaPorte.fechaOrigen, fechaHoraCertificacion) : '',
  );

  if (!folioFiscal) {
    return (
      <Recuadro style={{ padding: '10px 14px', textAlign: 'center', color: '#666', fontSize: 10.5 }}>
        Este CFDI todavia no ha sido timbrado ante el SAT. El folio fiscal, los sellos digitales y el QR apareceran aqui en
        cuanto se timbre.
      </Recuadro>
    );
  }

  const casillaQr = (titulo: string, url: string | null, lado: 'left' | 'right') => (
    <div style={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ padding: 5 }}>
        {url ? (
          <img src={url} alt={titulo} style={{ width: 90, height: 90 }} />
        ) : (
          <div style={{ width: 90, height: 90, border: '1px dashed #999' }} />
        )}
      </div>
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          fontSize: 8.5,
          fontWeight: 700,
          color: '#fff',
          background: ACENTO,
          padding: '2px 0',
          borderTop: '1px solid #333',
          [lado === 'left' ? 'borderRight' : 'borderLeft']: '1px solid #333',
        }}
      >
        {titulo}
      </div>
    </div>
  );

  return (
    <div style={{ border: '1px solid #333', borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
      {cartaPorte && casillaQr('QR CCP', qrCcpUrl, 'left')}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: cartaPorte ? '1px solid #333' : undefined, borderRight: '1px solid #333' }}>
        <div style={{ padding: '3px 8px', fontSize: 8, borderBottom: '1px solid #ddd' }}>
          <strong>Cadena Original del complemento de certificacion digital SAT</strong>
          <p style={{ margin: '1px 0 0', wordBreak: 'break-all', color: '#444' }}>{cadenaOriginal || '—'}</p>
        </div>
        <div style={{ padding: '3px 8px', fontSize: 8, borderBottom: '1px solid #ddd' }}>
          <strong>Sello Digital del CFDI</strong>
          <p style={{ margin: '1px 0 0', wordBreak: 'break-all', color: '#444' }}>{selloDigitalCfdi || '—'}</p>
        </div>
        <div style={{ padding: '3px 8px', fontSize: 8, flex: 1 }}>
          <strong>Sello del SAT</strong>
          <p style={{ margin: '1px 0 0', wordBreak: 'break-all', color: '#444' }}>{selloDigitalSat || '—'}</p>
        </div>
      </div>
      {casillaQr('QR INGRESO', qrIngresoUrl, 'right')}
    </div>
  );
}

/** Leyenda final del documento, honesta segun el estado real del timbrado (nunca afirma un timbrado que no existe). */
export function LeyendaCfdi({ folioFiscal, simulado, cancelado }: { folioFiscal: string; simulado: boolean; cancelado: boolean }) {
  let texto = 'Este documento aun no ha sido timbrado ante el SAT -- no es un CFDI valido.';
  let fondo: string = ACENTO_TINTE;
  if (folioFiscal && cancelado) {
    texto = 'Este CFDI fue cancelado ante el SAT.';
    fondo = 'rgba(220, 38, 38, 0.14)';
  } else if (folioFiscal && simulado) {
    texto = 'SIMULACION interna -- no es un CFDI valido ante el SAT.';
    fondo = 'rgba(180, 83, 9, 0.16)';
  } else if (folioFiscal) {
    texto = 'Este documento es una representacion impresa de un CFDI.';
  }
  return (
    <div style={{ marginTop: 6, textAlign: 'center', fontSize: 8.5, fontWeight: 700, background: fondo, padding: '3px 8px', borderRadius: 6 }}>
      {texto}
    </div>
  );
}
