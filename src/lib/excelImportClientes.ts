import { clienteToRow } from './mappers';
import { uid } from './storage';
import { booleano, descargarPlantilla, guardarEnLotes, leerFilasHoja, numero, texto, type FilaImport } from './excelImportShared';
import type { Cliente } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'numero cliente', campo: 'numeroCliente' },
  { clave: 'nombre fiscal', campo: 'nombre' },
  { clave: 'nombre corto', campo: 'nombreCorto' },
  { clave: 'rfc', campo: 'rfc' },
  { clave: 'tipo cliente', campo: 'tipo' },
  { clave: 'moneda', campo: 'moneda' },
  { clave: 'iva', campo: 'iva' },
  { clave: 'grupo', campo: 'grupo' },
  { clave: 'sucursal', campo: 'sucursal' },
  { clave: 'activo', campo: 'activo' },
  { clave: 'operador logistico', campo: 'operadorLogistico' },
  { clave: 'pais', campo: 'pais' },
  { clave: 'c.p.', campo: 'cp' },
  { clave: 'estado', campo: 'estado' },
  { clave: 'municipio', campo: 'municipio' },
  { clave: 'colonia', campo: 'colonia' },
  { clave: 'localidad', campo: 'localidad' },
  { clave: 'calle', campo: 'calle' },
  { clave: 'no. exterior', campo: 'numeroExterior' },
  { clave: 'no. interior', campo: 'numeroInterior' },
  { clave: 'telefonos', campo: 'telefonos' },
  { clave: 'celular', campo: 'celular' },
  { clave: 'correo', campo: 'correo' },
  { clave: 'forma de pago', campo: 'formaPago' },
  { clave: 'dias credito', campo: 'diasCredito' },
  { clave: 'limite credito (pesos)', campo: 'limiteCreditoMxn' },
  { clave: 'limite credito (dolares)', campo: 'limiteCreditoUsd' },
];

const ENCABEZADOS = [
  'Numero Cliente', 'Nombre Fiscal', 'Nombre Corto', 'RFC', 'Tipo Cliente', 'Moneda', 'IVA', 'Grupo', 'Sucursal',
  'Activo', 'Operador Logistico', 'Pais', 'C.P.', 'Estado', 'Municipio', 'Colonia', 'Localidad', 'Calle',
  'No. Exterior', 'No. Interior', 'Telefonos', 'Celular', 'Correo', 'Forma de Pago', 'Dias Credito',
  'Limite Credito (Pesos)', 'Limite Credito (Dolares)',
];

export function descargarPlantillaClientes(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Importar_Clientes.xlsx',
    nombreHojaDatos: 'Clientes',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Clientes',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Clientes".',
      '2. Llena una fila por cada cliente, empezando en la fila 2 (debajo de los encabezados).',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
      '4. El RFC y el Numero Cliente no se pueden repetir; si se dejan en blanco, se generan automaticamente donde aplique.',
    ],
    instrucciones: [
      ['Numero Cliente', 'Opcional. Si se deja en blanco, el sistema lo asigna automaticamente al importar.'],
      ['Nombre Fiscal', 'Obligatorio. Razon social o nombre completo del cliente.'],
      ['Nombre Corto', 'Opcional. Nombre corto o comercial para identificarlo rapido.'],
      ['RFC', 'Obligatorio. No se puede repetir (ni con otro cliente del archivo, ni con uno ya registrado).'],
      ['Tipo Cliente', 'Nacional o Extranjero. Si se deja en blanco se usa Nacional.'],
      ['Moneda', 'MXN o USD. Si se deja en blanco se usa MXN.'],
      ['IVA', 'IVA 16%, IVA 0% o Exento. Si se deja en blanco se usa IVA 16%.'],
      ['Grupo', 'Opcional. Texto libre para agrupar clientes.'],
      ['Sucursal', 'Opcional. Si se deja en blanco se usa "Matriz".'],
      ['Activo', 'Si o No. Si se deja en blanco se considera Si (activo).'],
      ['Operador Logistico', 'Si o No. Si se deja en blanco se considera No.'],
      ['Pais', 'Opcional. Si se deja en blanco se usa "Mexico".'],
      ['C.P.', 'Codigo postal (5 digitos). Opcional, pero ayuda a llenar Estado/Municipio despues.'],
      ['Estado', 'Opcional. Nombre completo del estado (ej. "Jalisco").'],
      ['Municipio', 'Opcional.'],
      ['Colonia', 'Opcional.'],
      ['Localidad', 'Opcional.'],
      ['Calle', 'Opcional.'],
      ['No. Exterior', 'Opcional.'],
      ['No. Interior', 'Opcional.'],
      ['Telefonos', 'Opcional.'],
      ['Celular', 'Opcional.'],
      ['Correo', 'Opcional.'],
      ['Forma de Pago', 'Efectivo, Transferencia o Cheque. Si se deja en blanco se usa Efectivo.'],
      ['Dias Credito', 'Numero de dias de credito otorgados. Si se deja en blanco se usa 0.'],
      ['Limite Credito (Pesos)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Limite Credito (Dolares)', 'Numero. Si se deja en blanco se usa 0.'],
    ],
  });
}

