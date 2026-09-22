import { destinatarioToRow } from './mappers';
import { uid } from './storage';
import { booleano, descargarPlantilla, guardarEnLotes, leerFilasHoja, texto, type FilaImport } from './excelImportShared';
import type { Cliente, Destinatario } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'numero', campo: 'numero' },
  { clave: 'nombre', campo: 'nombre' },
  { clave: 'rfc', campo: 'rfc' },
  { clave: 'no. equivalencia', campo: 'noEquivalencia' },
  { clave: 'activo', campo: 'activo' },
  { clave: 'es patio', campo: 'esPatio' },
  { clave: 'numero cliente', campo: 'numeroCliente' },
  { clave: 'pais', campo: 'pais' },
  { clave: 'c.p.', campo: 'cp' },
  { clave: 'estado', campo: 'estado' },
  { clave: 'municipio', campo: 'municipio' },
  { clave: 'colonia', campo: 'colonia' },
  { clave: 'localidad', campo: 'localidad' },
  { clave: 'calle', campo: 'calle' },
  { clave: 'no. exterior', campo: 'numeroExterior' },
  { clave: 'no. interior', campo: 'numeroInterior' },
  { clave: 'telefono', campo: 'telefono' },
  { clave: 'contacto', campo: 'contacto' },
  { clave: 'correo', campo: 'correo' },
];

const ENCABEZADOS = [
  'Numero', 'Nombre', 'RFC', 'No. Equivalencia', 'Activo', 'Es Patio', 'Numero Cliente', 'Pais', 'C.P.', 'Estado',
  'Municipio', 'Colonia', 'Localidad', 'Calle', 'No. Exterior', 'No. Interior', 'Telefono', 'Contacto', 'Correo',
];

export function descargarPlantillaDestinatarios(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Importar_Destinatarios.xlsx',
    nombreHojaDatos: 'Destinatarios',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Destinatarios',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Destinatarios".',
      '2. Llena una fila por cada remitente-destinatario, empezando en la fila 2.',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
      '4. El Numero no se puede repetir; si se deja en blanco, se genera automaticamente. El RFC si puede repetirse (un mismo cliente puede tener varias ubicaciones con el mismo RFC).',
    ],
    instrucciones: [
      ['Numero', 'Opcional. Si se deja en blanco, el sistema lo asigna automaticamente al importar.'],
      ['Nombre', 'Obligatorio.'],
      ['RFC', 'Opcional. Puede repetirse entre varias ubicaciones del mismo cliente.'],
      ['No. Equivalencia', 'Opcional.'],
      ['Activo', 'Si o No. Si se deja en blanco se considera Si (activo).'],
      ['Es Patio', 'Si o No.'],
      ['Numero Cliente', 'Opcional. El "Numero Cliente" de un cliente ya existente en el catalogo de Clientes, para vincularlo.'],
      ['Pais', 'Opcional. Si se deja en blanco se usa "Mexico".'],
      ['C.P.', 'Codigo postal (5 digitos). Opcional.'],
      ['Estado', 'Opcional.'],
      ['Municipio', 'Opcional.'],
      ['Colonia', 'Opcional.'],
      ['Localidad', 'Opcional.'],
      ['Calle', 'Opcional.'],
      ['No. Exterior', 'Opcional.'],
      ['No. Interior', 'Opcional.'],
      ['Telefono', 'Opcional.'],
      ['Contacto', 'Opcional.'],
      ['Correo', 'Opcional.'],
    ],
  });
}

export async function leerDestinatariosExcel(
  file: File,
  clientesDisponibles: Cliente[],
): Promise<{ totalFilasHoja: number; filas: FilaImport<Destinatario>[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Destinatarios');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('nombre') ?? -1) === -1) {
    throw new Error('No se encontro la columna "Nombre". Usa la plantilla descargable sin modificar los encabezados.');
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImport<Destinatario>[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const nombre = texto(col('nombre', fila));
    const errores: string[] = [];
    if (!nombre) errores.push('Falta el Nombre.');

    const numeroClienteBuscado = texto(col('numeroCliente', fila));
    let clienteId: string | undefined;
    if (numeroClienteBuscado) {
      const encontrado = clientesDisponibles.find((c) => c.numeroCliente === numeroClienteBuscado);
      if (!encontrado) errores.push(`No se encontro un cliente con Numero Cliente "${numeroClienteBuscado}".`);
      else clienteId = encontrado.id;
    }

    const item: Destinatario = {
      id: uid('dest'),
      numero: texto(col('numero', fila)),
      rfc: texto(col('rfc', fila)).toUpperCase(),
      noEquivalencia: texto(col('noEquivalencia', fila)),
      nombre,
      estatus: col('activo', fila) === null ? 'activo' : booleano(col('activo', fila)) ? 'activo' : 'inactivo',
      esPatio: booleano(col('esPatio', fila)),
      clienteId,
      pais: texto(col('pais', fila)) || 'Mexico',
      estado: texto(col('estado', fila)),
      municipio: texto(col('municipio', fila)),
      cp: texto(col('cp', fila)).replace(/\D/g, ''),
      localidad: texto(col('localidad', fila)),
      colonia: texto(col('colonia', fila)),
      calle: texto(col('calle', fila)),
      numeroExterior: texto(col('numeroExterior', fila)),
      numeroInterior: texto(col('numeroInterior', fila)),
      telefono: texto(col('telefono', fila)),
      contacto: texto(col('contacto', fila)),
      correo: texto(col('correo', fila)),
    };

    filas.push({ fila: i + 1, item, errores });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}

export function marcarDuplicadosDestinatarios(filas: FilaImport<Destinatario>[], existentes: Destinatario[]): FilaImport<Destinatario>[] {
  const vistos = new Set<string>();
  return filas.map((f) => {
    const errores = [...f.errores];
    const numero = f.item.numero.trim();
    if (numero) {
      if (existentes.some((d) => d.numero === numero)) errores.push(`El numero "${numero}" ya existe.`);
      else if (vistos.has(numero)) errores.push(`El numero "${numero}" esta repetido en el archivo.`);
      else vistos.add(numero);
    }
    return errores.length === f.errores.length ? f : { ...f, errores };
  });
}

export async function guardarDestinatariosImportados(items: Destinatario[], onProgreso?: (hecho: number, total: number) => void): Promise<void> {
  await guardarEnLotes('destinatarios', items, destinatarioToRow, onProgreso);
}
