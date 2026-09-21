export interface DatosConstanciaFiscal {
  rfc: string;
  curp: string;
  razonSocial: string;
  nombreComercial: string;
  fechaInicioOperaciones: string;
  estatusPadron: string;
  cp: string;
  tipoVialidad: string;
  nombreVialidad: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  entidad: string;
  entreCalle: string;
  yCalle: string;
}

/**
 * "etiqueta" y "siguientes" son fragmentos de regex (no texto literal), para
 * poder usar clases de caracteres como "[oó]" y cubrir variantes con/sin
 * acento del mismo formato oficial del SAT.
 */
function campo(texto: string, etiqueta: string, siguientes: string[]): string {
  const limite = siguientes.length > 0 ? siguientes.join('|') : '$';
  const re = new RegExp(`${etiqueta}\\s*:?\\s*(.*?)(?=${limite})`, 'i');
  const m = texto.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

/**
 * Extrae los datos de una Constancia de Situacion Fiscal real del SAT
 * (persona fisica o moral). El texto de entrada ya viene sin saltos de
 * linea relevantes (normalizado a espacios), asi que cada campo se ubica
 * buscando su etiqueta y cortando justo antes de la siguiente etiqueta
 * conocida del formato oficial.
 */
export function parseConstanciaFiscal(textoCrudo: string): DatosConstanciaFiscal {
  const texto = textoCrudo.replace(/\s+/g, ' ').trim();

  // El recuadro superior (CIF) trae el RFC y, justo antes de la etiqueta
  // "Nombre, denominacion o razon social", el nombre/razon social real --
  // funciona igual para persona fisica y moral.
  let razonSocial = '';
  const mRazon = texto.match(/Registro Federal de\s*Contribuyentes\s*(.*?)\s*Nombre,?\s*denominaci[oó]n o raz[oó]n\s*social/i);
  if (mRazon) razonSocial = mRazon[1].replace(/\s+/g, ' ').trim();

  const rfc = campo(texto, 'RFC', ['CURP:', 'Nombre \\(s\\):', 'Denominaci[oó]n o Raz[oó]n Social:']);
  const curp = campo(texto, 'CURP', ['Nombre \\(s\\):', 'Fecha inicio de operaciones:']);
  const fechaInicioOperaciones = campo(texto, 'Fecha inicio de operaciones', ['Estatus en el padr[oó]n:']);
  const estatusPadron = campo(texto, 'Estatus en el padr[oó]n', ['Fecha de [uú]ltimo cambio de estado:']);
  const nombreComercial = campo(texto, 'Nombre Comercial', ['Datos del domicilio']);

  const cp = campo(texto, 'C[oó]digo Postal', ['Tipo de Vialidad:']);
  const tipoVialidad = campo(texto, 'Tipo de Vialidad', ['Nombre de Vialidad:']);
  const nombreVialidad = campo(texto, 'Nombre de Vialidad', ['N[uú]mero Exterior:']);
  const numeroExterior = campo(texto, 'N[uú]mero Exterior', ['N[uú]mero Interior:']);
  const numeroInterior = campo(texto, 'N[uú]mero Interior', ['Nombre de la Colonia:']);
  const colonia = campo(texto, 'Nombre de la Colonia', ['Nombre de la Localidad:']);
  const localidad = campo(texto, 'Nombre de la Localidad', ['Nombre del Municipio']);
  const municipio = campo(texto, 'Nombre del Municipio o Demarcaci[oó]n Territorial', ['Nombre de la Entidad Federativa:']);
  const entidad = campo(texto, 'Nombre de la Entidad Federativa', ['Entre Calle:']);
  const entreCalle = campo(texto, 'Entre Calle', ['Y Calle:']);
  const yCalle = campo(texto, 'Y Calle', ['Actividades Econ[oó]micas:', 'Reg[ií]menes:', '$']);

  return {
    rfc,
    curp,
    razonSocial,
    nombreComercial: nombreComercial || razonSocial,
    fechaInicioOperaciones,
    estatusPadron,
    cp,
    tipoVialidad,
    nombreVialidad,
    numeroExterior,
    numeroInterior,
    colonia,
    localidad,
    municipio,
    entidad,
    entreCalle,
    yCalle,
  };
}

/** Arma un domicilio de una linea a partir de los datos ya extraidos, para el campo "Direccion" de la empresa. */
export function formatearDomicilio(d: DatosConstanciaFiscal): string {
  const partes = [
    [d.tipoVialidad, d.nombreVialidad].filter(Boolean).join(' '),
    d.numeroExterior && `No. ${d.numeroExterior}`,
    d.numeroInterior && `Int. ${d.numeroInterior}`,
    d.colonia && `Col. ${d.colonia}`,
    d.municipio,
    d.entidad,
    d.cp && `C.P. ${d.cp}`,
  ].filter(Boolean);
  return partes.join(', ');
}
