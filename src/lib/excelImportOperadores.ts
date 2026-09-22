import { operadorToRow } from './mappers';
import { uid } from './storage';
import { booleano, descargarPlantilla, guardarEnLotes, leerFilasHoja, texto, type FilaImport } from './excelImportShared';
import type { Operador } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'numero', campo: 'numero' },
  { clave: 'nombre(s)', campo: 'nombres' },
  { clave: 'apellido paterno', campo: 'apellidoPaterno' },
  { clave: 'apellido materno', campo: 'apellidoMaterno' },
  { clave: 'rfc', campo: 'rfc' },
  { clave: 'curp', campo: 'curp' },
  { clave: 'activo', campo: 'activo' },
  { clave: 'es permisionario', campo: 'esPermisionario' },
  { clave: 'es extranjero', campo: 'esExtranjero' },
  { clave: 'fecha de contratacion', campo: 'fechaContratacion' },
  { clave: 'sucursal', campo: 'sucursal' },
  { clave: 'telefono', campo: 'telefono' },
  { clave: 'celular', campo: 'celular' },
  { clave: 'licencia', campo: 'licencia' },
  { clave: 'vigencia licencia', campo: 'vigenciaLicencia' },
  { clave: 'clasificacion', campo: 'clasificacion' },
  { clave: 'pais', campo: 'pais' },
  { clave: 'c.p.', campo: 'cp' },
  { clave: 'estado', campo: 'estado' },
  { clave: 'municipio', campo: 'municipio' },
  { clave: 'colonia', campo: 'colonia' },
  { clave: 'localidad', campo: 'localidad' },
  { clave: 'calle', campo: 'calle' },
  { clave: 'no. exterior', campo: 'numeroExterior' },
  { clave: 'no. interior', campo: 'numeroInterior' },
  { clave: 'banco', campo: 'banco' },
  { clave: 'cuenta clabe', campo: 'cuentaClabe' },
];

const ENCABEZADOS = [
  'Numero', 'Nombre(s)', 'Apellido Paterno', 'Apellido Materno', 'RFC', 'CURP', 'Activo', 'Es Permisionario',
  'Es Extranjero', 'Fecha de Contratacion', 'Sucursal', 'Telefono', 'Celular', 'Licencia', 'Vigencia Licencia',
  'Clasificacion', 'Pais', 'C.P.', 'Estado', 'Municipio', 'Colonia', 'Localidad', 'Calle', 'No. Exterior',
  'No. Interior', 'Banco', 'Cuenta CLABE',
];

function fechaISO(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return texto(valor);
}

export function descargarPlantillaOperadores(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Importar_Operadores.xlsx',
    nombreHojaDatos: 'Operadores',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Operadores',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Operadores".',
      '2. Llena una fila por cada operador, empezando en la fila 2.',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
      '4. El Numero, el RFC y la Licencia no se pueden repetir; si el Numero se deja en blanco, se genera automaticamente.',
      '5. Documentos, vencimientos, foto e informacion medica se agregan despues, editando cada operador ya importado.',
    ],
    instrucciones: [
      ['Numero', 'Opcional. Si se deja en blanco, el sistema lo asigna automaticamente al importar.'],
      ['Nombre(s)', 'Obligatorio.'],
      ['Apellido Paterno', 'Obligatorio.'],
      ['Apellido Materno', 'Opcional.'],
      ['RFC', 'Obligatorio. No se puede repetir.'],
      ['CURP', 'Opcional.'],
      ['Activo', 'Si o No. Si se deja en blanco se considera Si (activo).'],
      ['Es Permisionario', 'Si o No.'],
      ['Es Extranjero', 'Si o No.'],
      ['Fecha de Contratacion', 'Opcional. Formato AAAA-MM-DD.'],
      ['Sucursal', 'Opcional. Si se deja en blanco se usa "Matriz".'],
      ['Telefono', 'Opcional.'],
      ['Celular', 'Opcional.'],
      ['Licencia', 'Opcional, pero no se puede repetir si se llena.'],
      ['Vigencia Licencia', 'Opcional. Formato AAAA-MM-DD.'],
      ['Clasificacion', 'Opcional. Debe coincidir con una fila del catalogo "Clasificaciones de Operador" (ej. Propio, Permisionario, Torton, Full, Tractocamion, Camionetas).'],
      ['Pais', 'Opcional. Si se deja en blanco se usa "Mexico".'],
      ['C.P.', 'Codigo postal (5 digitos). Opcional.'],
      ['Estado', 'Opcional.'],
      ['Municipio', 'Opcional.'],
      ['Colonia', 'Opcional.'],
      ['Localidad', 'Opcional.'],
      ['Calle', 'Opcional.'],
      ['No. Exterior', 'Opcional.'],
      ['No. Interior', 'Opcional.'],
      ['Banco', 'Opcional.'],
      ['Cuenta CLABE', 'Opcional.'],
    ],
  });
}

