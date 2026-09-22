import { proveedorToRow } from './mappers';
import { uid } from './storage';
import { booleano, descargarPlantilla, guardarEnLotes, leerFilasHoja, numero, texto, type FilaImport } from './excelImportShared';
import type { Proveedor } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'numero', campo: 'numero' },
  { clave: 'nombre fiscal', campo: 'nombre' },
  { clave: 'nombre corto', campo: 'nombreCorto' },
  { clave: 'rfc', campo: 'rfc' },
  { clave: 'tipo', campo: 'tipo' },
  { clave: 'activo', campo: 'activo' },
  { clave: 'proveedor de combustible', campo: 'esProveedorCombustible' },
  { clave: 'proveedor de bienes', campo: 'proveedorBienes' },
  { clave: 'proveedor de servicios', campo: 'proveedorServicios' },
  { clave: 'grupo', campo: 'grupo' },
  { clave: 'tipo de operacion', campo: 'tipoOperacion' },
  { clave: 'tipo de tercero', campo: 'tipoTercero' },
  { clave: 'short name sap', campo: 'shortNameSap' },
  { clave: 'pais', campo: 'pais' },
  { clave: 'c.p.', campo: 'cp' },
  { clave: 'estado', campo: 'estado' },
  { clave: 'municipio', campo: 'municipio' },
  { clave: 'colonia', campo: 'colonia' },
  { clave: 'localidad', campo: 'localidad' },
  { clave: 'calle', campo: 'calle' },
  { clave: 'no. exterior', campo: 'numeroExterior' },
  { clave: 'no. interior', campo: 'numeroInterior' },
  { clave: 'correo', campo: 'correo' },
  { clave: 'telefonos', campo: 'telefonos' },
  { clave: 'celular', campo: 'celular' },
  { clave: 'forma de pago', campo: 'formaPago' },
  { clave: 'dias credito', campo: 'diasCredito' },
  { clave: 'limite credito (pesos)', campo: 'limiteCreditoMxn' },
  { clave: 'limite credito (dolares)', campo: 'limiteCreditoUsd' },
];

const ENCABEZADOS = [
  'Numero', 'Nombre Fiscal', 'Nombre Corto', 'RFC', 'Tipo', 'Activo', 'Proveedor de Combustible',
  'Proveedor de Bienes', 'Proveedor de Servicios', 'Grupo', 'Tipo de Operacion', 'Tipo de Tercero', 'Short Name SAP',
  'Pais', 'C.P.', 'Estado', 'Municipio', 'Colonia', 'Localidad', 'Calle', 'No. Exterior', 'No. Interior', 'Correo',
  'Telefonos', 'Celular', 'Forma de Pago', 'Dias Credito', 'Limite Credito (Pesos)', 'Limite Credito (Dolares)',
];

export function descargarPlantillaProveedores(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Importar_Proveedores.xlsx',
    nombreHojaDatos: 'Proveedores',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Proveedores',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Proveedores".',
      '2. Llena una fila por cada proveedor, empezando en la fila 2 (debajo de los encabezados).',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
      '4. El RFC y el Numero no se pueden repetir; si se dejan en blanco, se generan automaticamente donde aplique.',
    ],
    instrucciones: [
      ['Numero', 'Opcional. Si se deja en blanco, el sistema lo asigna automaticamente al importar.'],
      ['Nombre Fiscal', 'Obligatorio. Razon social o nombre completo del proveedor.'],
      ['Nombre Corto', 'Opcional.'],
      ['RFC', 'Obligatorio. No se puede repetir (ni con otro proveedor del archivo, ni con uno ya registrado).'],
      ['Tipo', 'Nacional o Extranjero. Si se deja en blanco se usa Nacional.'],
      ['Activo', 'Si o No. Si se deja en blanco se considera Si (activo).'],
      ['Proveedor de Combustible', 'Si o No.'],
      ['Proveedor de Bienes', 'Si o No.'],
      ['Proveedor de Servicios', 'Si o No.'],
      ['Grupo', 'Opcional. Texto libre para agrupar proveedores.'],
      ['Tipo de Operacion', 'Opcional.'],
      ['Tipo de Tercero', 'Opcional.'],
      ['Short Name SAP', 'Opcional.'],
      ['Pais', 'Opcional. Si se deja en blanco se usa "Mexico".'],
      ['C.P.', 'Codigo postal (5 digitos). Opcional.'],
      ['Estado', 'Opcional.'],
      ['Municipio', 'Opcional.'],
      ['Colonia', 'Opcional.'],
      ['Localidad', 'Opcional.'],
      ['Calle', 'Opcional.'],
      ['No. Exterior', 'Opcional.'],
      ['No. Interior', 'Opcional.'],
      ['Correo', 'Opcional.'],
      ['Telefonos', 'Opcional.'],
      ['Celular', 'Opcional.'],
      ['Forma de Pago', 'Efectivo, Transferencia o Cheque. Si se deja en blanco se usa Efectivo.'],
      ['Dias Credito', 'Numero de dias de credito otorgados. Si se deja en blanco se usa 0.'],
      ['Limite Credito (Pesos)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Limite Credito (Dolares)', 'Numero. Si se deja en blanco se usa 0.'],
    ],
  });
}

