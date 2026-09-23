export interface DatosCfdi {
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  serie: string;
  folio: string;
  fecha: string;
  total: number;
}

/** Lee los datos basicos de un CFDI (factura del proveedor) directo del XML, sin libreria ni validacion con el SAT. */
export function leerCfdiXml(texto: string): DatosCfdi | null {
  const doc = new DOMParser().parseFromString(texto, 'text/xml');
  if (doc.querySelector('parsererror')) return null;

  const comprobante = doc.documentElement;
  const timbre = doc.getElementsByTagNameNS('*', 'TimbreFiscalDigital')[0];
  const emisor = doc.getElementsByTagNameNS('*', 'Emisor')[0];
  const uuid = timbre?.getAttribute('UUID') ?? '';
  if (!uuid) return null;

  return {
    uuid,
    rfcEmisor: emisor?.getAttribute('Rfc') ?? '',
    nombreEmisor: emisor?.getAttribute('Nombre') ?? '',
    serie: comprobante.getAttribute('Serie') ?? '',
    folio: comprobante.getAttribute('Folio') ?? '',
    fecha: comprobante.getAttribute('Fecha') ?? '',
    total: Number(comprobante.getAttribute('Total')) || 0,
  };
}

export async function leerCfdiArchivo(file: File): Promise<DatosCfdi | null> {
  const texto = await file.text();
  return leerCfdiXml(texto);
}