export async function leerOperadoresExcel(file: File): Promise<{ totalFilasHoja: number; filas: FilaImport<Operador>[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Operadores');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('nombres') ?? -1) === -1 || (indices.get('apellidoPaterno') ?? -1) === -1 || (indices.get('rfc') ?? -1) === -1) {
    throw new Error(
      'No se encontraron las columnas "Nombre(s)", "Apellido Paterno" y/o "RFC". Usa la plantilla descargable sin modificar los encabezados.',
    );
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImport<Operador>[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const nombres = texto(col('nombres', fila));
    const apellidoPaterno = texto(col('apellidoPaterno', fila));
    const apellidoMaterno = texto(col('apellidoMaterno', fila));
    const rfc = texto(col('rfc', fila)).toUpperCase();
    const errores: string[] = [];
    if (!nombres) errores.push('Falta el Nombre(s).');
    if (!apellidoPaterno) errores.push('Falta el Apellido Paterno.');
    if (!rfc) errores.push('Falta el RFC.');

    const item: Operador = {
      id: uid('op'),
      numero: texto(col('numero', fila)),
      nombre: [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim(),
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      activo: col('activo', fila) === null ? true : booleano(col('activo', fila)),
      esPermisionario: booleano(col('esPermisionario', fila)),
      esExtranjero: booleano(col('esExtranjero', fila)),
      rfc,
      curp: texto(col('curp', fila)).toUpperCase(),
      fechaContratacion: fechaISO(col('fechaContratacion', fila)),
      sucursal: texto(col('sucursal', fila)) || 'Matriz',
      telefono: texto(col('telefono', fila)),
      celular: texto(col('celular', fila)),
      hashGmtgps: '',
      registroPatronal: '',
      fotoDataUrl: '',
      observaciones: '',
      pais: texto(col('pais', fila)) || 'Mexico',
      estado: texto(col('estado', fila)),
      municipio: texto(col('municipio', fila)),
      localidad: texto(col('localidad', fila)),
      cp: texto(col('cp', fila)).replace(/\D/g, ''),
      colonia: texto(col('colonia', fila)),
      calle: texto(col('calle', fila)),
      numeroExterior: texto(col('numeroExterior', fila)),
      numeroInterior: texto(col('numeroInterior', fila)),
      domicilioReferencia: '',
      licencia: texto(col('licencia', fila)).toUpperCase(),
      vigenciaLicencia: fechaISO(col('vigenciaLicencia', fila)),
      pasaporte: '',
      vigenciaPasaporte: '',
      licenciaB: false,
      licenciaC: false,
      licenciaE: false,
      noImss: '',
      grupoSanguineo: '',
      alergias: '',
      diabetico: false,
      hipertenso: false,
      documentos: [],
      vencimientos: [],
      banco: texto(col('banco', fila)),
      cuentaClabe: texto(col('cuentaClabe', fila)),
      noTarjeta: '',
      estatus: 'Disponible',
      clasificacion: texto(col('clasificacion', fila)),
    };

    filas.push({ fila: i + 1, item, errores });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}

export function marcarDuplicadosOperadores(filas: FilaImport<Operador>[], existentes: Operador[]): FilaImport<Operador>[] {
  const vistosNumero = new Set<string>();
  const vistosRfc = new Set<string>();
  const vistosLicencia = new Set<string>();
  return filas.map((f) => {
    const errores = [...f.errores];
    const numero = f.item.numero.trim();
    const rfc = f.item.rfc.trim().toUpperCase();
    const licencia = f.item.licencia.trim().toUpperCase();

    if (numero) {
      if (existentes.some((o) => o.numero === numero)) errores.push(`El numero "${numero}" ya existe.`);
      else if (vistosNumero.has(numero)) errores.push(`El numero "${numero}" esta repetido en el archivo.`);
      else vistosNumero.add(numero);
    }
    if (rfc) {
      if (existentes.some((o) => o.rfc.trim().toUpperCase() === rfc)) errores.push(`El RFC "${rfc}" ya existe.`);
      else if (vistosRfc.has(rfc)) errores.push(`El RFC "${rfc}" esta repetido en el archivo.`);
      else vistosRfc.add(rfc);
    }
    if (licencia) {
      if (existentes.some((o) => o.licencia.trim().toUpperCase() === licencia)) errores.push(`La licencia "${licencia}" ya existe.`);
      else if (vistosLicencia.has(licencia)) errores.push(`La licencia "${licencia}" esta repetida en el archivo.`);
      else vistosLicencia.add(licencia);
    }

    return errores.length === f.errores.length ? f : { ...f, errores };
  });
}

export async function guardarOperadoresImportados(items: Operador[], onProgreso?: (hecho: number, total: number) => void): Promise<void> {
  await guardarEnLotes('operadores', items, operadorToRow, onProgreso);
}