export async function leerProveedoresExcel(file: File): Promise<{ totalFilasHoja: number; filas: FilaImport<Proveedor>[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Proveedores');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('nombre') ?? -1) === -1 || (indices.get('rfc') ?? -1) === -1) {
    throw new Error('No se encontraron las columnas "Nombre Fiscal" y/o "RFC". Usa la plantilla descargable sin modificar los encabezados.');
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImport<Proveedor>[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const nombre = texto(col('nombre', fila));
    const rfc = texto(col('rfc', fila)).toUpperCase();
    const errores: string[] = [];
    if (!nombre) errores.push('Falta el Nombre Fiscal.');
    if (!rfc) errores.push('Falta el RFC.');

    const item: Proveedor = {
      id: uid('prov'),
      numero: texto(col('numero', fila)),
      fecha: new Date().toISOString().slice(0, 10),
      estatus: col('activo', fila) === null ? 'activo' : booleano(col('activo', fila)) ? 'activo' : 'inactivo',
      tipo: (texto(col('tipo', fila)) as Proveedor['tipo']) || 'Nacional',
      rfc,
      nombre,
      nombreCorto: texto(col('nombreCorto', fila)),
      esProveedorCombustible: booleano(col('esProveedorCombustible', fila)),
      proveedorBienes: booleano(col('proveedorBienes', fila)),
      proveedorServicios: booleano(col('proveedorServicios', fila)),
      grupo: texto(col('grupo', fila)),
      tipoOperacion: texto(col('tipoOperacion', fila)),
      tipoTercero: texto(col('tipoTercero', fila)),
      shortNameSap: texto(col('shortNameSap', fila)),
      pais: texto(col('pais', fila)) || 'Mexico',
      estado: texto(col('estado', fila)),
      cp: texto(col('cp', fila)).replace(/\D/g, ''),
      municipio: texto(col('municipio', fila)),
      colonia: texto(col('colonia', fila)),
      localidad: texto(col('localidad', fila)),
      calle: texto(col('calle', fila)),
      numeroExterior: texto(col('numeroExterior', fila)),
      numeroInterior: texto(col('numeroInterior', fila)),
      correo: texto(col('correo', fila)),
      telefonos: texto(col('telefonos', fila)),
      celular: texto(col('celular', fila)),
      nextel: '',
      formaPago: texto(col('formaPago', fila)) || 'Efectivo',
      diasCredito: numero(col('diasCredito', fila)),
      limiteCreditoMxn: numero(col('limiteCreditoMxn', fila)),
      limiteCreditoUsd: numero(col('limiteCreditoUsd', fila)),
      banco: '',
      cuentaClabe: '',
      noCuenta: '',
      documentos: [],
    };

    filas.push({ fila: i + 1, item, errores });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}

export function marcarDuplicadosProveedores(filas: FilaImport<Proveedor>[], existentes: Proveedor[]): FilaImport<Proveedor>[] {
  const vistosNumero = new Set<string>();
  const vistosRfc = new Set<string>();
  return filas.map((f) => {
    const errores = [...f.errores];
    const numero = f.item.numero.trim();
    const rfc = f.item.rfc.trim().toUpperCase();

    if (numero) {
      if (existentes.some((p) => p.numero === numero)) errores.push(`El numero "${numero}" ya existe.`);
      else if (vistosNumero.has(numero)) errores.push(`El numero "${numero}" esta repetido en el archivo.`);
      else vistosNumero.add(numero);
    }
    if (rfc) {
      if (existentes.some((p) => p.rfc.trim().toUpperCase() === rfc)) errores.push(`El RFC "${rfc}" ya existe.`);
      else if (vistosRfc.has(rfc)) errores.push(`El RFC "${rfc}" esta repetido en el archivo.`);
      else vistosRfc.add(rfc);
    }

    return errores.length === f.errores.length ? f : { ...f, errores };
  });
}

export async function guardarProveedoresImportados(items: Proveedor[], onProgreso?: (hecho: number, total: number) => void): Promise<void> {
  await guardarEnLotes('proveedores', items, proveedorToRow, onProgreso);
}