export async function leerClientesExcel(file: File): Promise<{ totalFilasHoja: number; filas: FilaImport<Cliente>[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Clientes');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('nombre') ?? -1) === -1 || (indices.get('rfc') ?? -1) === -1) {
    throw new Error('No se encontraron las columnas "Nombre Fiscal" y/o "RFC". Usa la plantilla descargable sin modificar los encabezados.');
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImport<Cliente>[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const nombre = texto(col('nombre', fila));
    const rfc = texto(col('rfc', fila)).toUpperCase();
    const errores: string[] = [];
    if (!nombre) errores.push('Falta el Nombre Fiscal.');
    if (!rfc) errores.push('Falta el RFC.');

    const item: Cliente = {
      id: uid('cli'),
      numeroCliente: texto(col('numeroCliente', fila)),
      nombre,
      nombreCorto: texto(col('nombreCorto', fila)),
      fechaAlta: new Date().toISOString().slice(0, 10),
      rfc,
      tipo: (texto(col('tipo', fila)) as Cliente['tipo']) || 'Nacional',
      moneda: (texto(col('moneda', fila)).toUpperCase() as Cliente['moneda']) || 'MXN',
      iva: (texto(col('iva', fila)) as Cliente['iva']) || 'IVA 16%',
      grupo: texto(col('grupo', fila)),
      sucursal: texto(col('sucursal', fila)) || 'Matriz',
      estatus: col('activo', fila) === null ? 'activo' : booleano(col('activo', fila)) ? 'activo' : 'inactivo',
      operadorLogistico: booleano(col('operadorLogistico', fila)),
      aplicarDetalleViajeXml: false,
      pais: texto(col('pais', fila)) || 'Mexico',
      cp: texto(col('cp', fila)).replace(/\D/g, ''),
      estado: texto(col('estado', fila)),
      municipio: texto(col('municipio', fila)),
      colonia: texto(col('colonia', fila)),
      localidad: texto(col('localidad', fila)),
      calle: texto(col('calle', fila)),
      numeroExterior: texto(col('numeroExterior', fila)),
      numeroInterior: texto(col('numeroInterior', fila)),
      telefonos: texto(col('telefonos', fila)),
      celular: texto(col('celular', fila)),
      correo: texto(col('correo', fila)),
      contactos: [],
      formaPago: texto(col('formaPago', fila)) || 'Efectivo',
      diasCredito: numero(col('diasCredito', fila)),
      limiteCreditoMxn: numero(col('limiteCreditoMxn', fila)),
      limiteCreditoUsd: numero(col('limiteCreditoUsd', fila)),
      limitarViajes: false,
      limiteFacturasVencidas: null,
      bancoOrdenante: '',
      bancoOrdenanteExtranjero: false,
      bancoRfc: '',
      bancoNoCuenta: '',
    };

    filas.push({ fila: i + 1, item, errores });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}

export function marcarDuplicadosClientes(filas: FilaImport<Cliente>[], existentes: Cliente[]): FilaImport<Cliente>[] {
  const vistosNumero = new Set<string>();
  const vistosRfc = new Set<string>();
  return filas.map((f) => {
    const errores = [...f.errores];
    const numeroCliente = f.item.numeroCliente.trim();
    const rfc = f.item.rfc.trim().toUpperCase();

    if (numeroCliente) {
      if (existentes.some((c) => c.numeroCliente === numeroCliente)) errores.push(`El numero de cliente "${numeroCliente}" ya existe.`);
      else if (vistosNumero.has(numeroCliente)) errores.push(`El numero de cliente "${numeroCliente}" esta repetido en el archivo.`);
      else vistosNumero.add(numeroCliente);
    }
    if (rfc) {
      if (existentes.some((c) => c.rfc.trim().toUpperCase() === rfc)) errores.push(`El RFC "${rfc}" ya existe.`);
      else if (vistosRfc.has(rfc)) errores.push(`El RFC "${rfc}" esta repetido en el archivo.`);
      else vistosRfc.add(rfc);
    }

    return errores.length === f.errores.length ? f : { ...f, errores };
  });
}

export async function guardarClientesImportados(items: Cliente[], onProgreso?: (hecho: number, total: number) => void): Promise<void> {
  await guardarEnLotes('clientes', items, clienteToRow, onProgreso);
}
